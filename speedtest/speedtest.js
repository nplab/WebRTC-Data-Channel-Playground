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
var initiator = false;
var pc = new PeerConnection(iceServer);
var peerRole = "offerer";
var role = "answerer";
var signalingId;
var freshsignalingId = generateSignalingId();
var signalingIdRef = dbRef.child("gyroIDs");
var dcControl = {};
var dcData = {};
var speedtestParams = {
	runtime : 30,
	msgSize : 1024
};

var scheduler = new Worker("speedtest.scheduler.js");

var statisticsLocal = {};

var statisticsRemote = {};

var bulkMessage = "";

speedtestStatisticsReset();

// clean firebase ref
signalingIdRef.child(freshsignalingId).remove();

// generate a unique-ish string for storage in firebase
function generateSignalingId() {
	return (Math.random() * 10000 + 10000 | 0).toString();
}

// check for int
function isInt(n) {
	return Number(n) === n && n % 1 === 0;
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

	// add local ice candidate to firebase
	signalingIdRef.child(signalingId).child(role + '-iceCandidates').push(JSON.stringify(event.candidate));

	console.log('onicecandidate - ip:' + ip);
};

function gyroCreateSignalingId() {
	signalingId = freshsignalingId;
	offerer = true;
	role = "offerer";
	peerRole = "answerer";

	console.log('creating signaling id:' + signalingId);
	gyroConnect();
}

function gyroConnectTosignalingId() {
	signalingId = $("#signalingId").val();
	offerer = false;
	role = "answerer";
	peerRole = "offerer";

	console.log('connecting to peer:' + signalingId);
	gyroConnect();

}

function checkConnectionStatus() {
	if (dcControl.readyState === 'open' && dcData.readyState === 'open') {
		$(".connectionStatus").html(' - <span style="color:green;">connected</span>');
	}
}

