// STUN, TURN Servers
var iceServer = {
	iceServers : [
	{
		urls : 'turn:turn1.nplab.de:3478',
		username: 'tiny',
		credential : 'turner'
	}, {
		urls : 'turn:turn2.nplab.de:3478',
		username: 'tiny',
		credential : 'turner'
	}, {
		urls : 'stun:stun.l.google.com:19302'
	}, {
		urls : 'stun:stun1.l.google.com:19302'
	}, {
		urls : 'stun:stun2.l.google.com:19302'
	}, {
		urls : 'stun:stun3.l.google.com:19302'
	}, {
		urls : 'stun:stun4.l.google.com:19302'
	}]
};

var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription;

// generate a unique-ish string for storage in firebase
function generateSignalingId() {
	return (Math.random() * 10000| 0).toString();
}

var connected = 0;
var sdpConstraints = { "audio": true, "video": true };

document.getElementById("enteruser").style.display = "none";

navigator.getMedia = navigator.getUserMedia|| navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

var localstream;
var user = 0;
var i = 0;
var x = 0;
var peer1ID;
var localwebcam = document.getElementById("local");

navigator.getMedia(sdpConstraints, function(stream) {
	localwebcam.src = URL.createObjectURL(stream);
	localwebcam.muted = true;
	localstream = stream;
}, errorHandler);	

// Reference to Firebase APP
var dbRef = new Firebase("https://webrtcchatv.firebaseio.com/");

var bufferedAmountLimit = 1 * 1024 * 1024;

var chatnanme = "unkown";
document.getElementById("eingabe").style.display = "none";
document.getElementById("chatarea").style.display = "none";
document.getElementById("download").style.display = "none";
document.getElementById("upload").style.display = "none";
document.getElementById("sendfile").style.display = "none";  	
var arrayToStoreChunks = [];
var pc = new Array();
pc[0] = new PeerConnection(iceServer);
var peerRole = "offerer";
var role = "answerer";
var signalingId;
var freshsignalingId = generateSignalingId();
var signalingIdRef = dbRef.child("roomIDs");
var peerIp = new Array();
var peerID = new Array();
var dcControl = new Array();
dcControl[0] = {};
var zaehler = 0;
var dVideos = $('#dVideos'); 

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
	i++;
	console.log('chatConnectTosignalingId');
	signalingId = $("#signalingId").val();
	role = "answerer";
	peerRole = "offerer";
	
	console.log('connecting to peer:' + signalingId);
	chatConnect();
}

function chatConnectTosignalingIdFromUrl() {
	console.log('chatConnectTosignalingId');
	role = "answerer";
	peerRole = "offerer";

	console.log('connecting to peer:' + signalingId);
	chatConnect();
} 

function chatConnect() {
	dcControl[i] = {};
	pc[i] = new PeerConnection(iceServer);
	pc[i].addStream(localstream);
	pc[i].oniceconnectionstatechange = function(event) 
	{ 
		console.log("oniceconnectionstatechange1 - " + pc[i].iceConnectionState);
	
		if (pc[i].iceConnectionState == 'disconnected') {
			chatConnectionLost();
		}
	};
	
	pc[i].onaddstream = function (obj) 
	{
		console.log("got stream");
		user++;
		var video = document.createElement('video');
		dVideos.append("<video id='v" + user + "' height='400px' width='400px' src='" + URL.createObjectURL(obj.stream)+"' autoplay>");
	};
	
	// handle local ice candidates
	pc[i].onicecandidate = function(event) 
	{
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
	document.getElementById("ausgabe").value = signalingId;
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
		document.getElementById("IDS").value = document.getElementById("IDS").value + signalingId + "\r\n";
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
		zaehler++;
		if(zaehler == 1)
		{
			//document.getElementById("IDS").value = document.getElementById("IDS").value + signalingId + ": " + dcControl[i].readyState + "\r\n";
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
	console.log("Connection lost");
}

function setmessage(nachricht)
{
	document.getElementById("chatarea").value = nachricht;
	chatarea.scrollTop = chatarea.scrollHeight;
}


function sendfile()
{
	var file = document.getElementById('upload').files[0];            
    var reader = new window.FileReader();
	reader.readAsDataURL(file);
	reader.onload = onReadAsDataURL;        
}
    
function setfile(file){
    arrayToStoreChunks.push(file.message); // pushing chunks in array
    console.log("added chunck");

    if (file.last) {
        SaveToDisk(arrayToStoreChunks.join(''), file.filename);
        arrayToStoreChunks = []; // resetting array
    }
}

function msgHandleJson(message) {
	var messageObject = JSON.parse(message);
	switch(messageObject.type) {
	
	// peer indicates finish
	case 'msg':
		setmessage(messageObject.nachricht);
	break;
	
	case 'file' :
		 setfile(messageObject);
	break;
	
	default:
		alert('Unknown messagetype: ' + messageObject.type);
		break;
	}
}

$('#name').keypress(function (e) {
	if (e.which == 13) {
	
	test = document.getElementById("name").value;
	  	if(test.length != 0)
	  	{
	  		username = document.getElementById("name").value;
	  		document.getElementById("enteruser").style.display = "none";
	  		document.getElementById("eingabe").style.display = "block";
			document.getElementById("chatarea").style.display = "block";
	  		document.getElementById("eingabe").focus();
	  		
	  	}
  	}
});


$('#eingabe').keypress(function (e) {
	if (e.which == 13) {
	  	var eingabemsg = document.getElementById("eingabe").value;
		document.getElementById("chatarea").value = document.getElementById("chatarea").value + username + " :" + eingabemsg + "\r\n";
		nachricht = document.getElementById("chatarea").value;
	
		var peermsg = {
							type : 'msg',
							nachricht : nachricht 
						};
						
						
		for (var y = 0; y <= i; y++)
 		{
 			dcControl[i].send(JSON.stringify(peermsg));
 		}	
		
		document.getElementById("eingabe").value = "";
  	}
});   

function onReadAsDataURL(event, text) {
	var filename = document.getElementById('upload').files[0].name;
    var data = {
    	type : 'file',
    	filename : filename
    }; // data object to transmit over data channel
    var chunkLength = 16384;

    if (event) text = event.target.result; // on first invocation
    if (text.length > chunkLength) {
        data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
    } else {
    	
        data.message = text;
        data.last = true;
    }
   for (var y = 0; y <= i; y++)
 	{
 		dcControl[i].send(JSON.stringify(data));
 	}

    var remainingDataURL = text.slice(data.message.length);
    if (remainingDataURL.length) setTimeout(function () {
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
