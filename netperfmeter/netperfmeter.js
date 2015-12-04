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
 * SETTINGS BEGIN
 */

var npmSettings = {
	iceOfferAll : false, // ask for each offered ICE-Candidate
	statsCollectInterval : 500, // interval to collect statistics (ms)
	statsGraphRefreshInterval : 1000, // interval to refresh graph (ms)
	statsTableRefreshInterval : 1000, // interval to refresh statistics table (ms)
	bufferedAmountLimit : 16000000	// firefox limit 16MB (16*1024*1024)
};

// Google Chart
var chartOptions = {
	title : 'Datachannel-Performance',
	hAxis : {
		title : 'Runtime',
		format : '#,# s',
	},
	vAxis : {
		title : 'Rate',
	},
	legend : {
		position : 'bottom'
	},
	animation : {
		duration : Math.round(npmSettings.statsGraphRefreshInterval / 2),
		easing : 'out'
	}
};

// constraints on the offer SDP.
var sdpConstraints = {
	'mandatory' : {
		'offerToReceiveAudio' : false,
		'offerToReceiveVideo' : false
	}
};

/*
* SETTINGS END
*/

// Reference to Firebase APP
var dbRef = new Firebase("https://webrtc-data-channel.firebaseio.com/");

var activeChannelCount = -1;
var refreshCounter = 0;
var channels = {};
var channelStats = [];
var channelStatsCounter = 0;
var chart = new google.visualization.LineChart(document.getElementById('channelChart'));
var chartData;
var dcCounter = 0;
var labelButtonToggle = false;
var localIceCandidates = [];
var npmcDcCounter = 0;
var npmcStatisticsTimerActive = false;
var offerer = false;
var parameters = {};
var pc = new PeerConnection(iceServer);
var peerIceCandidates = [];
var peerRole = "offerer";
var role = "answerer";
var scheduler = new Worker("netperfmeter.scheduler.js");
var signalingID;
var freshSignalingID = generateSignalingID();
var signalingIDRef = dbRef.child("npmIDs");
var t_startNewPackage = 0;

// clean firebase ref
signalingIDRef.child(freshSignalingID).remove();
$('#signalingID').val(location.hash.substring(1));

npmPrepareRole();
// add example settings
parametersRowAddSamples();

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

function firebaseOfferExists(signalingID) {
	console.log('checking offer from:' + signalingID);
	var exists = true;
	signalingIDRef.once('value', function(snapshot) {
		exists = snapshot.hasChild(signalingID);
		alert(exists);
	});

	return exists;

	//return signalingIDRef.child(signalingID).child('offer').exists();
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
		return;
	}

	// add local candidates only once to statusinfo
	if (localIceCandidates.indexOf(ip) == -1) {
		localIceCandidates.push(ip);
		$('#localIceCandidates').append(ip + '<br/>');
	}

	// add local ice candidate to firebase
	signalingIDRef.child(signalingID).child(role + '-iceCandidates').push(JSON.stringify(event.candidate));

	console.log('onicecandidate - ip:' + ip);

	statsPcStatusUpdate(event);
};

pc.onsignalingstatechange = function(event) {
	statsPcStatusUpdate(event);
};

pc.oniceconnectionstatechange = function(event) {
	statsPcStatusUpdate(event);
};

