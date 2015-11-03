// Reference to Firebase APP
var dbRef = new Firebase("https://webrtcchatv.firebaseio.com/");

var localwebcam = document.getElementById("local");
var eingabe = $('#eingabe');
var localrole;
var localstream;
var i = 0;
var cam = 0;
var zaehler = 1;
var dVideos = $('#dVideos');
var bufferedAmountLimit = 1 * 1024 * 1024;
var remoteID;
var chatnanme = "unkown";
var arrayToStoreChunks = [];
var pc = new Array();
var peerRole = "offerer";
var role = "answerer";
var signalingId;
var freshsignalingId = generateSignalingId();
var signalingIdRef = dbRef.child("roomIDs");
var peerIp = new Array();
var peerID = new Array();
var dcControl = new Array();
var sdpConstraints = {
	"audio" : true,
	"video" : true
};
pc[0] = new PeerConnection(iceServer);
dcControl[0] = {};
document.getElementById("dChatRow").style.display = "none";
document.getElementById("download").style.display = "none";
document.getElementById("upload").style.display = "none";
document.getElementById("sendfile").style.display = "none";
document.getElementById("enteruser").style.display = "none";

navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

//get Video/Audio
navigator.getMedia(sdpConstraints, function(stream) {
	localwebcam.src = URL.createObjectURL(stream);
	localstream = stream;
	cam++;
}, errorHandler);

// clean firebase ref
signalingIdRef.child(freshsignalingId).remove();

// wrapper to send data to FireBase
function firebaseSend(signalingId, key, data) {
	signalingIdRef.child(signalingId).child(key).set(data);
	console.log('firebaseSend - ' + key + ' - ' + data);
}

// wrapper function to receive data from FireBase - with callback function
function firebaseReceive(signalingId, type, cb) {
	signalingIdRef.child(signalingId).child(type).on("value", function(snapshot, key) {
		var data = snapshot.val();
		if (data) {
			cb(data);
			console.log('firebaseReceive - ' + type + ' - ' + data);
		}
	});
}

// generic error handler
function errorHandler(err) {
	console.error(err);
}

function chatCreateSignalingId() {
	if (i == 0) {
		localrole = 'offerer';
	}
	i++;

	freshsignalingId = generateSignalingId();
	console.log('chatCreateSignalingId');
	signalingId = freshsignalingId;
	role = "offerer";
	peerRole = "answerer";

	console.log('creating signaling id:' + signalingId);
	chatConnect();
}

function chatConnectTosignalingId() {
	if (i == 0) {
		localrole = 'answerer';
	}
	i++;
	console.log('chatConnectTosignalingId');
	signalingId = $("#signalingId").val();
	role = "answerer";
	peerRole = "offerer";

	console.log('connecting to peer:' + signalingId);
	chatConnect();
}

function chatConnect() {
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
		console.log("got stream");
		var video = document.createElement('video');
		dVideos.append("<video id='v" + i + "' height='400px' width='400px' src='" + URL.createObjectURL(obj.stream) + "' autoplay>");
	};

	// handle local ice candidates
	pc[i].onicecandidate = function(event) {
		// take the first candidate that isn't null
		if (!pc[i] || !event || !event.candidate) {
			return;
		}
		var ip = extractIpFromString(event.candidate.candidate);
		// add local ice candidate to firebase
		signalingIdRef.child(signalingId).child(role + '-iceCandidates').push(JSON.stringify(event.candidate));
		console.log('onicecandidate - ip:' + ip);
	};

	if (role === "offerer") {
		$("#rowInit").slideUp();
		$("#rowSpinner").slideDown();
		$(".spinnerStatus").html('waiting for peer<br/>use id: ' + signalingId + '<br/><br/><div id="qrcode"></div>');

		new QRCode(document.getElementById("qrcode"), window.location.href + '#' + signalingId);

		$("#rowSpinner").removeClass('hidden').hide().slideDown();
		dcControl[i] = pc[i].createDataChannel('control');
		bindEventsControl(dcControl[i]);

		// create the offer SDP
		pc[i].createOffer(function(offer) {
			pc[i].setLocalDescription(offer);

			// send the offer SDP to FireBase
			firebaseSend(signalingId, "offer", JSON.stringify(offer));

			// wait for an answer SDP from FireBase
			firebaseReceive(signalingId, "answer", function(answer) {
				pc[i].setRemoteDescription(new SessionDescription(JSON.parse(answer)));
			});
		}, errorHandler, sdpConstraints);
		console.log("connect - role: offerer");
		// answerer role
	} else {
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

		// answerer needs to wait for an offer before generating the answer SDP
		firebaseReceive(signalingId, "offer", function(offer) {
			pc[i].setRemoteDescription(new SessionDescription(JSON.parse(offer)));

			// now we can generate our answer SDP
			pc[i].createAnswer(function(answer) {
				pc[i].setLocalDescription(answer);

				// send it to FireBase
				firebaseSend(signalingId, "answer", JSON.stringify(answer));
			}, errorHandler);
		});
		// add handler for peers ice candidates
		signalingIdRef.child(signalingId).child(peerRole + '-iceCandidates').on('child_added', function(childSnapshot) {
			var childVal = childSnapshot.val();
			var peerCandidate = JSON.parse(childVal);
			var peerIceCandidate = new IceCandidate(peerCandidate);
			pc[i].addIceCandidate(new IceCandidate(peerCandidate));

			peerIp[i] = extractIpFromString(peerIceCandidate.candidate);
			console.log('peerIceCandidate for pc: ' + peerIp[i]);
		});
	}
}

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
			document.getElementById("enteruser").style.display = "block";
			document.getElementById("upload").style.display = "block";
			document.getElementById("sendfile").style.display = "block";
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
	$('#tChat tr:last').after('<tr class="danger"><td>Warning</td><td>Lost Connection to a peer</td></tr>');
	$("#tChat tr:last").focus();
	console.log("Connection lost");
}

function setmessage(username, message) {
	$('#tChat tr:last').after('<tr class="warning"><td>' + username + '</td><td>' + message + '</td></tr>');
	$("#tChat tr:last").focus();
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
		SaveToDisk(arrayToStoreChunks.join(''), file.filename);
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

		test = document.getElementById("name").value;
		if (test.length != 0) {
			username = document.getElementById("name").value;
			document.getElementById("enteruser").style.display = "none";
			document.getElementById("dChatRow").style.display = "block";
			document.getElementById("eingabe").focus();

		}
	}
});

$('#eingabe').keypress(function(e) {
	if (e.which == 13) {
		if (eingabe.val().length != 0) {
			$('#tChat tr:last').after('<tr class="success"><td>You</td><td>' + eingabe.val() + '</td></tr>');
			var peermsg = {
				type : 'msg',
				username : username,
				message : eingabe.val()
			};

			for (var y = 1; y <= i; y++) {
				dcControl[y].send(JSON.stringify(peermsg));
			}
			$("#tChat tr:last").focus();
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
	}
	for (var y = 1; y <= i; y++) {
		dcControl[y].send(JSON.stringify(data));
	}

	var remainingDataURL = text.slice(data.message.length);
	if (remainingDataURL.length)
		setTimeout(function() {
			onReadAsDataURL(null, remainingDataURL);
		}, 1);
}

function SaveToDisk(fileUrl, fileName) {
	var save = document.getElementById('download');
	save.href = fileUrl;
	save.target = '_blank';
	save.download = fileName || fileUrl;
	save.text = "Download: " + fileName;
	document.getElementById("download").style.display = "block";
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
