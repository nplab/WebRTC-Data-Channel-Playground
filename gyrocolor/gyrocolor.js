/*-
* Copyright (c) 2015-2017 Felix Weinrank
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

/*
BASED ON: http://louisstow.github.io/WebRTC/datachannels.html
*/

// constraints on the offer SDP.
var sdpConstraints = {
	'mandatory' : {
		'offerToReceiveAudio' : false,
		'offerToReceiveVideo' : false
	}
};

// Reference to Firebase APP
var dbRef = new Firebase("https://webrtc-data-channel.firebaseio.com/");

var bufferedAmountLimit = 1 * 1024 * 1024;

var pc = new RTCPeerConnection(iceServer);
var peerRole = "offerer";
var role = "answerer";
var signalingId;
var freshsignalingId = generateSignalingId();
var signalingIdRef = dbRef.child("gyroIDs");
var dcControl = {};
var gyroColorFromRemote = false;

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
pc.onicecandidate = function(event) {
	// take the first candidate that isn't null
	if (!pc || !event || !event.candidate) {
		return;
	}

	var ip = extractIpFromString(event.candidate.candidate);

	// add local ice candidate to firebase
	signalingIdRef.child(signalingId).child(role + '-iceCandidates').push(JSON.stringify(event.candidate));

	console.log('onicecandidate - ip:' + ip);
};

pc.oniceconnectionstatechange = function(event) {
	console.log("oniceconnectionstatechange - " + pc.iceConnectionState);
	if (pc.iceConnectionState === 'disconnected') {
		gyroConnectionLost();
	}
};

function gyroCreateSignalingId() {
	console.log('gyroCreateSignalingId');
	signalingId = freshsignalingId;
	role = "offerer";
	peerRole = "answerer";

	console.log('creating signaling id:' + signalingId);
	gyroConnect();
}

function gyroConnectTosignalingId() {
	console.log('gyroConnectTosignalingId');
	signalingId = $("#signalingId").val();
	role = "answerer";
	peerRole = "offerer";

	console.log('connecting to peer:' + signalingId);
	gyroConnect();

}

function gyroConnectTosignalingIdFromUrl() {
	console.log('gyroConnectTosignalingId');
	role = "answerer";
	peerRole = "offerer";

	console.log('connecting to peer:' + signalingId);
	gyroConnect();
}

// establish connection to remote peer via webrtc
function gyroConnect() {
	$("#rowInit").slideUp();
	$("#rowSpinner").slideDown();

	if (role === "offerer") {
		$(".spinnerStatus").html('waiting for peer<br/>use id: ' + signalingId + '<br/><br/><div id="qrcode"></div>');
		new QRCode(document.getElementById("qrcode"), window.location.href + '#' + signalingId);
		$("#rowSpinner").removeClass('hidden').hide().slideDown();
		dcControl = pc.createDataChannel('control');
		bindEventsControl(dcControl);

		// create the offer SDP
		pc.createOffer(function(offer) {
			pc.setLocalDescription(offer);
			// send the offer SDP to FireBase
			firebaseSend(signalingId, "offer", JSON.stringify(offer));
			// wait for an answer SDP from FireBase
			firebaseReceive(signalingId, "answer", function(answer) {
				pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
			});
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
			pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));

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

		var peerIceCandidate = new RTCIceCandidate(peerCandidate);
		pc.addIceCandidate(new RTCIceCandidate(peerCandidate));

		var peerIp = extractIpFromString(peerIceCandidate.candidate);

		console.log('peerIceCandidate: ' + peerIp);
	});
}

// bind events for control channel
function bindEventsControl(channel) {
	channel.onopen = function() {
		$("#rowSpinner").slideUp();
		$("#rowControl").slideDown();
		console.log("Channel Open - Label:" + channel.label + ', ID:' + channel.id);
	};

	channel.onclose = function(e) {
		console.log("Channel Close");
		gyroConnectionLost();

	};

	window.onbeforeunload = function() {
		channel.close();
	};

	channel.onmessage = function(e) {
		msgHandleJson(e.data.toString());
	};
}


