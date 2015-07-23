/*-
* Copyright (c) 2015 Felix Weinrank
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions
* are met:
* 1. Redistributions of source code must retain the above copyright
*    notice, this list of conditions and the following disclaimer.
* 2. Redistributions in binary form must reproduce the above copyright
*    notice, this list of conditions and the following disclaimer in the
*    documentation and/or other materials provided with the distribution.
*
* THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
* ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
* ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
* OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
* HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
* LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
* OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
* SUCH DAMAGE.
*
*/

var socket = io("http://bsd1.fh-muenster.de:3000");

// ICE, STUN, TURN Servers
var iceServer = {
	iceServers : [{
		url : 'stun:stun.l.google.com:19302'
	}, {
		url : 'stun:stun1.l.google.com:19302'
	}, {
		url : 'stun:stun2.l.google.com:19302'
	}, {
		url : 'stun:stun3.l.google.com:19302'
	}, {
		url : 'stun:stun4.l.google.com:19302'
	}]
};

// constraints on the offer SDP.
var sdpConstraints = {
	'mandatory' : {
		'offerToReceiveAudio' : false,
		'offerToReceiveVideo' : false
	}
};

// shims - wrappers for webkit and mozilla connections
var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription;

var pc = new PeerConnection(iceServer);
var dcControl = {};
var roleActive;
var signalingId = generateSignalingId();



// clean firebase ref
signalingIdRef.child(freshsignalingId).remove();

// generate a unique-ish string for storage in firebase
function generateSignalingId() {
	return (Math.random() * 10000| 0).toString();
}

// generic error handler
function errorHandler(err) {
	console.error(err);
}

// handle local ice candidates
pc.onicecandidate = function(event) {
	// take the first candidate that isn't null
	if (!pc || !event || !event.candidate) {
		return;
	}

	var ip = extractIpFromString(event.candidate.candidate);
	console.log('onicecandidate - ip:' + ip);
};



// establish connection to remote peer via webrtc
function connect(active) {

	if(active == true) {
		console.log('connecting actively');
		roleActive = true;
	} else {
		console.log('connecting passively');
		roleActive = false;
		signalingId = $("#signalingId").val();
	}

	// joining room
	socket.emit('roomJoin', signalingId);

	$("#rowInit").slideUp();
	$("#rowSpinner").slideDown();

	if (roleActive == true) {
		$(".spinnerStatus").html('waiting for peer<br/>use id: ' + signalingId + '<br/><br/><div id="qrcode"></div>');
		
		//new QRCode(document.getElementById("qrcode"), window.location.href + '#' + signalingId);
		
		$("#rowSpinner").removeClass('hidden').hide().slideDown();

		dcControl = pc.createDataChannel('control');

		//bindEventsControl(dcControl);
		

		// create the offer SDP
		pc.createOffer(function(offer) {
			pc.setLocalDescription(offer);

			// send the offer SDP to FireBase
			//firebaseSend(signalingId, "offer", JSON.stringify(offer));
			var signaling = {
				type : 1,
				data : offer
			}

			console.log(JSON.stringify(offer));
			socket.emit('signaling', JSON.stringify(signaling));


			// wait for an answer SDP from FireBase
			//firebaseReceive(signalingId, "answer", function(answer) {
				//pc.setRemoteDescription(new SessionDescription(JSON.parse(answer)));
			//});
		}, errorHandler, sdpConstraints);

		console.log("connect - role: offerer");

		// answerer role
	} else {
		$(".spinnerStatus").text("connecting - id: " + signalingId);
		$("#rowSpinner").removeClass('hidden').hide().slideDown();
		// answerer must wait for the data channel
		pc.ondatachannel = function(event) {
			if (event.channel.label == "control") {
				dcControl = event.channel;
				bindEventsControl(event.channel);
			} else {
				alert("error: unknown channel!");
			}

			console.log('incoming datachannel');
		};

		// answerer needs to wait for an offer before generating the answer SDP
		firebaseReceive(signalingId, "offer", function(offer) {
			pc.setRemoteDescription(new SessionDescription(JSON.parse(offer)));

			// now we can generate our answer SDP
			pc.createAnswer(function(answer) {
				pc.setLocalDescription(answer);

				// send it to FireBase
				firebaseSend(signalingId, "answer", JSON.stringify(answer));
			}, errorHandler);
		});
		console.log('connect - role answerer');
	}

	// add handler for peers ice candidates
	signalingIdRef.child(signalingId).child(peerRole + '-iceCandidates').on('child_added', function(childSnapshot) {
		var childVal = childSnapshot.val();
		var peerCandidate = JSON.parse(childVal);

		var peerIceCandidate = new IceCandidate(peerCandidate);
		pc.addIceCandidate(new IceCandidate(peerCandidate));

		var peerIp = extractIpFromString(peerIceCandidate.candidate);

		console.log('peerIceCandidate: ' + peerIp);
	});
}