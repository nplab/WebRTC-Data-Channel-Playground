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
var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription;

var bufferedAmountLimit = 1 * 1024 * 1024;
var offerer = false;

var pc = new PeerConnection(iceServer);
var peerRole = "offerer";
var role = "answerer";
var signalingId;
var freshsignalingId = generateSignalingId();
var signalingIdRef = dbRef.child("gyroIDs");
var dcControl = {};
var dcData = {};
var scheduler = new Worker("speedtest.scheduler.js");

var speedtestParams = {
	runtime : 0,
	msgSize : 0
};


var speedtestInitator = false;
var speedtestStatsRemote = {};
var speedtestStatsLocal = {};
var speedtestMessage = "";
var speedtestContinueSending = true;
var speedtestSchedulerObject = {sleep : 10};
var speedtestSendLoopLimit = 1000;
var speedtestSendLoopCounter = 0;




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

// handle local ice candidates
pc.onicecandidate = function(event) {
	// take the first candidate that isn't null
	if (!pc || !event || !event.candidate) {
		return;
	}

	var ip = extractIpFromString(event.candidate.candidate);

	// if filter is set: ignore all other addresses
	if ($('#localIceFilter').val() != '' && $('#localIceFilter').val() != ip) {
		console.log('onicecandidate - ignoring: ' + ip);
		return;
	}


	// add local ice candidate to firebase
	signalingIdRef.child(signalingId).child(role + '-iceCandidates').push(JSON.stringify(event.candidate));

	console.log('onicecandidate - ip:' + ip);
};

pc.oniceconnectionstatechange = function(event) { 
	console.log("oniceconnectionstatechange - " + pc.iceConnectionState);
	if (pc.iceConnectionState === 'disconnected') {
		speedtestConnectionLost();
	}
};

function speedtestCreateSignalingId() {
	console.log('speedtestCreateSignalingId');

	signalingId = freshsignalingId;
	offerer = true;
	role = "offerer";
	peerRole = "answerer";

	console.log('creating signaling id:' + signalingId);
	speedtestConnect();
}

function speedtestConnectTosignalingId() {
	console.log('speedtestConnectTosignalingId');

	signalingId = $("#signalingId").val();
	offerer = false;
	role = "answerer";
	peerRole = "offerer";

	console.log('connecting to peer:' + signalingId);
	speedtestConnect();

}

