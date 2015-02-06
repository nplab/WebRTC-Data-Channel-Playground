/*-
 * Copyright (c) 2015 Daniel Richters, Felix Weinrank
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

/*
 * SETTINGS BEGIN
 */

var options = {
	iceOfferAll : true,
};

// ICE, STUN, TURN Servers
var iceServer = {
	iceServers : [{
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

// constraints on the offer SDP.
var sdpConstraints = {
	'mandatory' : {
		'OfferToReceiveAudio' : false,
		'OfferToReceiveVideo' : false
	}
};

// Reference to Firebase APP
var dbRef = new Firebase("https://webrtc-data-channel.firebaseio.com/");

/*
* SETTINGS END
*/

// shims - wrappers for webkit and mozilla connections
var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription;

var activeChannelCount = new Array();
var channels = {};
var dcCounter = 0;
var labelButtonToggle = false;
var localIceCandidates = [];
var offerer = false;
var parameters = {};
var pc = new PeerConnection(iceServer);
var peerIceCandidates = [];
var peerRole = "offerer";
var role = "answerer";
var scheduler = new Worker("dist/worker.scheduler.js");
var signalingID;
var freshSignalingID = generateSignalingID();
var signalingIDRef = dbRef.child("npmIDs");
var t_startNewPackage = 0;

// clean firebase ref
signalingIDRef.child(freshSignalingID).remove();
$('#signalingID').val(location.hash.substring(1));


prepareRole();

function prepareRole() {
	
	// role offerer
	if ($('#signalingID').val() != '') {
		
		if($('#signalingID').val() != '') {
			signalingID = $('#signalingID').val();
		}
		role = "answerer";
		peerRole = "offerer";

				
		$('#statusSigID').html(signalingID);
		$('#statusRole').html(role);
		$('div.npmControlOfferer').hide();
		$('#dcStatusAnswerer').show();

	} else {
		role = 'offerer';
		peerRole = 'answerer';
		signalingID = freshSignalingID;
		$('#statusRole').html(role);
		$('#statusSigID').html("<a href='#" + signalingID + "'>" + signalingID + "</a>");
		$('#dcStatusAnswerer').hide();
		$('div.npmControlOfferer').show();

	};
}

// generate a unique-ish string for storage in firebase
function generateSignalingID() {
	return (Math.random() * 10000 + 10000 | 0).toString();
}

// wrapper to send data to FireBase
function firebaseSend(signalingID, key, data) {
	signalingIDRef.child(signalingID).child(key).set(data);
	console.log('firebaseSend - ' + key + ' - ' + data);
}

// wrapper function to receive data from FireBase - with callback function
function firebaseReceive(signalingID, type, cb) {
	signalingIDRef.child(signalingID).child(type).on("value", function(snapshot, key) {
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

function extractIpFromString(string) {
	var pattern = '(?:25[0-5]|2[0-4][0-9]|1?[0-9][0-9]{1,2}|[0-9]){1,}(?:\\.(?:25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}|0)){3}';
	var match = string.match(pattern);
	return match[0];
}

function extractProtocolFromStrig(string) {

}

pc.onicecandidate = function(event) {
	// take the first candidate that isn't null
	if (!pc || !event || !event.candidate) {
		return;
	}

	var ip = extractIpFromString(event.candidate.candidate);

	if ($('#localIceFilter').val() != '' && $('#localIceFilter').val() != ip) {
		return;
	}

	if (localIceCandidates.indexOf(ip) == -1) {
		localIceCandidates.push(ip);
		$('#localIceCandidates').append(ip + '<br/>');
	}

	signalingIDRef.child(signalingID).child(role + '-iceCandidates').push(JSON.stringify(event.candidate));

	console.log('onicecandidate - ip:' + ip);
	updatePeerConnectionStatus(event);
};

pc.onsignalingstatechange = function(event) {
	updatePeerConnectionStatus(event);
};

pc.oniceconnectionstatechange = function(event) {
	updatePeerConnectionStatus(event);
};

// initiate signaling channel and role
function init() {

}

// start start peer connection
function connect() {

	$('#npmConnect').prop('disabled', true);
	$('#signalingID').prop('disabled', true);

	if (role === "offerer") {

		createDataChannel('init');
		// create the offer SDP
		pc.createOffer(function(offer) {
			pc.setLocalDescription(offer);

			// send the offer SDP to FireBase
			firebaseSend(signalingID, "offer", JSON.stringify(offer));

			// wait for an answer SDP from FireBase
			firebaseReceive(signalingID, "answer", function(answer) {
				pc.setRemoteDescription(new SessionDescription(JSON.parse(answer)));
			});
		}, errorHandler, sdpConstraints);

		console.log("creating offer");

	} else {// answerer role
		// answerer must wait for the data channel
		pc.ondatachannel = function(event) {
			var channel = event.channel;
			bindEvents(channel);

			console.log('incoming datachannel');

			channels[channel.label] = {
				channel : channel,
				statistics : {
					t_start : 0,
					t_end : 0,
					t_last : 0,
					npmPktRxAnsw : 0,
					npmPktTx : 0,
					npmBytesRx : 0,
					npmBytesTx : 0,
					npmPktCount : 0,
					rateAll : 0,
					npmBytesLost : 0,
					npmPktLost : 0,
					runtime : 0,
				}
			};
			updateChannelStatus();
		};

		// answerer needs to wait for an offer before generating the answer SDP
		firebaseReceive(signalingID, "offer", function(offer) {
			pc.setRemoteDescription(new SessionDescription(JSON.parse(offer)));

			// now we can generate our answer SDP
			pc.createAnswer(function(answer) {
				pc.setLocalDescription(answer);

				// send it to FireBase
				firebaseSend(signalingID, "answer", JSON.stringify(answer));
			}, errorHandler, sdpConstraints);
		});
		console.log('connect passive');
	}

	signalingIDRef.child(signalingID).child(peerRole + '-iceCandidates').on('child_added', function(childSnapshot) {
		var childVal = childSnapshot.val();
		var peerCandidate = JSON.parse(childVal);
		console.log(peerCandidate);

		var peerIceCandidate = new IceCandidate(peerCandidate);
		pc.addIceCandidate(new IceCandidate(peerCandidate));

		var peerIp = extractIpFromString(peerIceCandidate.candidate);
		if (peerIceCandidates.indexOf(peerIp) == -1) {
			peerIceCandidates.push(peerIp);
			$('#peerIceCandidates').append(peerIp + '<br/>');
		}

		//console.log(peerIceCandidate);
		console.log('peerIceCandidate: ' + peerIp);
	});
}

//Create Datachannels
function createDataChannel(label) {
	//

	var dataChannelOptions;
	if ( typeof parameters[label] != 'undefined') {
		switch(parameters[label].reliableMethode) {
		case "reliable":
			dataChannelOptions = {
			};
			break;
		case "maxRetransmit":
			dataChannelOptions = {
				maxRetransmits : parameters[label].reliableParam,
			};
			break;
		case "maxTimeout":
			dataChannelOptions = {
				maxRetransmitTime : parameters[label].reliableParam,
			};
			break;
		}
	}

	// offerer creates the data channel
	var tempChannel = pc.createDataChannel(label, dataChannelOptions);
	bindEvents(tempChannel);

	channels[tempChannel.label] = {
		channel : tempChannel,
		statistics : {
			t_start : 0,
			t_end : 0,
			t_last : 0,
			npmPktRxAnsw : 0,
			npmPktTx : 0,
			npmBytesRx : 0,
			npmBytesTx : 0,
			npmPktCount : 0,
			rateAll : 0,
			npmBytesLost : 0,
			npmPktLost : 0,
			runtime : 0,
		}

	};
	updateChannelStatus();
	console.log("datachannel created - label:" + tempChannel.id + ', id:' + tempChannel.label);
}

function closeDataChannel(label) {
	console.log('closeDataChannel - channel:' + label);
	channels[label].channel.close();
}

function NpmSend(label, message) {
	// console.log("datachannel send - label:" + label + ' - sleep:' + parameters[label].sleep);
	if (label == 'init') {
		alert('darf nicht sein!');
	}
	try {
		channels[label].statistics.t_end = new Date().getTime();
		var tempTime = (channels[label].statistics.t_end - channels[label].statistics.t_start);
		if (tempTime <= parameters[label].runtime) {
			channels[label].channel.send(message);
			channels[label].statistics.npmPktTx++;
			channels[label].statistics.npmBytesTx += message.length;
			if (channels[label].statistics.npmPktTx <= parameters[label].pktCount) {
				var schedulerObject = {
					sleep : parameters[label].sleep,
					label : label,
					data : message,
				};
				scheduler.postMessage(schedulerObject);

			} else {
				console.log('NpmSend - channel:' + label + ' - all pkts sent');
				closeDataChannel(label);
			}
		} else {
			closeDataChannel(label);
			console.log('NpmSend - channel:' + label + ' - runtime reached');
		}
	} catch(e) {
		alert("Test Aborted!");
		console.log(e);
		return;
	}
	//updateChannelState();
};

function funct() {
};

//
function parseParameters() {
	$('#npmChannelParameters > tbody > tr').each(function() {
		parameters[$(this).find('button[name="toggleActive"]').val()] = {

			active : $(this).find('button[name="toggleActive"]').hasClass("btn-primary"),
			label : $(this).find('button[name="toggleActive"]').val(),
			pktSize : $(this).find('input[name="paramPktSize"]').val(),
			pktCount : $(this).find('input[name="paramPktCount"]').val(),
			sleep : Math.floor((Math.random() * 100) + 1), //$(this).find('input[name="paramSleep"]').val(),
			reliableMethode : $(this).find('button.dropdown-toggle').data('method'),
			reliableParam : $(this).find('input[name="paramReliable"]').val(),
			runtime : ($(this).find('input[name="paramRuntime"]').val() * 1000),
			delay : Math.floor((Math.random() * 10) + 1),//($(this).find('input[name="paramDelay"]').val() * 1000),
		};
	});
}

//
function netPerfMeter() {
	var channelNo = -1;
	var accc = 0;

	parseParameters();

	for (var key in parameters) {
		if (parameters.hasOwnProperty(key)) {
			if (parameters[key].active == true) {
				createDataChannel(key);
				activeChannelCount[accc] = key;
				accc++;
			}
		}
	}

}

//
function netPerfMeterRunByTrigger(label) {
	updateChannelStatus();
	for (var i = 0; i < activeChannelCount.length; i++) {
		if (activeChannelCount[i] == label) {

			console.log('netPerfMeterRunByTrigger - channel: ' + label);
			channels[activeChannelCount[i]].channel.send("1");
			channels[activeChannelCount[i]].statistics.t_start = new Date().getTime();
			channels[activeChannelCount[i]].statistics.npmBytesTx = 1;

			npmPaket = "";
			for (var j = 0; j < parameters[activeChannelCount[i]].pktSize; j++) {
				npmPaket += "a";
			}
			NpmSend(activeChannelCount[i], npmPaket);
		}
	}
}

// bind the channel events
function bindEvents(channel) {
	channel.onopen = function() {
		console.log("datachannel opened - label:" + channel.label + ', ID:' + channel.id);
		if (offerer == true && channel.label != "init") {
			setTimeout(function() {
				netPerfMeterRunByTrigger(channel.label);
			}, parameters[channel.label].delay);
		}
		updateChannelStatus();
	};

	channel.onclose = function(e) {
		console.log("datachannel closed - label:" + channel.label + ', ID:' + channel.id);
		if (offerer == false) {
			sendStatistics(e);
		}
		updateChannelStatus();
	};

	window.onbeforeunload = function() {
		channel.close();
	};

	channel.onmessage = function(e) {
		console.log('incoming message: ' + e.data);

		if (e.currentTarget.label == 'init') {
			handleJsonMessage(e.data);
		} else if (offerer == false) {
			answererOnMessage(e);
		}
	};
}

scheduler.onmessage = function(e) {
	var message = e.data;

	if (message.label != undefined && message.sleep != undefined && message.data != undefined) {
		NpmSend(message.label, message.data);
	}
};

function sendStatistics(e) {
	var tempChannelLabel = e.currentTarget.label;
	var jsonObjStats = {
		type : 'stats',
		label : tempChannelLabel,
		stats : channels[tempChannelLabel].statistics,
	};
	var tempStringify = JSON.stringify(jsonObjStats);
	channels.init.channel.send(tempStringify);
}

function answererOnMessage(e) {
	rxData = e.data.toString();
	// console.log("Message for "+e.currentTarget.label + " - content:" + rxData.length);
	var tempChannelLabel = e.currentTarget.label;

	if (rxData == "1") {
		channels[tempChannelLabel].statistics.npmBytesRx = rxData.length;
		channels[tempChannelLabel].statistics.t_start = new Date().getTime();
	} else {
		channels[tempChannelLabel].statistics.t_end = new Date().getTime();
		channels[tempChannelLabel].statistics.npmBytesRx += rxData.length;
		channels[tempChannelLabel].statistics.npmPktRxAnsw++;
	}
}

function handleJsonMessage(message) {
	var messageObject = JSON.parse(message);
	var tempChannelLabel = messageObject.label;

	switch(messageObject.type) {
	case 'stats':
		channels[tempChannelLabel].statistics.rateAll = Math.round(messageObject.stats.npmBytesRx / ((messageObject.stats.t_end - messageObject.stats.t_start) / 1000));
		channels[tempChannelLabel].statistics.npmBytesLost = channels[tempChannelLabel].statistics.npmBytesTx - messageObject.stats.npmBytesRx;
		channels[tempChannelLabel].statistics.npmPktLost = channels[tempChannelLabel].statistics.npmPktTx - messageObject.stats.npmPktRxAnsw;
		channels[tempChannelLabel].statisticsRemote = messageObject.stats;
		channels[tempChannelLabel].statisticsRemote.t_last = messageObject.stats.t_end - messageObject.stats.t_start;

		console.log(channels[tempChannelLabel].statistics);
		console.log(channels[tempChannelLabel].statisticsRemote);
		break;
	case 'timestamp':
		handlePing(messageObject);
		break;
	case 'timestampEcho':
		handlePingEcho(messageObject);
		break;
	default:
		alert('Unknown messagetype!!');
		break;
	}
}

/*
 * Send a message to peer with local timestamp
 */
function ping() {
	var date = new Date();
	timestampMessage = {
		type : 'timestamp',
		timestamp : date.getTime(),
	};
	channels.init.channel.send(JSON.stringify(timestampMessage));
	console.log('ping - sending timestamp to peer: ' + timestampMessage.timestamp);
}

/*
 * Echo received timestamp to peer
 */
function handlePing(message) {
	var timestampEcho = message;
	timestampEcho.type = 'timestampEcho';
	channels.init.channel.send(JSON.stringify(timestampEcho));
	console.log('handlePing - echo received timestamp to peer: ' + timestampEcho.timestamp);
}

/*
 *
 */
function handlePingEcho(message) {
	var date = new Date();
	var t_delta = date.getTime() - message.timestamp;
	$('#npmcPing .rtt').html(' - RTT: ' + t_delta + ' ms');
	console.log('handlePingEcho - received echoed timestamp from peer - RTT: ' + t_delta);
}

/*
 * Save the channel settings to webstorage
 */
function saveChannelSettings() {
	$('#npmChannelParameters > tbody > tr > td > input').each(function() {
		$(this).attr('value', $(this).val());
	});

	var channelSettingsHTML = $("#npmChannelParameters").html();
	localStorage.setItem('npmChannelSettings', channelSettingsHTML);
}

/*
 * load channel settings from webstorage
 */
function loadChannelSetting() {

	var channelSettingsHTML = localStorage.getItem('npmChannelSettings');
	if (channelSettingsHTML) {
		$("#npmChannelParameters").html(channelSettingsHTML);
	} else {
		alert('Sorry - No saved settings available!');
	}

}

/*
 *
 */
function copyFromTextarea() {
	document.getElementById("csv").focus();
	document.getElementById("csv").select();
}

/*
 *
 */
function saveStats() {
	$('#csv').html("");
	for (var i = 0; i < activeChannelCount.length; i++) {
		var statsExpStrg = ("Stats for channel " + activeChannelCount[i] + ":\r" + channels[activeChannelCount[i]].statistics.rateAll + " kb/s.\r" + channels[activeChannelCount[i]].statistics.npmPktTx + " Pkt send.\r" + channels[activeChannelCount[i]].statisticsRemote.npmPktRxAnsw + " Pkt received.\r" + channels[activeChannelCount[i]].statisticsRemote.npmPktLost + " Pkt lost.\r" + channels[activeChannelCount[i]].statistics.npmBytesTx + " Bytes send.\r" + channels[activeChannelCount[i]].statisticsRemote.npmBytesRx + " Bytes received.\r" + channels[activeChannelCount[i]].statisticsRemote.npmBytesLost + " Bytes lost.\r\r"
		);
		$('#csvOutput').html(statsExpStrg);
	}
}

function getStats(peer) {
	myGetStats(peer, function(results) {
		for (var i = 0; i < results.length; ++i) {
			var res = results[i];
			console.log(res);
		}

	});
};

function myGetStats(peer, callback) {
	console.log(peer);

	if (!!window.mozRTCSessionDescription) {
		console.log('stats for Mozilla');
		peer.getStats(function(res) {
			var items = [];
			res.forEach(function(result) {
				items.push(result);
			});
			callback(items);
		}, callback);
	} else {
		console.log('stats for other');
		peer.getStats(function(res) {
			var items = [];
			res.result().forEach(function(result) {
				var item = {};
				result.names().forEach(function(name) {
					item[name] = result.stat(name);
				});
				item.id = result.id;
				item.type = result.type;
				item.timestamp = result.timestamp;
				items.push(item);
			});
			callback(items);
		});
	}
};