function gyroConnectionLost() {
	speedtestContinueSending = false;
	$("#rowSpinner").hide();
	$("#rowMessage").removeClass('hidden');
	$("#colMessage").html('<div class="alert alert-danger text-center" role="alert"><strong>Error:</strong> Connection to peer lost!</div>');
	$("#rowInit").hide();
	gyroSetColor(255,255,255);

}

function gyroInit() {
	//if (window.DeviceOrientationEvent  && 'ontouchstart' in window) {

	if(location.hash.substring(1)){
		signalingId = location.hash.substring(1);
		gyroConnectTosignalingIdFromUrl();
	}

	if (window.DeviceOrientationEvent) {
		$('#gyrostatus').removeClass('alert-info').addClass('alert-success');

		if (window.DeviceOrientationEvent.requestPermission) {
			$("#rowMessage").removeClass('hidden');
			$("#colMessage").html('<div class="alert alert-danger text-center" role="alert"><strong>Error:</strong> Need to request permission!</div>');

		}

		// Listen for the deviceorientation event and handle the raw data
		window.addEventListener('deviceorientation', function(eventData) {
			// gamma is the left-to-right tilt in degrees, where right is positive
			var gammaRaw = Math.round(event.gamma);
						var gamma = Math.round(((((Math.abs(gammaRaw)*4) % 360)/360)*510)%512);
						if(gamma > 255){
							gamma = 510 - gamma;
						}
			// beta is the front-to-back tilt in degrees, where front is positive
			var betaRaw = Math.round(event.beta);
			var beta = Math.round((((Math.abs(betaRaw)*4) % 360)/360)*510);
						if(beta > 255){
							beta = 510 - beta;
						}

			// alpha is the compass direction the device is facing in degrees
			var alphaRaw = Math.round(event.alpha);
						if(alpha < 0){
							console.log("Alpha should never be negative: "+alphaRaw);
						}
			var alpha = Math.round(((Math.abs(eventData.alpha*4) / 360) * 510) % 510);
			if(alpha > 255){
							alpha = 510 - alpha;
						}
			if(gammaRaw != 0 && betaRaw != 0 && alphaRaw != 0) {
				$('#trRaw').html('<td>raw</td><td>'+alphaRaw+'</td><td>'+betaRaw+'</td><td>'+gammaRaw+'</td>');

				if(!gyroColorFromRemote) {
					gyroSetColor(alpha,beta,gamma);
				}

				if(typeof(dcControl.readyState) !== 'undefined' && dcControl.readyState === "open") {
					//alert('sending');

					var gyroData = {
						type : 'gyro',
						alpha : alpha,
						beta : beta,
						gamma : gamma
					};

					dcControl.send(JSON.stringify(gyroData));
				}
			}

			// call our orientation event handler
		}, false);
	}
}

function gyroSetColor(alpha, beta, gamma) {
	$('body').css('background-color','rgb('+alpha+','+beta+','+gamma+')');
	$('#complementary').css('color','rgb('+(alpha > 128)?255:0+','+(beta > 128)?255:0+','+(gamma > 128)?255:0+')' );
	$('#trCalc').html('<td>calc</td><td>'+alpha+'</td><td>'+beta+'</td><td>'+gamma+'</td>');
}

function msgHandleJson(message) {

	try {
		var messageObject = JSON.parse(message);
	} catch(e) {
		console.log(message);
		return;
	}

	switch(messageObject.type) {

		// peer indicates finish
		case 'gyro':
			gyroColorFromRemote = true;
			gyroSetColor(messageObject.alpha,messageObject.beta,messageObject.gamma);
		break;

		default:
			alert('Unknown messagetype: ' + messageObject.type);
			break;
	}
}
