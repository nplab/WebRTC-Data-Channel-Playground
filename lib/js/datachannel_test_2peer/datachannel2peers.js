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
// Logging information (console)
var showSDP = true;
var showICE = true;

// Shows signalling info (address for the other peer)
var signallingInfo = document.getElementById("signallingInfo");

// Firebase - Signalling
var dataRef = new Firebase("https://burning-fire-5285.firebaseio.com");
var dataRefRoom = dataRef.child("tests");

// prefices? (webRTC API - is in development)
var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

// STUN/TURN servers, required to create a P2P-Connection over NATs
var servers = {
    iceServers : [{
        url : "stun:23.21.150.121"
    }, {
        url : 'stun:stun01.sipphone.com'
    }, {
        url : 'stun:stun.ekiga.net'
    }, {
        url : 'stun:stun.fwdnet.net'
    }, {
        url : 'stun:stun.ideasip.com'
    }, {
        url : 'stun:stun.iptel.org'
    }, {
        url : 'stun:stun.rixtelecom.se'
    }, {
        url : 'stun:stun.schlund.de'
    }, {
        url : 'stun:stun.l.google.com:19302'
    }, {
        url : 'stun:stun1.l.google.com:19302'
    }, {
        url : 'stun:stun2.l.google.com:19302'
    }, {
        url : 'stun:stun3.l.google.com:19302'
    }, {
        url : 'stun:stun4.l.google.com:19302'
    }, {
        url : 'stun:stunserver.org'
    }]
};

// Otherwise audio will be enabled (Deprecated)

var constraints = {
    mandatory : {
        OfferToReceiveAudio : false,
        OfferToReceiveVideo : false
    }
};
//var constraints = {OfferToReceiveAudio : false, OfferToReceiveVideo : false};

// Create the peerConnection
var peerConnection = new PeerConnection(servers);

// Set up a generic error handler
function errorHandler(erro) {
    console.log("Time: " + (performance.now() / 1000).toFixed(2) + ": ", erro);
}

function setDescFail(e) {
    console.log("Set description Fail - ", e);
    signallingInfo.innerHTML = "Got unexpected Description Fail!<br \><strong>Please reload the page and try again!</strong> " + e.name;
}

function setDescSuccess() {
    if (showSDP)
        console.log("Set description Success");
}

function setICEFail(e){
    console.log("Fail to add ICE Candidate: " + e);
}

function setICESuccess(){
    // Success
}
// Generate random id string, to define the signaling Channel
function randomID() {
    return ((Math.random() * 10000) << 3 | 0).toString();
}

// Firebase wrapper, for Signalling you can also use a postcard
// test: testID, key= offer/answer or Candidate, data= "SDP or ICECandidate"
/**
 * Send Signaling Message
 * @param {Object} testID
 * @param {Object} type : offer or answer
 * @param {Object} cb : Session-Information
 */
function sendFirebase(testID, type, data) {
    dataRefRoom.child(testID).child(type).set(data);
}

/**
 * Receive Signaling Message
 * @param {Object} testID
 * @param {Object} type : offer or answer
 * @param {Object} cb : callback Funktion
 */
function recvFirebase(testID, type, cb) {
    dataRefRoom.child(testID).child(type).on("value", function(snapshot, key) {
        var data = snapshot.val();
        if (data) {
            cb(data);
        }
    });
}

// Remove an explicit room
function remFirebase(testID) {
    dataRefRoom.child(testID).remove();
}

// Check which Type of Peer we are
// OFFERER or ANSWERER (additional address information -> Answerer)
var testID = location.hash.substr(1);
var offerer = false;

// If no room number is available so create one to be the offerer
if (!testID) {
    offerer = true;
    testID = randomID();
    signallingInfo.innerHTML = "<strong>Offerer</strong><br />Test-ID: " + testID + "<br /><a href='#" + testID + "'>Transfer this link to other peer</a><br /><br /><strong><div id='state'>State: ...</div></strong><br /><button id='connectBtn'>Connecting</button>";
    // Connect button
    var connectBtn = document.getElementById("connectBtn");
    connectBtn.onclick = function() {
        connectBtn.hidden = true;
        connectToPeer();
    };
} else {// The answerer
    signallingInfo.innerHTML = "<strong>Answerer</strong><br />Test-ID: " + testID + "<br /><br /><br /><strong><div id='state'>State: Waiting for Offerer...</div></strong><br />";
    connectToPeer();
}
var state = document.getElementById("state");

// an ICE-Event will fired once an ICE Candidate was found
peerConnection.onicecandidate = function(event) {
    // a peer can have more then one ICE Candidate so take the first
    if (!event.candidate) {
        return;
    }
    // Only send one ICE Candidate
    peerConnection.onicecandidate = null;
    if (showICE)
        console.log("Send Candidate: ", event.candidate);
    // send the ICE Candidate
    sendFirebase(testID, "Candidate:" + offerer, JSON.stringify(event.candidate));
};

// request the other peer ICE-Candidate
recvFirebase(testID, "Candidate:" + !offerer, function(candidate) {
    peerConnection.addIceCandidate(new IceCandidate(JSON.parse(candidate)), setICESuccess, errorHandler);
});

function connectToPeer() {
    if (offerer) {
        // create offer SDP
        peerConnection.createOffer(function(offer) {
            peerConnection.setLocalDescription(offer, setDescSuccess, setDescFail);
            if (showSDP)
                console.log("Offer: ", offer);
            // send the offer SDP
            sendFirebase(testID, "offer", JSON.stringify(offer));

            // Wait for an answer from Firebase
            recvFirebase(testID, "answer", function(answer) {
                peerConnection.setRemoteDescription(new SessionDescription(JSON.parse(answer)), setDescSuccess, setDescFail);
                if (showSDP)
                    console.log("Answer: ", answer);
            });

            //Add error Handler and  constraints
        }, errorHandler, constraints);
    } else {
        // Wait for an offer and than generate the answer SDP
        recvFirebase(testID, "offer", function(offer) {
            peerConnection.setRemoteDescription(new SessionDescription(JSON.parse(offer)), setDescSuccess, setDescFail);
            if (showSDP)
                console.log("Offer: ", offer);
            // Generate the answer SDP
            peerConnection.createAnswer(function(answer) {
                peerConnection.setLocalDescription(answer, setDescSuccess, setDescFail);
                if (showSDP)
                    console.log("Answer: ", answer);
                // send the information to firebase
                sendFirebase(testID, "answer", JSON.stringify(answer));
            }, errorHandler, constraints);
        });
    }
}

// Inform the peers about the signalingstate
peerConnection.onsignalingstatechange = function() {
    if (peerConnection.signalingState == "stable") {
        state.innerHTML = "State: Connected - stable";
    } else {
        state.innerHTML = "State: " + peerConnection.signalingState;
    }
};

