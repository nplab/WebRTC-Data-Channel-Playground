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

var socket = io('https://webrtc.nplab.de:3001/');
var appIdent = 'signaling';

// constraints for the offer SDP - here we don't need audio or video...
var sdpConstraints = {
    OfferToReceiveAudio : false,
    OfferToReceiveVideo : false
};

var pc = new PeerConnection(iceServer);
var dcControl = {};
var offerer;
var signalingInProgress = false;
var signalingId;

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
                pc.setRemoteDescription(new SessionDescription(msg.payload));
                // generate our answer SDP and send it to peer
                pc.createAnswer(function(answer) {
                    pc.setLocalDescription(answer);
                    socket.emit('signaling', {type:'sdp',payload:answer});
                }, errorHandler);
                console.log('signaling - handle sdp offer and send answer');
            // if we receive a sdp answer, we are the answerer and signaling isn't done yet, process answer
            } else if(msg.payload.type === 'answer' && offerer) {
                pc.setRemoteDescription(new SessionDescription(msg.payload));
                console.log('signaling - handle sdp answer');
            } else {
                console.log('signaling - unexpected sdp message');
            }
            break;
        // we receive an ice candidate
        case 'ice':
            var peerIceCandidate = new IceCandidate(msg.payload);
            pc.addIceCandidate(peerIceCandidate);
            console.log('singaling - remote ice candiate: ' + extractIpFromString(msg.payload.candidate));
            break;
    }
});

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
    // send ice candidate to signaling service
    socket.emit('signaling', {type:'ice',payload:event.candidate});
    console.log('local ice candidate:' + extractIpFromString(event.candidate.candidate));
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
    $('#rowInit').slideUp();

    if (offerer == true) {
        $('.spinnerStatus').html('waiting for peer<br/>use id: ' + signalingId + '<br/><br/><div id="qrcode"></div>');
        //new QRCode(document.getElementById("qrcode"), window.location.href + '#' + signalingId);

        // create data channel
        dcControl = pc.createDataChannel('control');
        bindEventsControl(dcControl);
        console.log("connect - role: offerer");
    } else {
        // request SDP from offerer
        socket.emit('signaling', {type:'sdpRequest'});
        // answerer must wait for the data channel
        pc.ondatachannel = function(event) {
            // bin incoming control channel
            if (event.channel.label == "control") {
                dcControl = event.channel;
                bindEventsControl(event.channel);
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
        $('#rowSpinner').slideUp();
        $('#rowChat').hide().removeClass('hidden').slideDown();
        $('#chatMessages').append('<div class="alert alert-warning" role="alert">Connection up - HTML enabled!</div>');
        console.log('Channel Open - Label:' + channel.label + ', ID:' + channel.id);
    };

    channel.onclose = function(e) {
        console.log("Channel Close");
        $('#chatMessages').append('<div class="alert alert-warning" role="alert">Connection lost!</div>');
        $('#chatControl').slideUp();
    };

    window.onbeforeunload = function() {
        channel.close();
    };

    channel.onmessage = function(e) {
        $('#chatMessages').append('<div class="alert alert-info text-right" role="alert">' + e.data + '</div>');
    };
}

// Send message to peer
$('#chatInput').keypress(function (e) {
    if (e.which == 13) {
        var text = $(this).val();
        dcControl.send(text);
        $('#chatMessages').append('<div class="alert alert-success" role="alert">' + text + '</div>');
        $(this).val('');
      }
});
