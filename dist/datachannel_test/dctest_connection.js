/*
* Copyright (c) 2014 Peter Titz
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
*/

/**
 * This file handels the SDP and ICE Candidates for Signalling on local Peers, necessary for dataChannel_local_test
 * To mimic an RTCDataChannel connection between two peers we need two RTCPeerConnections and two RTCDataChannels
 */

// RTCDataChannel variables
var showSDP = true;
var showICE = true;
var localChannel = null;
var remoteChannel = null;
var remotePeerConnection = null;
var localPeerConnection = null;
var testRTCPeerConnection = window.RTCPeerConnection;
var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription;

//In this case we need no ICE Servers
var iceServers = null;

// Otherwise audio will be enabled (Deprecated)

 var constraints = {
 mandatory : {
 OfferToReceiveAudio : false,
 OfferToReceiveVideo : false
 }
 };

/*
var constraints = {
    OfferToReceiveAudio : false,
    OfferToReceiveVideo : false
};*/

function setDescFail(e) {
    console.log("Set description Fail ", e);
}

function setDescSuccess() {
    //console.log("Set description Success");
}

function setICEFail(e){
    console.log("Fail to add ICE Candidate: " + e);
}

function setICESuccess(){
    // Success
}
// Handler to be called as soon as the local SDP (Session Description Protocol) is available to the application
function gotLocalDescription(desc) {
    // Set local SDP as (local/remote) description for both local and remote parties
    localPeerConnection.setLocalDescription(desc, setDescSuccess, setDescFail);
    if (showSDP)
        console.log('localPeerConnection\'s SDP: \n', desc);

    remotePeerConnection.setRemoteDescription(desc, setDescSuccess, setDescFail);
    // Create answer from the 'remote party, based on the local SDP
    remotePeerConnection.createAnswer(gotRemoteDescription, onSignalingError);
}

// Handler to be called as soon as the remote SDP is made available to the application
function gotRemoteDescription(desc) {
    // Set 'remote' SDP as the right (remote/local) description for both local and 'remote' parties
    remotePeerConnection.setLocalDescription(desc, setDescSuccess, setDescFail);
    if (showSDP)
        console.log('Answer from remotePeerConnection\'s SDP: \n', desc);
    localPeerConnection.setRemoteDescription(desc, setDescSuccess, setDescFail);
}

function onSignalingError(err) {
    console.log("Failed to create signaling message : ", err);
}

// Make the dataChannel association
function createIceCandidatesAndOffer() {
    // Associate peer connection with ICE events
    localPeerConnection.onicecandidate = function(e) {
        if (e.candidate) {
            remotePeerConnection.addIceCandidate(e.candidate, setICESuccess, setICEFail);
            if (showICE)
                console.log("local ", e.candidate);
        }
    };

    remotePeerConnection.onicecandidate = function(e) {
        if (e.candidate) {
            localPeerConnection.addIceCandidate(e.candidate, setICESuccess, setICEFail);
            if (showICE)
                console.log("remote ", e.candidate);
        }
    };

    /* Can also Use onnegotiationneeded to create the offer
    localPeerConnection.onnegotiationneeded = function(){
    localPeerConnection.createOffer(gotLocalDescription, onSignalingError); 
    };
    */

    // Now we can negoatiate a session
    localPeerConnection.createOffer(gotLocalDescription, onSignalingError, constraints);

}

// Close the available RTCPeerConnections
function closeRTCPeerConnection() {
    try {
        if (localChannel != null) {
            if (localChannel.readyState != "closed") {
                localChannel.close();
            }
        }

        if (remoteChannel != null) {
            if (remoteChannel.readyState != "closed") {
                remoteChannel.close();
            }
        }
        // Close peer connections
        if (localPeerConnection != null) {
            if (localPeerConnection.signalingState != "closed") {
                // console.log("Close local peer connection");
                localPeerConnection.close();
            }
        }

        if (remotePeerConnection != null) {
            if (remotePeerConnection.signalingState != "closed") {
                // console.log("Close remote peer connection");
                remotePeerConnection.close();
            }

        }

        // Objects
        localChannel = null;
        remoteChannel = null;
        localPeerConnection = null;
        remotePeerConnection = null;

    } catch(err) {
        console.log("Error - Closing Channels", err);
    }
}

