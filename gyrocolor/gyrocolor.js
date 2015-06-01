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

/*
 BASED ON: http://louisstow.github.io/WebRTC/datachannels.html
 */


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

// Reference to Firebase APP
var dbRef = new Firebase("https://webrtc-data-channel.firebaseio.com/");

// shims - wrappers for webkit and mozilla connections
var PeerConnection 		= window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate 		= window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription 	= window.RTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription;

var offerer = false;
var parameters = {};
var pc = new PeerConnection(iceServer);
var peerRole = "offerer";
var role = "answerer";
var signalingId;
var freshsignalingId = generateSignalingId();
var signalingIdRef = dbRef.child("gyroIDs");
var t_startNewPackage = 0;
var dcControl = {};


function gyroInit() {
	//if (window.DeviceOrientationEvent  && 'ontouchstart' in window) {
		if (window.DeviceOrientationEvent) {
		$('#gyrostatus').removeClass('alert-danger').addClass('alert-success');
		// Listen for the deviceorientation event and handle the raw data
		window.addEventListener('deviceorientation', function(eventData) {
			// gamma is the left-to-right tilt in degrees, where right is positive
			
			var gammaRaw = Math.round(event.gamma);
			var gamma = Math.round((Math.abs(eventData.gamma) * 2.83) % 255);

			// beta is the front-to-back tilt in degrees, where front is positive
			var betaRaw = Math.round(event.beta);
			var beta = Math.round((Math.abs(eventData.beta) *1.41 )% 255);

			// alpha is the compass direction the device is facing in degrees
			var alphaRaw = Math.round(event.alpha);
			var alpha = Math.round((Math.abs(eventData.alpha-180) / 0.7)% 255);
			
			if(gammaRaw != 0 && betaRaw != 0 && alphaRaw != 0) {
				$('#gyrostatus').html('alpha:' + alpha + ' beta:' + beta + ' gamma:' + gamma + '<br />' + 'alpha:' + alphaRaw + ' beta:' + betaRaw + ' gamma:' + gammaRaw );
				
				
				//$(document.body).css('background-color','rgb('+alpha+','+beta+','+gamma+')');​​​​​​​​​​​​​​​
				$('body').css('background-color','rgb('+alpha+','+beta+','+gamma+')');
				
				if(typeof(dcControl.readyState) !== 'undefined' && dcControl.readyState === "open") {
					//alert('sending');
					dcControl.send(alpha+','+beta+','+gamma);
				}
			}
			
			// call our orientation event handler
		}, false);
	}
}

// clean firebase ref
signalingIdRef.child(freshsignalingId).remove();

// generate a unique-ish string for storage in firebase
function generateSignalingId() {
	return (Math.random() * 10000| 0).toString();
}

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

pc.oniceconnectionstatechange = function(event) { 
	console.log("oniceconnectionstatechange - " + pc.iceConnectionState);
};

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

function gyroCreateSignalingId() {
	signalingId = freshsignalingId;
	offerer = true;
	role = "offerer";
	peerRole = "answerer";
	
	$('#connectionStatus').text('waiting for peer - connect with to id ' + signalingId);
	console.log('creating signaling id:' + signalingId);
	gyroConnect();
}


function gyroConnectTosignalingId() {
	signalingId = $("#signalingId").val();
	offerer = false;
	role = "answerer";
	peerRole = "offerer";
	
	$('#connectionStatus').text('connecting to peer id ' + signalingId);
	console.log('connecting to peer:' + signalingId);
	gyroConnect();
	
}


// establish connection to remote peer via webrtc
function gyroConnect() {

	// disable inputs
	//$("#colCreateSignalingId").hide();
	$("#colCreateSignalingId").fadeOut();
	$("#colConnectToSignalingId").fadeOut(400,function(){
		$("#colConnectionStatus").removeClass("hidden");
	});
	

	if (role === "offerer") {

		dcControl = pc.createDataChannel('control');
		
		bindEvents(dcControl);
		
		// create the offer SDP
		pc.createOffer(function(offer) {
			pc.setLocalDescription(offer);

			// send the offer SDP to FireBase
			firebaseSend(signalingId, "offer", JSON.stringify(offer));

			// wait for an answer SDP from FireBase
			firebaseReceive(signalingId, "answer", function(answer) {
				pc.setRemoteDescription(new SessionDescription(JSON.parse(answer)));
			});
		}, errorHandler, sdpConstraints);

		console.log("connect - role: offerer");

		// answerer role
	} else {

		// answerer must wait for the data channel
		pc.ondatachannel = function(event) {
			dcControl = event.channel;
			console.log(event);
			bindEvents(dcControl);
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

// find and return an IPv4 Address from a given string
function extractIpFromString(string) {
	var pattern = '(?:25[0-5]|2[0-4][0-9]|1?[0-9][0-9]{1,2}|[0-9]){1,}(?:\\.(?:25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}|0)){3}';
	var match = string.match(pattern);
	return match[0];
}

// bind the channel events
function bindEvents(channel) {
	channel.onopen = function() {
		console.log("Channel Open - Label:" + channel.label + ', ID:' + channel.id);
	};

	channel.onclose = function(e) {
		console.log("Channel Close");
	};

	window.onbeforeunload = function() {
		channel.close();
	};

	channel.onmessage = function(e) {
		rxData = e.data.toString();
		$('body').css('background-color','rgb('+rxData+')');
		console.log("Message for "+e.currentTarget.label+" - content:"+rxData);
	};
}


