var socket = io("https://webrtc.nplab.de/");
var appIdent = 'signaling';

var localwebcam = document.getElementById("local");
var eingabe = $('#eingabe');
var localrole;
var localstream;
var i = 0;
var cam = 0;
var zaehler = 1;
var dVideos = $('#dVideos');
var peerVideos = $('#peerVideos');
var bufferedAmountLimit = 1 * 1024 * 1024;
var remoteID;
var chatnanme = "unkown";
var arrayToStoreChunks = [];
var pc = new Array();
var role = "answerer";
var signalingId;
var freshsignalingId = generateSignalingId();
var peerIp = new Array();
var peerID = new Array();
var dcControl = new Array();
var offerer;
var signalingInProgress = false;
var sdpConstraints = {
	offerToReceiveAudio : true,
	offerToReceiveVideo : true
};
pc[0] = new PeerConnection(iceServer);
dcControl[0] = {};
$("#dChatRow").hide();
$("#download").hide();
$("#upload").hide();
$("#sendfile").hide();
$("#enteruser").hide();
$("#dVideos").css("position", "relative");

// handle incoming info messages from server
socket.on('info', function(msg) {
	console.log('server info: ' + msg);
});

navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

//get Video/Audio
navigator.getMedia({
	audio : true,
	video : true
}, function(stream) {
	localwebcam.src = URL.createObjectURL(stream);
	localstream = stream;
	cam++;
}, errorHandler);

// generic error handler
function errorHandler(err) {
	console.error(err);
}

function chatCreateSignalingId() {
	signalingInProgress = true;
	if (i == 0) {
		localrole = 'offerer';
	}
	i++;

	freshsignalingId = generateSignalingId();
	console.log('chatCreateSignalingId');
	signalingId = freshsignalingId;
	role = "offerer";

	console.log('creating signaling id:' + signalingId);
	chatConnect();
}

function chatConnectTosignalingId() {
	signalingId = $("#signalingId").val();
	if (signalingId.length === 0) {
		console.log('signalingId empty');
		return;
	}
	signalingInProgress = true;
	if (i == 0) {
		localrole = 'answerer';
	}
	i++;
	console.log('chatConnectTosignalingId');
	role = "answerer";

	console.log('connecting to peer:' + signalingId);
	chatConnect();
}

function chatConnect() {
	socket.emit('roomJoin', appIdent + signalingId);
	dcControl[i] = {};
	pc[i] = new PeerConnection(iceServer);
	if (cam == 1) {
		pc[i].addStream(localstream);
	}

	pc[i].oniceconnectionstatechange = function(event) {
		console.log("oniceconnectionstatechange - " + i + pc[i].iceConnectionState);

		if (pc[i].iceConnectionState == 'disconnected') {
			chatConnectionLost();
		}
	};

	pc[i].onaddstream = function(obj) {
		if (i >= 2) {
			console.log("got stream");
			peerVideos.append("<video id='v" + i + "' height='25%' width='25%' src='" + URL.createObjectURL(obj.stream) + "' autoplay>");

			$(document).on('click', '#v' + i + '', function edit_event(event_data) {
				var source = v1.src;
				$('#v1').attr('src', event_data.target.src);
				event_data.target.src = source;
			});
		} else {
			console.log("got stream");
			dVideos.append("<video id='v" + i + "' height='100%' width='100%' src='" + URL.createObjectURL(obj.stream) + "' autoplay>");
			$("#local").css("padding-left", "80%");
			$("#local").css("padding-top", "60%");
			$("#local").css("position", "absolute");
		}
	};

	// handle local ice candidates
	pc[i].onicecandidate = function(event) {
		// take the first candidate that isn't null
		if (!pc[i] || !event || !event.candidate) {
			return;
		}
		var ip = extractIpFromString(event.candidate.candidate);
		socket.emit('signaling', {
			type : 'ice',
			payload : event.candidate
		});
		console.log('onicecandidate - ip:' + ip);
	};

	if (role === "offerer") {
		$("#chatConnectToSignalingId").slideUp();
		$("#rowInit").slideUp();
		$("#rowSpinner").slideDown();
		$(".spinnerStatus").html('waiting for peer<br/>use id: ' + signalingId + '<br/><br/><div id="qrcode"></div>');

		new QRCode(document.getElementById("qrcode"), window.location.href + '#' + signalingId);

		$("#rowSpinner").removeClass('hidden').hide().slideDown();
		dcControl[i] = pc[i].createDataChannel('control');
		bindEventsControl(dcControl[i]);
		console.log("connect - role: offerer");
		// answerer role
	} else {
		$("#chatCreateSignalingId").slideUp();
		socket.emit('signaling', {
			type : 'sdpRequest'
		});
		// answerer must wait for the data channel
		pc[i].ondatachannel = function(event) {
			if (event.channel.label == "control") {
				dcControl[i] = event.channel;
				bindEventsControl(event.channel);
			} else {
				alert("error: unknown channel!");
			}

			console.log('incoming datachannel');
		};
	}
}