// establish connection to remote peer via webrtc
function npmConnect() {

	// disable inputs
	$('#npmConnect').prop('disabled', true);
	$('#signalingID').prop('disabled', true);
	$('#localIceFilter').prop('disabled', true);
	$('#npmLoadSettings').prop('disabled', true);

	$('#dcStatusContainer').removeClass('hidden');

	if (role === "offerer") {

		channelCreate('control');
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

		console.log("connect - role: offerer");

	// answerer role
	} else {
		// answerer must wait for the data channel
		pc.ondatachannel = function(event) {
			bindEvents(event.channel);
			console.log('incoming datachannel');
			statsChannelStatusUpdate();
		};

		// answerer needs to wait for an offer before generating the answer SDP
		firebaseReceive(signalingID, "offer", function(offer) {
			pc.setRemoteDescription(new SessionDescription(JSON.parse(offer)));

			// now we can generate our answer SDP
			pc.createAnswer(function(answer) {
				pc.setLocalDescription(answer);

				// send it to FireBase
				firebaseSend(signalingID, "answer", JSON.stringify(answer));
			}, errorHandler);
		});
		console.log('connect - role answerer');
	}

	// add handler for peers ice candidates
	signalingIDRef.child(signalingID).child(peerRole + '-iceCandidates').on('child_added', function(childSnapshot) {
		var childVal = childSnapshot.val();
		var peerCandidate = JSON.parse(childVal);

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

function npmPrepareRole() {
	// role offerer
	if ($('#signalingID').val() != '') {

		if ($('#signalingID').val() != '') {
			signalingID = $('#signalingID').val();
		}
		role = "answerer";
		peerRole = "offerer";

		$('#statusSigID').html(signalingID);
		$('#statusRole').html(role);
		$('#npmChannelParametersContainer').hide();

	// role answerer
	} else {
		role = 'offerer';
		peerRole = 'answerer';
		signalingID = freshSignalingID;
		$('#statusRole').html(role);
		$('#statusSigID').html("<a href='#" + signalingID + "'>" + signalingID + "</a>");
		$('#npmChannelParametersContainer').show();

	};
}

function npmSend(label) {

	if (label == 'control') {
		alert('Something went wrong - tried to send via control channel');
	}

	if (channels[label].statistics.t_start == 0) {
		channels[label].statistics.t_start = new Date().getTime();
	}

	channels[label].statistics.t_end = new Date().getTime();
	var runtime = (channels[label].statistics.t_end - channels[label].statistics.t_start);
	var message = generateByteString(randomWrapper(parameters[label].pktSize));
	var sendSleep	= randomWrapper(parameters[label].sendInterval);

	// check maximum runtime
	if (runtime <= parameters[label].runtime || parameters[label].runtime == 0) {
		if (channels[label].channel.bufferedAmount < npmSettings.bufferedAmountLimit) {
			if(sendSleep == 0) {
				var pktCounter = 0;

				while(channels[label].channel.bufferedAmount < npmSettings.bufferedAmountLimit && pktCounter < 10000 && (channels[label].statistics.tx_pkts + pktCounter) < parameters[label].pktCount) {
					channels[label].channel.send(message);
					pktCounter++;
				}

				channels[label].statistics.tx_pkts += pktCounter;
				channels[label].statistics.tx_bytes += message.length * pktCounter;

				sendSleep = 10;
				console.log('npmSend - sleep 0 - reached sending limit');

			} else {
				channels[label].channel.send(message);
				channels[label].statistics.tx_pkts++;
				channels[label].statistics.tx_bytes += message.length;
			}
		} else {
			console.log('npmSend - bufferedAmount >= limit (' + npmSettings.bufferedAmountLimit + ')');
		}

		if (channels[label].statistics.tx_pkts < parameters[label].pktCount) {
			var schedulerObject = {
				type : 'npmSendTrigger',
				sleep : sendSleep,
				data : label
			};
			scheduler.postMessage(schedulerObject);

		} else {
			console.log('npmSend - channel:' + label + ' - all pkts sent');
			channelClose(label);

		}
	} else {
		channelClose(label);
		console.log('npmSend - channel:' + label + ' - runtime reached');
	}
};

// run npm - read parameters and create datachannels
function npmStart() {
	// chef if parameters are correct
	if (!parametersValidate()) {
		return;
	}

	// parse parameters
	parametersParse();

	var npmChannelLabels = [];
	npmChannelLabels.push('timestamp');

	for (var label in parameters) {
		console.log('netPerfMeter - send');
		if (parameters.hasOwnProperty(label)) {
			if (parameters[label].active == true) {
				npmChannelLabels.push(label);
				channelCreate(label);
			}
		}
	}

	var collectStatsMessage = {
		type : 'collectStats',
		data : npmChannelLabels
	};
	console.log(npmChannelLabels);
	channels['control'].channel.send(JSON.stringify(collectStatsMessage));
}

// reset npm for next benchmark
function npmReset() {
	for (var label in channels) {
		if (channels.hasOwnProperty(label)) {
			if (label != 'control') {
				delete channels[label];
			}
		}
	}

	for (var label in parameters) {
		if (parameters.hasOwnProperty(label)) {
			if (label != 'control') {
				delete parameters[label];
			}
		}
	}

	channelStats = [];
	channelStatsCounter = 0;
	statsChannelStatusUpdate();
	statsDrawChart();

	if (role == 'offerer') {
		msgSendReset();
		$('#npmRun').prop('disabled', false);
	}

	console.log('npmReset');
}

//create new datachannel
function channelCreate(label) {
	// set options for datachannel
	var dataChannelOptions;
	if ( typeof parameters[label] != 'undefined') {
		var sendModeArray = parameters[label].sendMode.split(':');
		switch(sendModeArray[0]) {
		case "":
			dataChannelOptions = {
			};
			break;
		case "rt":
			dataChannelOptions = {
				maxRetransmits : sendModeArray[1],
			};
			break;
		case "timeout":
			dataChannelOptions = {
				maxPacketLifeTime : sendModeArray[1],
			};
			break;
		}
	}

	// offerer creates the data channel
	var newChannel = pc.createDataChannel(label, dataChannelOptions);
	bindEvents(newChannel);

	channels[newChannel.label] = {
		channel : newChannel,
		statistics : {
			t_start : 0,
			t_end : 0,
			t_last : 0,
			tx_pkts : 0,
			tx_bytes : 0,
			tx_bytes_last : 0,
			tx_rate_avg : 0,
			tx_rate_cur : 0,
			rx_pkts : 0,
			rx_bytes : 0,
			rx_bytes_last : 0,
			rx_rate_avg : 0,
			rx_rate_cur : 0
		}

	};

	statsChannelStatusUpdate();
	console.log("createDataChannel - label:" + newChannel.label + ', id:' + newChannel.id);
}

function channelClose(label) {
	console.log('closeDataChannel - channel:' + label);
	channels[label].channel.close();
}

// clone the first row from dc parameters and append it after the last row
function parametersRowAdd() {
	npmcDcCounter++;
	var cloneRow = $('.npmChannelParametersBlank').clone();
	cloneRow.removeClass('npmChannelParametersBlank');
	cloneRow.show();
	cloneRow.find('[name=toggleActive]').val('o' + npmcDcCounter);
	cloneRow.find('[name=toggleActive]').html(npmcDcCounter);
	$('#npmChannelParameters tbody').append(cloneRow);

	return cloneRow;
}

// remove specific row
function parametersRowDelete(element) {
	$(element).closest('tr').remove();
}

function parametersRowCopy(element) {
	npmcDcCounter++;
	var cloneRow = $(element).closest('tr').clone();
	cloneRow.find('[name=toggleActive]').val('o' + npmcDcCounter);
	cloneRow.find('[name=toggleActive]').html(npmcDcCounter);
	$('#npmChannelParameters tbody').append(cloneRow);
}

// create sample data
function parametersRowAddSamples() {
	var first = parametersRowAdd();
	first.find('[name=paramPktCount]').val('5000');
	first.find('[name=paramPktSize]').val('1024');
	first.find('[name=paramMode]').val('');
	first.find('[name=paramInterval]').val('0');
	first.find('[name=paramDelay]').val('1');
	first.find('[name=paramRuntime]').val('30');

	/*var second = parametersRowAdd();
	second.find('[name=paramPktCount]').val('1000');
	second.find('[name=paramPktSize]').val('uni:512:1536');
	//second.find('[name=paramMode]').val('ret:2');
	second.find('[name=paramInterval]').val('uni:5:15');
	second.find('[name=paramDelay]').val('2');
	second.find('[name=paramRuntime]').val('30');

	var third = parametersRowAdd();
	third.find('[name=paramPktCount]').val('2000');
	third.find('[name=paramPktSize]').val('exp:1024');
	//third.find('[name=paramMode]').val('lft:2');
	third.find('[name=paramInterval]').val('exp:10');
	third.find('[name=paramDelay]').val('2');
	third.find('[name=paramRuntime]').val('30');

	var third = parametersRowAdd();
	third.find('[name=paramPktCount]').val('2000');
	third.find('[name=paramPktSize]').val('con:1024');
	//third.find('[name=paramMode]').val('ret:2');
	third.find('[name=paramInterval]').val('exp:10');
	third.find('[name=paramDelay]').val('20');
	third.find('[name=paramRuntime]').val('30');

	var third = parametersRowAdd();
	third.find('[name=paramPktCount]').val('2000');
	third.find('[name=paramPktSize]').val('con:2048');
	//third.find('[name=paramMode]').val('lft:2');
	third.find('[name=paramInterval]').val('uni:0:5');
	third.find('[name=paramDelay]').val('20');
	third.find('[name=paramRuntime]').val('30');*/
}

function parametersValidate() {
	var inputValid = true;
	$('#npmChannelParameters > tbody > tr input').each(function() {
		$(this).removeClass('has-error');

		switch ($(this).attr('name')) {
		// gt 0
		case 'paramPktCount':
		case 'paramRuntime':
		case 'paramDelay':
			var pattern = /^(\d+)$/g;
			var string = $(this).val();
			if (!string.match(pattern)) {
				$(this).addClass('has-error');
				console.log('validation error');
				inputValid = false;
			}
			break;

		// pattern: number || const:number || exp:number || uniform:number:number
		case 'paramInterval':
		case 'paramPktSize':
			var pattern = /^(\d+|con:\d+|exp:\d+|uni:\d+:\d+)$/g;
			var string = $(this).val();
			if (!string.match(pattern)) {
				$(this).addClass('has-error');
				console.log('validation error');
				inputValid = false;
			}
			break;

		case 'paramMode':
			var pattern = /^(ret:\d+|lft:\d+)$/g;
			var string = $(this).val();
			if (string.length > 0 && !string.match(pattern)) {
				$(this).addClass('has-error');
				console.log('validation error');
				inputValid = false;
			}
			break;
		}
	});

	return inputValid;
}

// read parameters from table and save in parameters object
function parametersParse() {
	$('#npmChannelParameters > tbody > tr').each(function() {
		parameters[$(this).find('button[name="toggleActive"]').val()] = {
			active : $(this).find('button[name="toggleActive"]').hasClass("btn-success"),
			label : $(this).find('button[name="toggleActive"]').val(),
			pktSize : $(this).find('input[name="paramPktSize"]').val(),
			pktCount : parseInt($(this).find('input[name="paramPktCount"]').val()),
			sendInterval : $(this).find('input[name="paramInterval"]').val(),
			sendMode : $(this).find('input[name="paramMode"]').val(),
			runtime : parseInt(($(this).find('input[name="paramRuntime"]').val() * 1000)),
			delay : parseInt(($(this).find('input[name="paramDelay"]').val() * 1000))
		};
	});

	console.log(parameters);
}

/*
 * generate a random uniformed integer between min and max
 */
function randomUniform(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*
 * test random unform
 */
function randomUniformTest(min, max, runs) {
	var sum = 0;
	for ( i = 0; i < runs; i++) {
		sum += randomUniform(min, max);
	}
	return sum / runs;
}

/*
 * generate a random exponential integer
 */
function randomExponential(expectation) {
	return Math.round(Math.abs(Math.log(Math.random()) / (1 / expectation)));
}

/*
 * test random exponential
 */
function randomExponentialTest(expectation, runs) {
	var sum = 0;
	for ( i = 0; i < runs; i++) {
		num = randomExponential(expectation);
		sum += num;
		console.log(num);
	}
	return sum / runs;
}

function randomWrapper(funcstring) {
	var paramArray = funcstring.split(':');

	if (paramArray.length == 1) {
		return parseInt(funcstring);
	} else {
		switch(paramArray[0]) {
		case 'con':
			return parseInt(paramArray[1]);
			break;

		case 'exp':
			return randomExponential(parseInt(paramArray[1]));
			break;

		case 'uni':
			return randomUniform(parseInt(paramArray[1]), parseInt(paramArray[2]));
			break;
		default:
			throw "random function unknown!";
		}
	}
}

// bind the channel events
function bindEvents(channel) {
	channel.onopen = function() {

		// datachannel openend on offerer-side
		if (role == 'offerer') {
			if (channel.label == "control") {
				$('#npmRun').prop('disabled', false);
			} else {
				$('#npmRun').prop('disabled', true);

				// start netperfmeter after defined delay
				setTimeout(function() {
					npmSend(channel.label);
				}, parameters[channel.label].delay);
			}

			// datachannel openend on answerer-side
		} else {
			channels[channel.label] = {
				channel : channel,
				statistics : {
					t_start : 0,
					t_end : 0,
					t_last : 0,
					tx_pkts : 0,
					tx_bytes : 0,
					tx_bytes_last : 0,
					tx_rate_avg : 0,
					tx_rate_cur : 0,
					rx_pkts : 0,
					rx_bytes : 0,
					rx_bytes_last : 0,
					rx_rate_avg : 0,
					rx_rate_cur : 0
				}
			};
		}

		statsChannelStatusUpdate();
		console.log("datachannel opened - label:" + channel.label + ', ID:' + channel.id);
	};

	// after close: update channel stats
	channel.onclose = function(e) {
		if (channel.label == "control") {
			console.log('control channel lost!');
			$('#npmRun').prop('disabled', true);
			$('#npmReset').prop('disabled', true);
		}
		statsChannelStatusUpdate();
		console.log("datachannel closed - label:" + channel.label + ', ID:' + channel.id);
	};

	window.onbeforeunload = function() {
		channel.close();
	};

	// handle messages
	channel.onmessage = function(e) {

		// control messages on control-channel
		if (e.currentTarget.label == 'control') {
			msgHandleJson(e.data);
			// handle data messages
		} else if (role == 'answerer') {
			msgHandleData(e);
		}
	};
}

// scheduler only used for npmSend
scheduler.onmessage = function(e) {
	//var message = e.data;

	//if (e.data.data != undefined && e.data.sleep != undefined && e.data.type != undefined) {
		switch(e.data.type) {
		case 'npmSendTrigger':
			npmSend(e.data.data);
			break;
		case 'recordStatsVector':
			recordStats();
			break;
		default:
			alert('scheduler - unknown messagetype!');
			break;
		}

	//}
};

/*
 * handle incoming json messages on control-channel and deliver to specific function
 */
function msgHandleJson(message) {
	var messageObject = JSON.parse(message);
	var tempChannelLabel = messageObject.label;

	switch(messageObject.type) {

	// statistics
	case 'statistics':
		break;

	// timestamp - echo timestamp to sender
	case 'timestamp':
		msgHandlePing(messageObject);
		break;

	// timestampEcho - measure RTT
	case 'timestampEcho':
		msgHandlePingEcho(messageObject);
		break;

	case 'reset':
		msgHandleReset();
		break;

	// trigger to collect statistics
	case 'collectStats':
		statsCollectInit(messageObject);
		break;
	default:
		alert('Unknown messagetype!!');
		break;
	}
}

/*
 * Handle reset Request
 */

function msgHandleReset() {
	console.log('received reset!');
	npmReset();
}

/*
 * Handle data message
 */
function msgHandleData(e) {
	rxDataLength = e.data.toString().length;

	var label = e.currentTarget.label;
	if (channels[label].statistics.t_start == 0) {
		channels[label].statistics.t_start = new Date().getTime();
	}
	channels[label].statistics.t_end = new Date().getTime();
	channels[label].statistics.rx_bytes += rxDataLength;
	channels[label].statistics.rx_pkts++;
}

/*
 * Echo received timestamp to peer
 */
function msgHandlePing(message) {
	var timestampEcho = message;
	timestampEcho.type = 'timestampEcho';
	channels['control'].channel.send(JSON.stringify(timestampEcho));
	console.log('handlePing - echo received timestamp to peer: ' + timestampEcho.timestamp);
}

/*
 * evaluate received Echo
 */
function msgHandlePingEcho(message) {
	var date = new Date();
	var t_delta = date.getTime() - message.timestamp;
	$('#npmcPing .rtt').html(' - RTT: ' + t_delta + ' ms');
	console.log('handlePingEcho - received echoed timestamp from peer - RTT: ' + t_delta);
}

/*
 * Send a message to peer with local timestamp
 */
function msgSendPing() {
	var date = new Date();
	timestampMessage = {
		type : 'timestamp',
		timestamp : date.getTime(),
	};
	channels['control'].channel.send(JSON.stringify(timestampMessage));
	console.log('ping - sending timestamp to peer: ' + timestampMessage.timestamp);
}

function msgSendReset() {
	resetMessage = {
		type : 'reset'
	};
	channels['control'].channel.send(JSON.stringify(resetMessage));
	console.log('sending reset message');
}

function statsCollectInit(messageObject) {
	$('#channelChartContainer').removeClass('hidden');
	channelStats = [];
	channelStats.push(messageObject.data);
	console.log(channelStats);
	setTimeout(statsCollect, npmSettings.statsCollectInterval);
}

function statsCollect() {
	var activeChannels = 0;

	var tempTime = new Date().getTime();
	var tempRxRate = 0;
	var tempStatsArray = [];
	tempStatsArray.push(channelStatsCounter++);

	for (var i = 1; i < channelStats[0].length; i++) {
		var label = channelStats[0][i];
		//alert(label);
		if (channels[label].channel.readyState == 'open') {
			activeChannels++;

			tempRxRate = Math.round((channels[label].statistics.rx_bytes - channels[label].statistics.rx_bytes_last) / (tempTime - channels[label].statistics.t_last) * 1000);
			tempStatsArray.push(tempRxRate);

			channels[label].statistics.rx_bytes_last = channels[label].statistics.rx_bytes;
			channels[label].statistics.t_last = tempTime;

		} else {
			tempStatsArray.push(0);
		}
	}

	channelStats.push(tempStatsArray);

	if (activeChannels > 0) {
		setTimeout(statsCollect, npmSettings.statsCollectInterval);
	} else {
		console.log('statsCollect - no active channels left!');
		statsDrawChart();
	}
}

function statsDrawChart() {

	if (channelStats.length < 2) {
		return;
	}

	chartData = google.visualization.arrayToDataTable(channelStats);
	chart.draw(chartData, chartOptions);
}

// update the PeerConnectionStatus Table
function statsPcStatusUpdate(event) {
	$('#signalingState').html(pc.signalingState);
	$('#iceConnectionState').html(pc.iceConnectionState);
	$('#iceGatheringState').html(pc.iceGatheringState);
	console.log('PeerConnection - Change signaling state:' + pc.signalingState);
	return true;
}

// update the ChannelStatus Table - in dependency of being offerer or sender
function statsChannelStatusUpdate(event) {

	$('table#dcStatus tbody').empty();
	var activeChannels = false;

	$.each(channels, function(key, value) {
		var channel = value.channel;
		var statistics = value.statistics;

		// if control channel is open, enable npm and ping - if not: disable!
		if (channel.label == 'control') {
			if (channel.readyState === 'open') {
				$('#npmcRun').removeAttr('disabled');
				$('#npmcPing').removeAttr('disabled');
				$('#npmSaveStats').removeAttr('disabled');
			} else {
				$('#npmcRun').attr('disabled', true);
				$('#npmcPing').attr('disabled', true);
				$('#npmSaveStats').attr('disabled', true);
			}
		}

		// if channel is open, offer to close it
		var actionHTML = '';
		if (channel.readyState === 'open') {
			if (channel.label != 'control') {
				activeChannels = true;
			}

			actionHTML = '<button class="btn-default btn btn-xs" onclick="channelClose(\'' + value.channel.label + '\');">close</button>';
		}

		// calculate statistics
		if (statistics.t_start != 0) {
			statistics.rx_rate_avg = statistics.rx_bytes / (statistics.t_end - statistics.t_start) * 1000;
			statistics.tx_rate_avg = statistics.tx_bytes / (statistics.t_end - statistics.t_start) * 1000;
		}

		if (role == 'offerer') {
			$('table#dcStatus tbody').append('<tr><td>' + channel.id + '</td><td><span class="dcStatus-' + channel.readyState + '">' + channel.readyState + '</span></td><td>' + channel.label + '</td><td>' + statistics.tx_pkts + '</td><td>' + bytesToSize(statistics.tx_bytes) + '</td><td>' + bytesToSize(statistics.tx_rate_avg) + '/s</td><td>' + actionHTML + '</td></tr>');
		} else {
			$('table#dcStatus tbody').append('<tr><td>' + channel.id + '</td><td><span class="dcStatus-' + channel.readyState + '">' + channel.readyState + '</span></td><td>' + channel.label + '</td><td>' + statistics.rx_pkts + '</td><td>' + bytesToSize(statistics.rx_bytes) + '</td><td>' + bytesToSize(statistics.rx_rate_avg) + '/s</td><td>' + actionHTML + '</td></tr>');

		}

	});

	if (activeChannels && npmcStatisticsTimerActive == false) {
		npmcStatisticsTimerActive = true;
		setTimeout(function() {
			npmcStatisticsTimerActive = false;
			statsChannelStatusUpdate();
		}, npmSettings.statsTableRefreshInterval);
		refreshCounter++;
	}

	if (!activeChannels && channels.hasOwnProperty('control') && channels['control'].channel.readyState == 'open') {
		$("#npmReset").prop('disabled', false);

	} else {
		$("#npmReset").prop('disabled', true);
	}
	if (refreshCounter % 3 == 0 && role == 'answerer') {
		console.log('Graphzeichenn!!!');
		statsDrawChart();
	}

	return true;
}

/*
 * Apply settings from editor
 */
function channelSettingsEditorApply() {
	$("#npmChannelParameters tbody").html($('#channelSettingsEditorTextarea').val());
	console.log('settings applied');
}

/*
 * Show settings editor
 */
function channelSettingsEditorShow() {
	$('#npmChannelParameters > tbody > tr > td > input').each(function() {
		$(this).attr('value', $(this).val());
	});

	$('#channelSettingsEditorTextarea').val($("#npmChannelParameters tbody").html());
}

/*
 * Save the channel settings to webstorage
 */
function channelSettingsSave() {
	$('#npmChannelParameters > tbody > tr > td > input').each(function() {
		$(this).attr('value', $(this).val());
	});

	//var channelSettingsHTML = $("#npmChannelParameters tbody").html();
	localStorage.setItem('npmChannelSettings', $("#npmChannelParameters tbody").html());
	localStorage.setItem('localIceFilter', $('#localIceFilter').val());

	console.log('settings saved');
}

/*
 * load channel settings from webstorage
 */
function channelSettingsLoad() {

	var channelSettingsHTML = localStorage.getItem('npmChannelSettings');
	var localIceFilter = localStorage.getItem('localIceFilter');

	if (localIceFilter) {
		$("#localIceFilter").val(localIceFilter);
	}

	if (channelSettingsHTML) {
		$("#npmChannelParameters tbody").html(channelSettingsHTML);
	}

	if (!localIceFilter && !channelSettingsHTML) {
		alert('Sorry - No saved settings available!');
	}

	console.log('settings loaded');
}

// generate a unique-ish string for storage in firebase
function generateSignalingID() {
	return (Math.random() * 10000 + 10000 | 0).toString();
}

// find and return an IPv4 Address from a given string
// taken from: https://gist.github.com/syzdek/6086792
function extractIpFromString(string) {
	var match;
	var pattern4 = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/

	if(match = string.match(pattern4)) {
		return match[0];
	}

	var pattern6 = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/

	if(match = string.match(pattern6)) {
		return match[0];
	}

	return false;
}

/*
 * generate a string with given length (byte)
 */
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

/*
 * conver sizes
 * http://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
 */

function bytesToSize(bytes) {
	if (bytes <= 0 || !$.isNumeric(bytes))
		return '-- Bytes';
	var k = 1000;
	var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

// button toggle used to activate and deactivate channels
$('#npmChannelParameters').on('click', 'button[name="toggleActive"]', function(event) {
	$(this).toggleClass('btn-default btn-success');
	if ($(this).hasClass('btn-success')) {
		$(this).data('active', true);
	} else {
		$(this).data('active', false);
	}
	event.preventDefault();
});

// select reliability options for specific channel - this function provides dropdown functionality
$('#npmChannelParameters').on('change', 'select[name=paramMode]', function(event) {
	var parentId = $(this).closest('tr').prop('id');
	var paramModeValueInput = $('#' + parentId + ' input[name=paramModeValue]');
	var selectedMode = $(this).val();

	if (selectedMode == "reliable") {
		paramModeValueInput.prop('disabled', true);
	} else {
		paramModeValueInput.prop('disabled', false);
	}

	$(this).children("option").each(function() {
		if ($(this).val() == selectedMode) {
			$(this).attr('selected', true);
		} else {
			$(this).attr('selected', false);
		}
	});

	event.preventDefault();
});

// after chaning the signaling ID value - prepare role
$('#signalingID').change(function() {
	npmPrepareRole();
});
