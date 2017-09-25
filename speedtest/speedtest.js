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


// constraints on the offer SDP.
var sdpConstraints = {
    'mandatory' : {
        'offerToReceiveAudio' : false,
        'offerToReceiveVideo' : false
    }
};

var socket = io("https://webrtc.nplab.de:3001/");
var appIdent = "speedtest";

var bufferedAmountLimit = 1 * 1024 * 1024;

var pc = new RTCPeerConnection(iceServer);
var dcControl = {};
var dcData = {};
var offerer = false;
var signalingInProgress = false;
var signalingId;

var scheduler = new Worker("speedtest.scheduler.js");

var speedtestParams = {
    runtime : 0,
    msgSize : 0
};

var speedtestInitator = false;
var speedtestStatsRemote = {};
var speedtestStatsLocal = {};
var speedtestStatsTempCounter = 0;
var speedtestMessage = "";
var speedtestContinueSending = true;
var speedtestSchedulerObject = {sleep : 10};
var speedtestSendLoopLimit = 1000;
var speedtestSendLoopCounter = 0;


// generic error handler
function errorHandler(err) {
    console.error(err);
}
// handle incoming info messages from server
socket.on('info', function(msg) {
    console.log('server info: ' + msg);
});

// handle incoming signaling messages
socket.on('signaling', function(msg) {
    if(!signalingInProgress) {
        console.log('signaling - error: no signaling in progress...');
        return;
    }

    switch(msg.type) {
        // answerer requests SDP-Offer
        case 'sdpRequest':
            if(offerer) {
                pc.createOffer(function(offer) {
                    pc.setLocalDescription(offer);
                    console.log(JSON.stringify(offer));
                    socket.emit('signaling', {type:'sdp',payload:offer});
                }, errorHandler, sdpConstraints);
            } else {
                console.log('error: got sdpRequest as answerer...');
            }
            break;

        // we receive an sdp message
        case 'sdp':
            // only process message if it's an offer and we aren't offerer and signaling hasn't finished yet
            if(msg.payload.type === 'offer' && !offerer) {
                pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
                // generate our answer SDP and send it to peer
                pc.createAnswer(function(answer) {
                    pc.setLocalDescription(answer);
                    socket.emit('signaling', {type:'sdp',payload:answer});
                }, errorHandler);
                console.log('signaling - handle sdp offer and send answer');
            // if we receive a sdp answer, we are the answerer and signaling isn't done yet, process answer
            } else if(msg.payload.type === 'answer' && offerer) {
                pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
                console.log('signaling - handle sdp answer');
            } else {
                console.log('signaling - unexpected sdp message');
            }
            break;
        // we receive an ice candidate
        case 'ice':
            var peerIceCandidate = new RTCIceCandidate(msg.payload);
            pc.addIceCandidate(peerIceCandidate);
            console.log('singaling - remote ice candiate: ' + extractIpFromString(msg.payload.candidate));
            break;
    }
});

// handle local ice candidates
pc.onicecandidate = function(event) {
    // take the first candidate that isn't null
    if (!pc || !event || !event.candidate) {
        return;
    }
    // send ice candidate to signaling service
    socket.emit('signaling', {type:'ice',payload:event.candidate});
    console.log('local ice candidate:' + extractIpFromString(event.candidate.candidate));
};

pc.oniceconnectionstatechange = function(event) {
    console.log("oniceconnectionstatechange - " + pc.iceConnectionState);
    if (pc.iceConnectionState === 'disconnected') {
        speedtestConnectionLost();
    }
};


// establish connection to remote peer via webrtc
function connect(active) {
    signalingInProgress = true;

    if(active == true) {
        console.log('role: offerer');
        offerer = true;
        signalingId = generateSignalingId();
    } else {
        console.log('role: answerer');
        offerer = false;
        signalingId = $('#signalingId').val();

        // basically chechking the signaling id
        if(!$.isNumeric(signalingId)) {
            console.log('Invalid signaling ID - break!');
            return;
        }
    }

    if(signalingId.length === 0) {
        console.log('signalingId empty');
        return;
    }

    // join room
    socket.emit('roomJoin', appIdent + signalingId);
    console.log('signaling - roomJoin - ' + appIdent + signalingId);
    $('#rowInit').slideUp();

    if (offerer == true) {
        $('.spinnerStatus').html('waiting for peer<br/>use id: ' + signalingId + '<br/><br/><div id="qrcode"></div>');
        //new QRCode(document.getElementById("qrcode"), window.location.href + '#' + signalingId);

        // create data channels
        dcControl = pc.createDataChannel('control');
        dcData = pc.createDataChannel('data');

        bindEventsControl(dcControl);
        bindEventsData(dcData);

        console.log("connect - role: offerer");
    } else {
        // request SDP from offerer
        socket.emit('signaling', {type:'sdpRequest'});
        console.log('signaling - sdpRequest');
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

        $('.spinnerStatus').text('connecting to peer id: ' + signalingId);
        console.log('connect - role answerer');
    }
    $('#rowSpinner').hide().removeClass('hidden').slideDown();
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
    };
}

function generateByteString(count) {
    if (count == 0) {
        return "";
    }
    var count2 = count / 2;
    var result = "F";

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
        rx_pkts : 0
    };

    speedtestStatsRemote = {
        rtt : 0,
        rx_t_start : 0,
        rx_t_end : 0,
        rx_pkts : 0
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
        type         : 'passiveRun',
        msgSize     : $("#paramMsgSize").val(),
        runtime     : $("#paramRuntime").val(),
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

        // decrease if more than 4 mb is pending
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
        //setTimeout(function(){ speedtestSend(); }, 10);

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
    var bandwithUpload = Math.round(speedtestStatsRemote.rx_pkts * speedtestParams.msgSize / ((speedtestStatsRemote.rx_t_end - speedtestStatsRemote.rx_t_start) / 1000) / 1000 / 1000 * 8 * 100) / 100;
    var bandwithDownload = Math.round(speedtestStatsLocal.rx_pkts * speedtestParams.msgSize / ((speedtestStatsLocal.rx_t_end - speedtestStatsLocal.rx_t_start) / 1000) / 1000 / 1000 * 8 * 100) / 100;
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
        console.log('msgHandleJson - startSending');
        speedtestRun();
        break;
    }

    // peer requests statistics
    case 'statsRequest':
        console.log('msgHandleJson - statisticsRequest');

        // show local bandwidth in gui
        var bandwith = Math.round(speedtestStatsLocal.rx_pkts * speedtestParams.msgSize / ((speedtestStatsLocal.rx_t_end - speedtestStatsLocal.rx_t_start) / 1000));
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
        var bandwith = Math.round(speedtestStatsRemote.rx_pkts * speedtestParams.msgSize / ((speedtestStatsRemote.rx_t_end - speedtestStatsRemote.rx_t_start) / 1000));

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