socket.on('signaling', function(msg) {
	if (!signalingInProgress) {
		console.log('signaling - error: no signaling in progress...');
		return;
	}

	switch(msg.type) {
	// answerer requests SDP-Offer
	case 'sdpRequest':
		if (role == 'offerer') {
			pc[i].createOffer(function(offer) {
				pc[i].setLocalDescription(offer);
				console.log(JSON.stringify(offer));
				socket.emit('signaling', {
					type : 'sdp',
					payload : offer
				});
			}, errorHandler, sdpConstraints);
		} else {
			console.log('error: got sdpRequest as answerer...');
		}
		break;

	// we receive an sdp message
	case 'sdp':
		// only process message if it's an offer and we aren't offerer and signaling hasn't finished yet
		if (msg.payload.type === 'offer' && role != 'offerer') {
			pc[i].setRemoteDescription(new SessionDescription(msg.payload));
			// generate our answer SDP and send it to peer
			pc[i].createAnswer(function(answer) {
				pc[i].setLocalDescription(answer);
				socket.emit('signaling', {
					type : 'sdp',
					payload : answer
				});
			}, errorHandler);
			console.log('signaling - handle sdp offer and send answer');
			// if we receive a sdp answer, we are the answerer and signaling isn't done yet, process answer
		} else if (msg.payload.type === 'answer' && role == 'offerer') {
			pc[i].setRemoteDescription(new SessionDescription(msg.payload));
			console.log('signaling - handle sdp answer');
		} else {
			console.log('signaling - unexpected message');
		}
		break;
	// we receive an ice candidate
	case 'ice':
		var peerIceCandidate = new IceCandidate(msg.payload);
		pc[i].addIceCandidate(peerIceCandidate);
		console.log('singaling - remote ice candiate: ' + extractIpFromString(msg.payload.candidate));
		break;
	}
});

// find and return an IPv4 Address from a given string
function extractIpFromString(string) {
	console.log(string);
	var pattern = '(?:25[0-5]|2[0-4][0-9]|1?[0-9][0-9]{1,2}|[0-9]){1,}(?:\\.(?:25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}|0)){3}';
	var match = string.match(pattern);
	return match[0];
}

function bindEventsControl(channel) {
	channel.onopen = function() {
		$("#rowSpinner").slideUp();
		$("#rowInit").slideDown();

		if (i > 1 && localrole == 'offerer') {
			zaehler = 1;
			getID();
		}

		if (i == 1) {
			$("#enteruser").show();
			$("#name").val("Stranger");
			username = "Stranger";
			$("#dChatRow").show();
			$("#eingabe").focus();
			$("#upload").show();
			$("#sendfile").show();
		}
		console.log("Channel Open - Label:" + channel.label + ', ID:' + channel.id);
	};

	channel.onclose = function(e) {
		console.log("Channel Close");
		chatConnectionLost();

	};

	window.onbeforeunload = function() {
		channel.close();
	};

	channel.onmessage = function(e) {
		msgHandleJson(e.data.toString());
	};
}

function chatConnectionLost() {
	$('#tChat tr:last').after('<tr class="danger"><td>Warning: Lost Connection to a peer</td></tr>');
	var height = $('#tChat').height();
	$('#dChatTable').animate({
		scrollTop : height
	});
	console.log("Connection lost");
}

function setmessage(username, message) {
	$('#tChat tr:last').after('<tr class="warning"><td>' + username + ": " + message + '</td></tr>');
	var height = $('#tChat').height();
	$('#dChatTable').animate({
		scrollTop : height
	});
}

function sendfile() {
	var file = document.getElementById('upload').files[0];

	var reader = new window.FileReader();
	reader.readAsDataURL(file);
	reader.onload = onReadAsDataURL;
}