// establish connection to remote peer via webrtc
function gyroConnect() {

	$("#rowInit").slideUp();
	//$("#rowSpinner").removeClass("hidden");

	if (role === "offerer") {
		$(".spinnerStatus").text("waiting for peer - id: " + signalingId);
		$("#rowSpinner").removeClass('hidden').hide().slideDown();

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
				bindEventsControl(event.channel);
			} else if (event.channel.label == "data") {
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
		$("#rowControl").removeClass('hidden').hide().slideDown();
		dcControl = channel;
		console.log("Channel Open - Label:" + channel.label + ', ID:' + channel.id);
	};

	channel.onclose = function(e) {
		console.log("Channel Close");
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
		dcData = channel;
		console.log("Channel Open - Label:" + channel.label + ', ID:' + channel.id);
	};

	channel.onclose = function(e) {
		console.log("Channel Close");
	};

	window.onbeforeunload = function() {
		channel.close();
	};

	channel.onmessage = function(e) {
		//rxData = e.data.toString();
		//console.log("Message for " + e.currentTarget.label + " - content:" + rxData);

		if (statisticsLocal.rx_t_start == 0) {
			statisticsLocal.rx_t_start = new Date().getTime();
		}

		statisticsLocal.rx_t_end = new Date().getTime();

		statisticsLocal.rx_pkts++;
		statisticsLocal.rx_bytes += e.data.length;

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

function speedtestStatisticsReset() {
	console.log('speedtestStatisticsReset');
	$(".resultsRtt").html('<div class="alert alert-info" role="alert">pending</div>');
	$(".resultsUpload").html('<div class="alert alert-info" role="alert">pending</div>');
	$(".resultsDownload").html('<div class="alert alert-info" role="alert">pending</div>');
	statisticsLocal = {
		tx_t_start : 0,
		tx_t_end : 0,
		tx_pkts : 0,
		tx_bytes : 0,
		rx_t_start : 0,
		rx_t_end : 0,
		rx_pkts : 0,
		rx_bytes : 0
	};

	statisticsRemote = {
		tx_t_start : 0,
		tx_t_end : 0,
		tx_pkts : 0,
		tx_bytes : 0,
		rx_t_start : 0,
		rx_t_end : 0,
		rx_pkts : 0,
		rx_bytes : 0
	};
}

function speedtestRunByRemote(runtime, msgSize) {
	console.log('speedtestRunByRemote');
	
	speedtestParams.runtime = runtime;
	speedtestParams.msgSize = msgSize;
	
	speedtestRun();
}

function speedtestRunByLocal() {
	console.log('speedtestRunByLocal');
	
	speedtestParams.runtime = $("#paramRuntime").val();
	speedtestParams.msgSize = $("#paramMsgSize").val();
	
	// reset local stats
	speedtestStatisticsReset();
	msgSendPing();
	// reset remote stats
	var request = {
		type : 'resetStats',
	};
	dcControl.send(JSON.stringify(request));
	
	var request = {
		type : 'bePassive',
	};
	dcControl.send(JSON.stringify(request));
	
	initiator = true;
	
	speedtestRun();
}
	
	
	
function speedtestRun() {
	// parameters valid?
	if (speedtestParams.runtime >= 1 && speedtestParams.msgSize >= 1) {
		$("#paramRuntime").attr('disabled', true);
		$("#paramMsgSize").attr('disabled', true);
		$("#btnSpeedtestRun").attr('disabled', true);

		bulkMessage = generateByteString(speedtestParams.msgSize);

		$(".spinnerStatus").text("uploading ...");
		$("#rowSpinner").removeClass('hidden').hide().slideDown();
		
		// set beginning of upload
		statisticsLocal.tx_t_start = new Date().getTime();
		
		console.log('starting speedtest - runtime: ' + speedtestParams.runtime + ', msg-size:' + speedtestParams.msgSize);
		speedtestSend();
	} else {
		alert('Check parameter!');
	}
}

function speedtestSend() {
	statisticsLocal.tx_t_end = new Date().getTime();
	var runtime = statisticsLocal.tx_t_end - statisticsLocal.tx_t_start;
	if (runtime <= (speedtestParams.runtime * 1000)) {
		if (dcData.bufferedAmount < bufferedAmountLimit) {

			var pktCounter = 0;
			while (dcData.bufferedAmount < bufferedAmountLimit && pktCounter < 1000) {
				dcData.send(bulkMessage);
				statisticsLocal.tx_pkts++;
				statisticsLocal.tx_bytes += bulkMessage.length;
				pktCounter++;
			}
			sendSleep = 10;
			//console.log('reached limit!');
		} else {
			//console.log('npmSend - bufferedAmount >= limit (' + bufferedAmountLimit + ')');
		}
		var schedulerObject = "1";
		scheduler.postMessage(schedulerObject);
	} else {
		console.log('runtime reached');

		// request statistics after runtime
		var request = {
			type : 'statisticsRequest'
		};
		console.log('requesting stats');
		dcControl.send(JSON.stringify(request));
		
		// request statistics after runtime
		if(initiator) {
			
			$(".spinnerStatus").text("downloading ...");
			$("#rowSpinner").removeClass('hidden').hide().slideDown();
			
			var request = {
				type : 'startSending',
				msgSize : speedtestParams.msgSize,
				runtime : speedtestParams.runtime,
			};
			dcControl.send(JSON.stringify(request));
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
	
}

function msgSendPing() {
	var date = new Date();
	timestampMessage = {
		type : 'timestamp',
		timestamp : date.getTime(),
	};
	dcControl.send(JSON.stringify(timestampMessage));
	console.log('msgSendPing');
}

function msgHandleJson(message) {
	var messageObject = JSON.parse(message);

	switch(messageObject.type) {
		
	case 'finish':
		speedtestFinish();
	break;

	// reset statistics
	case 'resetStats':
		console.log('msgHandleJson - resetStats');
		speedtestStatisticsReset();
		break;
		
	case 'bePassive': {
		initiator = false;
		console.log('msgHandleJson - bePassive');
		$("#paramRuntime").attr('disabled', true);
		$("#paramMsgSize").attr('disabled', true);
		$("#btnSpeedtestRun").attr('disabled', true);
		$(".spinnerStatus").text("downloading ...");
		$("#rowSpinner").removeClass('hidden').hide().slideDown();
		break;
	}
	
	case 'startSending' : {
		console.log('msgHandleJson - startSending');
		console.log('msg-size: ' + messageObject.msgSize + ' - runtime: ' + messageObject.runtime);
		speedtestRunByRemote(messageObject.runtime,messageObject.msgSize);
		break;
	}

	// peer requests statistics
	case 'statisticsRequest':
		console.log('msgHandleJson - statisticsRequest');
		
		// show local bandwidth in gui
		var bandwith = Math.round(statisticsLocal.rx_bytes / ((statisticsLocal.rx_t_end - statisticsLocal.rx_t_start) / 1000));
		
		$('.resultsDownload').html('<div class="alert alert-success" role="alert">' + Math.round(bandwith * 8 / 1000 / 1000 * 100) / 100 + ' Mbit/s - ' + bandwith + ' byte/s</div>');

		// send local stats to peer
		var request = {
			type : 'statistics',
			content : statisticsLocal
		};
		dcControl.send(JSON.stringify(request));
		break;

	// peer sends statistics
	case 'statistics':
	
		// store remote statistics
		console.log(messageObject.content);
		statisticsRemote = messageObject.content;
		var bandwith = Math.round(statisticsRemote.rx_bytes / ((statisticsRemote.rx_t_end - statisticsRemote.rx_t_start) / 1000));
		$('.resultsUpload').html('<div class="alert alert-success" role="alert">' + Math.round(bandwith * 8 / 1000 / 1000 * 100) / 100 + ' Mbit/s - ' + bandwith + ' byte/s</div>');

		// got remote statistics - show in gui!
		console.log('speed: ' + bandwith + ' byte/s');
		console.log('speed: ' + Math.round(bandwith * 8 / 1000 / 1000 * 100) / 100 + ' Mbit/s');
		//$('.resultsUpload').html(Math.round(bandwith * 8 / 1000 / 1000 * 100) / 100 + ' Mbit/s<br/>' + bandwith + ' byte/s');
		break;

	// timestamp - echo timestamp to sender
	case 'timestamp':
		console.log('msgHandleJson - timestamp');
		
		
		
		if(!initiator) {
			msgSendPing();
		}
		
		messageObject.type = 'timestampEcho';
		dcControl.send(JSON.stringify(messageObject));
		
		
		break;

	// timestampEcho - measure RTT
	case 'timestampEcho':
		console.log('msgHandleJson - timestampEcho');
		
		var date = new Date();
		var t_delta = date.getTime() - messageObject.timestamp;
		$('.resultsRtt').html('<div class="alert alert-success" role="alert">RTT: ' + t_delta + 'ms</div>');

		console.log('RTT: ' + t_delta);
		break;

	default:
		alert('Unknown messagetype!!');
		break;
	}
}

// scheduler only used for npmSend
scheduler.onmessage = function(e) {
	speedtestSend();
};

