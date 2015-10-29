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

var user = 0;
var peer1ID;
var localwebcam = document.getElementById("local");
var remotewebcam = document.getElementById("remote");
var remotewebcam2 = document.getElementById("2ndremote");
navigator.getMedia(sdpConstraints, function(stream) {
	localwebcam.src = URL.createObjectURL(stream);
	localwebcam.muted = true;
	localstream = stream;
	pc1.addStream(localstream);
	pc2.addStream(localstream);
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
var pc1 = new PeerConnection(iceServer);
var pc2 = new PeerConnection(iceServer);
var peerRole = "offerer";
var role = "answerer";
var signalingId;
var freshsignalingId = generateSignalingId();
var signalingIdRef = dbRef.child("roomIDs");
var dcControl1 = {};
var dcControl2 = {};
var zaehler = 0;

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

// handle local ice candidates
pc1.onicecandidate = function(event) {
	// take the first candidate that isn't null
	if (!pc1 || !event || !event.candidate) {
		return;
	}

	var ip = extractIpFromString(event.candidate.candidate);

	// add local ice candidate to firebase
	signalingIdRef.child(signalingId).child(role + '-iceCandidates').push(JSON.stringify(event.candidate));

	console.log('onicecandidate - ip:' + ip);
};

pc2.onicecandidate = function(event) {
	// take the first candidate that isn't null
	if (!pc2 || !event || !event.candidate) {
		return;
	}

	var ip = extractIpFromString(event.candidate.candidate);

	// add local ice candidate to firebase
	signalingIdRef.child(signalingId).child(role + '-iceCandidates').push(JSON.stringify(event.candidate));

	console.log('onicecandidate - ip:' + ip);
};

pc1.oniceconnectionstatechange = function(event) { 
	console.log("oniceconnectionstatechange1 - " + pc1.iceConnectionState);

	if (pc1.iceConnectionState == 'disconnected') {
		chatConnectionLost();
	}
};
pc2.oniceconnectionstatechange = function(event) { 
	console.log("oniceconnectionstatechange2 - " + pc2.iceConnectionState);
	
	if (pc2.iceConnectionState === 'disconnected') {
		chatConnectionLost();
	}
};


function chatCreateSignalingId() {
	console.log('chatCreateSignalingId');
	signalingId = freshsignalingId;
	role = "offerer";
	peerRole = "answerer";

	console.log('creating signaling id:' + signalingId);
	chatConnect();
}

function chatConnectTosignalingId() {
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
	if (role === "offerer") {
	document.getElementById("ausgabe").value = signalingId;
		dcControl1 = pc1.createDataChannel('control');
		bindEventsControl(dcControl1);
		dcControl2 = pc2.createDataChannel('control');
		bindEventsControl(dcControl2);
		if(zaehler === 0)
		{
			// create the offer SDP
			pc1.createOffer(function(offer) {
			pc1.setLocalDescription(offer);

			// send the offer SDP to FireBase
			firebaseSend(signalingId, "offer", JSON.stringify(offer));

			// wait for an answer SDP from FireBase
			firebaseReceive(signalingId, "answer", function(answer) {
				pc1.setRemoteDescription(new SessionDescription(JSON.parse(answer)));
			});
		}, errorHandler, sdpConstraints);
		console.log("connect - role: offerer");
		}
		else
		{
			pc2.createOffer(function(offer) {
			pc2.setLocalDescription(offer);

			// send the offer SDP to FireBase
			firebaseSend(signalingId, "offer", JSON.stringify(offer));

			// wait for an answer SDP from FireBase
			firebaseReceive(signalingId, "answer", function(answer) {
				pc2.setRemoteDescription(new SessionDescription(JSON.parse(answer)));
			});
		}, errorHandler, sdpConstraints);
		console.log("connect - role: offerer");
		}
		

		// answerer role
	} else {
		if(zaehler === 0)
		{
			// answerer must wait for the data channel
		pc1.ondatachannel = function(event) {
			if (event.channel.label == "control") {
				dcControl1 = event.channel;
				bindEventsControl(event.channel);
			} else {
				alert("error: unknown channel!");
			}

			console.log('incoming datachannel');
		};
		
		// answerer needs to wait for an offer before generating the answer SDP
		firebaseReceive(signalingId, "offer", function(offer) {
			pc1.setRemoteDescription(new SessionDescription(JSON.parse(offer)));

			// now we can generate our answer SDP
			pc1.createAnswer(function(answer) {
				pc1.setLocalDescription(answer);

				// send it to FireBase
				firebaseSend(signalingId, "answer", JSON.stringify(answer));
			}, errorHandler);
		});
		// add handler for peers ice candidates
		signalingIdRef.child(signalingId).child(peerRole + '-iceCandidates').on('child_added', function(childSnapshot) {
			var childVal = childSnapshot.val();
			var peerCandidate = JSON.parse(childVal);
			var peerIceCandidate = new IceCandidate(peerCandidate);
			pc1.addIceCandidate(new IceCandidate(peerCandidate));
	
			var peerIp1 = extractIpFromString(peerIceCandidate.candidate);
			console.log('peerIceCandidate for pc1: ' + peerIp1);
			
		});
		}
		else
		{
			pc2.ondatachannel = function(event) {
			if (event.channel.label == "control") {
				dcControl2 = event.channel;
				bindEventsControl(event.channel);
			} else {
				alert("error: unknown channel!");
			}

			console.log('incoming datachannel');
		};
		
		
		firebaseReceive(signalingId, "offer", function(offer) {
			pc2.setRemoteDescription(new SessionDescription(JSON.parse(offer)));

			// now we can generate our answer SDP
			pc2.createAnswer(function(answer) {
				pc2.setLocalDescription(answer);

				// send it to FireBase
				firebaseSend(signalingId, "answer", JSON.stringify(answer));
			}, errorHandler);
		});
		console.log('connect - role answerer');
		console.log('connect - role answerer');
		signalingIdRef.child(signalingId).child(peerRole + '-iceCandidates').on('child_added', function(childSnapshot) {
			var childVal = childSnapshot.val();
			var peerCandidate = JSON.parse(childVal);
	
			var peerIceCandidate = new IceCandidate(peerCandidate);
			pc2.addIceCandidate(new IceCandidate(peerCandidate));
			
			var peerIp2 = extractIpFromString(peerIceCandidate.candidate);
			console.log('peerIceCandidate for pc2: ' + peerIp2);
	
			
		});
		}
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
			document.getElementById("enteruser").style.display = "block";
			document.getElementById("upload").style.display = "block";	
			document.getElementById("sendfile").style.display = "block"; 
		}
		if(zaehler == 2)
		{
			var createsignal = {
    		type : 'createsignal'
   			 }; 
   			 dcControl1.send(JSON.stringify(createsignal));
		}
		if(role != "answerer" && zaehler == 1)
		{
			remoteCreateID();
		}
		if(dcControl2.readyState == 'open' && role != "answerer" && connected == 0)
		{
			sendRemoteConnect(peer1ID);
		}
		freshsignalingId = generateSignalingId();
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
	
function sendmessage()
{
	var eingabemsg = document.getElementById("eingabe").value;
	document.getElementById("chatarea").value = document.getElementById("chatarea").value + eingabemsg + "\r\n";
	nachricht = document.getElementById("chatarea").value;
	
	var peermsg = {
						type : 'msg',
						nachricht : nachricht 
					};
	dcControl1.send(JSON.stringify(peermsg));
	if(user == 2)
   	{
   		dcControl2.send(JSON.stringify(peermsg));
   	} 
	chatarea.scrollTop = chatarea.scrollHeight;
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
	
	case 'createsignal' :
		 createsignal();
	break;

	
	case 'ID' :
		connected++;
		console.log('chatCreateSignalingId');
		signalingId = freshsignalingId;
		console.log('creating signaling id:' + signalingId);
		sendRemoteID();
	break;
	
	case 'GotID' :
		console.log("got peer1 ID");
		peer1ID = messageObject.signalingId;
	break;
	
	case 'RConnect' :
		document.getElementById("signalingId").value = messageObject.peer1ID;
		chatConnectTosignalingId();
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
						
						
		dcControl1.send(JSON.stringify(peermsg));
		if(user == 2)
   		{
   			dcControl2.send(JSON.stringify(peermsg));
 	  	} 
		document.getElementById("eingabe").value = "";
  	}
});   

pc1.onaddstream = function (obj) {
	user++;
	remotewebcam2.src = URL.createObjectURL(obj.stream);
	remotewebcam2.play();
	console.log("got stream");
};

pc2.onaddstream = function (obj) {
	user++;
	remotewebcam.src = URL.createObjectURL(obj.stream);
	remotewebcam.play();
	console.log("got stream");
};

function onReadAsDataURL(event, text) {
	var filename = document.getElementById('upload').files[0].name;
    var data = {
    	type : 'file',
    	filename : filename
    }; // data object to transmit over data channel
    var chunkLength = 16385;

    if (event) text = event.target.result; // on first invocation
    if (text.length > chunkLength) {
        data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
    } else {
    	
        data.message = text;
        data.last = true;
    }
   	dcControl1.send(JSON.stringify(data));
   	if(user == 2)
   	{
   		dcControl2.send(JSON.stringify(data));
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

function remoteCreateID()
{
	var CreateID = {
							type : 'ID'
		};	
	dcControl1.send(JSON.stringify(CreateID));
	console.log("peer1 creates ID");
}

function sendRemoteID()
{
	var GotID = {
							type : 'GotID',
							signalingId : signalingId
	};	
	dcControl1.send(JSON.stringify(GotID));					
}

function sendRemoteConnect(peer1ID)
{
	var RemoteConnect = {
							type : 'RConnect',
							peer1ID : peer1ID
	};	
	dcControl2.send(JSON.stringify(RemoteConnect));
	console.log("sending peer2 peer1ID");
}

function createsignal()
{
		role = "offerer";
		peerRole = "answerer";
		chatConnect();	
}