// establish connection to remote peer via webrtc
function speedtestConnect() {

	$("#rowInit").slideUp();

	if (role === "offerer") {
		$(".spinnerStatus").html("waiting for peer<br/>use id: " + signalingId);
		$("#rowSpinner").slideDown();

		dcControl = pc.createDataChannel('control');
		dcData = pc.createDataChannel('data');

		bindEventsControl(dcControl);
		bindEventsData(dcData);

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
		$(".spinnerStatus").text("connecting - id: " + signalingId);
		$("#rowSpinner").removeClass('hidden').hide().slideDown();
		// answerer must wait for the data channel
		pc.ondatachannel = function(event) {
			if (event.channel.label == "control") {
				dcControl = event.channel;
				bindEventsControl(event.channel);
			} else if (event.channel.label == "data") {
				dcData = event.channel;
				bindEventsData(event.channel);
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

// find and return an IPv4 Address from a given string
function extractIpFromString(string) {
	var pattern = '(?:25[0-5]|2[0-4][0-9]|1?[0-9][0-9]{1,2}|[0-9]){1,}(?:\\.(?:25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}|0)){3}';
	var match = string.match(pattern);
	return match[0];
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
		speedtestConnectionLost();

	};

	window.onbeforeunload = function() {
		channel.close();
	};

	channel.onmessage = function(e) {
		msgHandleJson(e.data.toString());
	};
}

// bind events for control channel
function bindEventsData(channel) {
	channel.onopen = function() {
		console.log("Channel Open - Label:" + channel.label + ', ID:' + channel.id);
	};

	channel.onclose = function(e) {
		console.log("Channel Close");
		speedtestConnectionLost();
		};

	window.onbeforeunload = function() {
		channel.close();
	};

	channel.onmessage = function(e) {
		if (speedtestStatsLocal.rx_t_start == 0) {
			speedtestStatsLocal.rx_t_start = new Date().getTime();
		}

		speedtestStatsLocal.rx_t_end = new Date().getTime();
		speedtestStatsLocal.rx_pkts++;
		speedtestStatsLocal.rx_bytes += speedtestParams.msgSize;

	};
}

function generateByteString(count) {
	if (count == 0) {
		return "";
	}
	var count2 = count / 2;
	var result = "x";

	// double the input until it is long enough.
	while (result.length <= count2) {
		result += result;
	}
	// use substring to hit the precise length target without
	// using extra memory
	return result + result.substring(0, count - result.length);
};

function speedtestStatsReset() {
	console.log('speedtestStatisticsReset');
	$(".resultsRtt").html('<div class="alert alert-info" role="alert">pending</div>');
	$(".resultsUpload").html('<div class="alert alert-info" role="alert">pending</div>');
	$(".resultsDownload").html('<div class="alert alert-info" role="alert">pending</div>');
	speedtestStatsLocal = {
		rtt : 0,
		rx_t_start : 0,
		rx_t_end : 0,
		rx_pkts : 0,
		rx_bytes : 0
	};

	speedtestStatsRemote = {
		rtt : 0,
		rx_t_start : 0,
		rx_t_end : 0,
		rx_pkts : 0,
		rx_bytes : 0
	};
}


function speedtestConnectionLost() {
	speedtestContinueSending = false;
	$("#rowSpinner").hide();
	$("#rowControl").hide();
	$("#rowResults").hide();
	$("#rowMessage").removeClass('hidden');
	$("#colMessage").html('<div class="alert alert-danger text-center" role="alert"><strong>Error:</strong> Connection to peer lost!</div>');

}

function speedtestRunByLocal() {
	console.log('speedtestRunByLocal');


	// check parameters!
	if ($("#paramMsgSize").val() < 1 || $("#paramRuntime").val() < 1) {
		alert('You do not want me to use that parameters?!');
		return;
	}

	// I AM THE BOSS! ;)
	speedtestInitator = true;

	// show results
	$("#rowResults").slideDown();
	
	// reset local stats
	speedtestStatsReset();
	
	
	// tell peer to be the passive and handle parameters
	var request = {
		type 		: 'passiveRun',
		msgSize 	: $("#paramMsgSize").val(),
		runtime 	: $("#paramRuntime").val(),
	};
	dcControl.send(JSON.stringify(request));
	
	// get RTT
	msgSendPing();

	// start speedtest
	speedtestRun();
}
	
	
	
function speedtestRun() {
	console.log('speedtestRun - runtime: ' + $("#paramRuntime").val() + ', msg-size:' + $("#paramMsgSize").val());

	speedtestParams.runtime = parseInt($("#paramRuntime").val());
	speedtestParams.msgSize = parseInt($("#paramMsgSize").val());
	// parameters valid?

	$("#paramRuntime").attr('disabled', true);
	$("#paramMsgSize").attr('disabled', true);
	$("#btnSpeedtestRun").attr('disabled', true);

	speedtestMessage = generateByteString(speedtestParams.msgSize);

	$(".spinnerStatus").text("sending ...");
	$("#rowSpinner").slideDown();
	
	$(".resultsUpload").html('<div class="alert alert-info" role="alert">running</div>');


	// set beginning of upload
	speedtestStatsLocal.tx_t_start = new Date().getTime();
	speedtestContinueSending = true;
	// start sending after 1 second - wait for rtt measurement
	setTimeout(function(){
		speedtestSend();
	}, 1000);

	// stop sending after rundtime + start delay
	setTimeout(function(){
		speedtestContinueSending = false;
	}, speedtestParams.runtime * 1000 + 1000);

}


// todo: adaptive loop control!
// be careful with this function - needs to be fast!
function speedtestSend() {
	speedtestSendLoopCounter = 0;
	// send until timer comes back
	if (speedtestContinueSending === true) {
		
		// increase messages per loop, if buffer is empty
		if(dcData.bufferedAmount == 0) {
			speedtestSendLoopLimit = speedtestSendLoopLimit * 2;

		// decrease if more than 2 mb is pending
		} else if (dcData.bufferedAmount > 4194304) {
			speedtestSendLoopLimit = speedtestSendLoopLimit * 0.25;
		}

		// only send if buffered messages are under limit
		while (dcData.bufferedAmount < bufferedAmountLimit && speedtestSendLoopCounter < speedtestSendLoopLimit) {
			dcData.send(speedtestMessage);
			++speedtestSendLoopCounter;
		}

		// schedule next send call
		scheduler.postMessage(speedtestSchedulerObject);

	} else {
		console.log('speedtestSend - runtime reached, requesting stats from peer');

		// request statistics after runtime
		var request = {
			type : 'statsRequest'
		};
		dcControl.send(JSON.stringify(request));
		
		// if iam the iniatator, trigger peer to start sending
		if(speedtestInitator) {
			
			$(".spinnerStatus").text("receiving ...");
			
			var request = {
				type : 'startSending'
			};
			dcControl.send(JSON.stringify(request));

		// otherwise: call finish, tell peer to do the same
		} else {
			speedtestFinish();
			var request = {
				type : 'finish'
			};
			dcControl.send(JSON.stringify(request));
		}

	}

};

function speedtestFinish() {
	$("#paramRuntime").attr('disabled', false);
	$("#paramMsgSize").attr('disabled', false);
	$("#btnSpeedtestRun").attr('disabled', false);
	$("#rowSpinner").slideUp();
	$("#rowResultsTable").slideDown();
	if(speedtestInitator) {
		speedtestAddResults();
	}
}

function speedtestAddResults() {
	var bandwithUpload = Math.round(speedtestStatsRemote.rx_bytes / ((speedtestStatsRemote.rx_t_end - speedtestStatsRemote.rx_t_start) / 1000) / 1000 / 1000 * 8 * 100) / 100;
	var bandwithDownload = Math.round(speedtestStatsLocal.rx_bytes / ((speedtestStatsLocal.rx_t_end - speedtestStatsLocal.rx_t_start) / 1000) / 1000 / 1000 * 8 * 100) / 100;
	$("#tableResults tbody").append("<tr><td>" + speedtestStatsLocal.rtt + " ms</td><td>" + bandwithUpload + " Mbit/s</td><td>" + bandwithDownload + " Mbit/s</td><td>" + speedtestParams.msgSize + " byte</td><td>" + speedtestParams.runtime + " s</td></tr>");
	
}

function msgSendPing() {
	var date = new Date();
	timestampMessage = {
		type : 'ping',
		timestamp : date.getTime(),
	};
	dcControl.send(JSON.stringify(timestampMessage));
	console.log('msgSendPing');
}

function msgHandleJson(message) {
	var messageObject = JSON.parse(message);

	switch(messageObject.type) {
	
	// peer indicates finish
	case 'finish':
		speedtestFinish();
	break;

	
	// the peer has startet the speedtest
	case 'passiveRun': {
		console.log('msgHandleJson - passiveRun');
		$(".resultsDownload").html('<div class="alert alert-info" role="alert">running</div>');

		speedtestStatsReset();
		speedtestInitator = false;

		speedtestParams.msgSize = parseInt(messageObject.msgSize);
		speedtestParams.runtime = parseInt(messageObject.runtime);
		
		$("#paramRuntime").val(messageObject.runtime).attr('disabled', true);
		$("#paramMsgSize").val(messageObject.msgSize).attr('disabled', true);
		$("#btnSpeedtestRun").attr('disabled', true);
		$(".spinnerStatus").text("receiving ...");
		$("#rowSpinner").slideDown();
		$("#rowResults").slideDown();
		break;
	}
	
	case 'startSending' : {
		speedtestRun();
		break;
	}

	// peer requests statistics
	case 'statsRequest':
		console.log('msgHandleJson - statisticsRequest');
		
		// show local bandwidth in gui
		var bandwith = Math.round(speedtestStatsLocal.rx_bytes / ((speedtestStatsLocal.rx_t_end - speedtestStatsLocal.rx_t_start) / 1000));
		
		$('.resultsDownload').html('<div class="alert alert-success" role="alert">' + Math.round(bandwith * 8 / 1000 / 1000 * 100) / 100 + ' Mbit/s</div>');

		// send local stats to peer
		var request = {
			type : 'stats',
			content : speedtestStatsLocal
		};
		dcControl.send(JSON.stringify(request));

		break;

	// peer sends statistics
	case 'stats':
	
		// store remote statistics
		console.log(messageObject.content);
		speedtestStatsRemote = messageObject.content;
		var bandwith = Math.round(speedtestStatsRemote.rx_bytes / ((speedtestStatsRemote.rx_t_end - speedtestStatsRemote.rx_t_start) / 1000));
		$('.resultsUpload').html('<div class="alert alert-success" role="alert">' + Math.round(bandwith * 8 / 1000 / 1000 * 100) / 100 + ' Mbit/s</div>');

		// got remote statistics - show in gui!
		console.log('speed: ' + bandwith + ' byte/s');
		console.log('speed: ' + Math.round(bandwith * 8 / 1000 / 1000 * 100) / 100 + ' Mbit/s');

		if(!speedtestInitator) {
			speedtestAddResults();
		}
		
		
		break;

	// timestamp - echo timestamp to sender
	case 'ping':
		console.log('msgHandleJson - ping');
		
		if(!speedtestInitator) {
			msgSendPing();
		}
		
		messageObject.type = 'pingEcho';
		dcControl.send(JSON.stringify(messageObject));
		
		
		break;

	// timestampEcho - measure RTT
	case 'pingEcho':
		console.log('msgHandleJson - pingEcho');
		
		var date = new Date();
		var t_delta = date.getTime() - messageObject.timestamp;
		$('.resultsRtt').html('<div class="alert alert-success" role="alert">RTT: ' + t_delta + 'ms</div>');

		console.log('RTT: ' + t_delta);
		speedtestStatsLocal.rtt = t_delta;
		break;

	default:
		alert('Unknown messagetype: ' + messageObject.type);
		break;
	}
}

// scheduler only used for npmSend
scheduler.onmessage = function(e) {
	speedtestSend();
};