function setfile(file) {
	arrayToStoreChunks.push(file.message);
	// pushing chunks in array
	console.log("added chunck");

	if (file.last) {
		dataURLtoBlob(arrayToStoreChunks.join(''), file.filename);
		arrayToStoreChunks = [];
		// resetting array
	}
}

function msgHandleJson(message) {
	var messageObject = JSON.parse(message);
	switch(messageObject.type) {

	// peer indicates finish
	case 'msg':
		setmessage(messageObject.username, messageObject.message);
		break;

	case 'file' :
		setfile(messageObject);
		break;

	case 'createid' :
		freshsignalingId = generateSignalingId();

		var ID = {
			type : 'ID',
			ID : freshsignalingId
		};
		dcControl[1].send(JSON.stringify(ID));
		i++;
		signalingId = freshsignalingId;
		console.log('chatCreateSignalingId');
		role = "offerer";
		peerRole = "answerer";
		console.log('creating signaling id:' + signalingId);
		chatConnect();
		break;

	case 'ID' :
		remoteID = messageObject.ID;
		console.log("got ID: " + remoteID);
		var RConnect = {
			type : 'RConnect',
			ID : remoteID
		};
		dcControl[i].send(JSON.stringify(RConnect));
		setTimeout(function() {
			getID();
		}, 1000);
		break;

	case 'RConnect' :
		console.log("connecting to other peers");
		i++;
		console.log('chatConnectTosignalingId');
		signalingId = messageObject.ID;
		role = "answerer";
		peerRole = "offerer";
		console.log('connecting to peer:' + signalingId);
		chatConnect();
		break;

	default:
		alert('Unknown messagetype: ' + messageObject.type);
		break;
	}
}


$('#name').keypress(function(e) {
	if (e.which == 13) {
		$("#eingabe").focus();
	}
});

$('#name').focusout(function(e) {
	test = document.getElementById("name").value;
	if (test.length != 0) {
		var oldname = username;
		username = document.getElementById("name").value;
		$('#tChat tr:last').after('<tr class="success"><td>' + "You changed your Username to: " + username + '</td></tr>');
		var peermsg = {
			type : 'msg',
			username : oldname,
			message : "has changed his Username to " + username
		};
		for (var y = 1; y <= i; y++) {
			dcControl[y].send(JSON.stringify(peermsg));
		}
	}
});

$('#eingabe').keypress(function(e) {
	if (e.which == 13) {
		if (eingabe.val().length != 0) {
			$('#tChat tr:last').after('<tr class="success"><td>' + username + ": " + eingabe.val() + '</td></tr>');
			var peermsg = {
				type : 'msg',
				username : username,
				message : eingabe.val()
			};

			for (var y = 1; y <= i; y++) {
				dcControl[y].send(JSON.stringify(peermsg));
			}
			var height = $('#tChat').height();
			$('#dChatTable').animate({
				scrollTop : height
			});
			eingabe.val("");
		}
	}
});

function onReadAsDataURL(event, text) {
	var filename = document.getElementById('upload').files[0].name;
	var data = {
		type : 'file',
		filename : filename
	};
	// data object to transmit over data channel
	var chunkLength = 16384;

	if (event)
		text = event.target.result;
	// on first invocation
	if (text.length > chunkLength) {
		data.message = text.slice(0, chunkLength);
		// getting chunk using predefined chunk length
	} else {

		data.message = text;
		data.last = true;
		console.log("done sending");
	}
	for (var y = 1; y <= i; y++) {
		console.log("sending chunk");
		dcControl[y].send(JSON.stringify(data));
	}

	var remainingDataURL = text.slice(data.message.length);
	if (remainingDataURL.length)
		setTimeout(function() {
			onReadAsDataURL(null, remainingDataURL);
		}, 0);
}

function SaveToDisk(fileUrl, fileName) {
	var save = document.getElementById('download');
	save.href = URL.createObjectURL(fileUrl);
	save.target = '_blank';
	save.download = fileName;
	save.text = "Download: " + fileName;
	$("#download").show();
}

function getID() {
	var createid = {
		type : 'createid'
	};

	if (zaehler != i) {
		dcControl[zaehler].send(JSON.stringify(createid));
		zaehler++;
	}
}

function dataURLtoBlob(dataURL, filename) {

	var byteString = atob(dataURL.split(',')[1]);

	var mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];

	var ab = new ArrayBuffer(byteString.length);
	var ia = new Uint8Array(ab);
	for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}

	var blob = new Blob([ab], {
		type : mimeString
	});
	SaveToDisk(blob, filename);
}