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

var dctests_event = {
    "event001": {
        "description": "Set up a DataChannel - Close the DataChannel (both) and check whether the EventHandler \"onclose\" is called",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A&B:  closes the DataChannel.</li>\
            <li>Wait 3 seconds.</li>\
            <li>Peer A&B:  checks if the onclose EventHandler was called.</li>\
        </ol>",
        "references": ["W3CDataA"],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_event001
    },
    "event002": {
        "description": "Set up a DataChannel - Close the DataChannel (local) and check whether the EventHandler \"onclose\" is called",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A:  closes the DataChannel.</li>\
            <li>Wait 3 seconds.</li>\
            <li>Peer A&B:  checks if the onclose EventHandler was called.</li>\
        </ol>",
        "references": ["W3CDataA"],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_event002
    },
    "event003": {
        "description": "Set up a DataChannel - Close the DataChannel (remote) and check whether the EventHandler \"onclose\" is called",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer B:  closes the DataChannel.</li>\
            <li>Wait 3 seconds.</li>\
            <li>Peer A&B:  checks if the onclose EventHandler was called.</li>\
        </ol>",
        "references": ["W3CDataA"],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_event003
    },
    "event004": {
        "description": "Set up a DataChannel - send a message in both directions and check whether the EventHandler \"onmessage\" is called",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A/B:  sends a message.</li>\
            <li>Wait 3 seconds.</li>\
            <li>Peer A/B:  checks if the onmessage EventHandler was called.</li>\
        </ol>",
        "references": ["W3CDataA"],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_event004
    },
    "event005": {
        "description": "Set up a DataChannel - check whether the EventHandler \"onopen\" is called",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Wait 3 seconds.</li>\
            <li>Peer A/B:  checks if the onopen EventHandler was called.</li>\
        </ol>",
        "references": ["W3CDataA"],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_event005
    },
    "event006": {
        "description": "Set up a DataChannel - close the DataChannel (method close) - check readyState should be \"closing\" or \"closed\"",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A:  closes the DataChannel.</li>\
            <li>Peer A/B:  checks new readyState, should be “closing” or “closed”.</li>\
        </ol>",
        "references": ["W3CDataA"],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_event006
    }
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A&B:  closes the DataChannel
- Wait 3 seconds
- Peer A&B:  checks if the onclose EventHandler was called

 */
// Origin: W3C - 5.2.1 Attributes - onclose - type EventHandler
function testDC_event001(test) {
    var isDCRemoteClose = false;
    var isDCLocalClose = false;
    var waitTime = 3000;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_evten001");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        localChannel.onclose = function() {
            isDCLocalClose = true;
        };
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onclose = function() {
                isDCRemoteClose = true;
            };

            remoteChannel.onopen = function() {
                localChannel.close();
                remoteChannel.close();
            };
            setTimeout(test.step_func(function() {
                if (!(isDCRemoteClose && isDCLocalClose))
                    assert_unreached("onclose function was not called " + waitTime + " sec. - local:" + isDCLocalClose + ' / remote:' + isDCRemoteClose);
                test.done();
            }), waitTime);
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A:  closes the DataChannel
- Wait 3 seconds
- Peer A&B:  checks if the onclose EventHandler was called

 */
// Origin: W3C - 5.2.1 Attributes - onclose - type EventHandler
function testDC_event002(test) {
    var isDCRemoteClose = false;
    var isDCLocalClose = false;
    var waitTime = 3000;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_evten001");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        localChannel.onclose = function() {
            isDCLocalClose = true;
        };
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onclose = function() {
                isDCRemoteClose = true;
            };

            remoteChannel.onopen = function() {
                localChannel.close();
            };
            setTimeout(test.step_func(function() {
                if (!(isDCRemoteClose && isDCLocalClose))
                    assert_unreached("onclose function was not called " + waitTime + " sec. - local:" + isDCLocalClose + ' / remote:' + isDCRemoteClose);
                test.done();
            }), waitTime);
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer B:  closes the DataChannel
- Wait 3 seconds
- Peer A&B:  checks if the onclose EventHandler was called

 */
// Origin: W3C - 5.2.1 Attributes - onclose - type EventHandler
function testDC_event003(test) {
    var isDCRemoteClose = false;
    var isDCLocalClose = false;
    var waitTime = 3000;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_evten001");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        localChannel.onclose = function() {
            isDCLocalClose = true;
        };
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onclose = function() {
                isDCRemoteClose = true;
            };

            remoteChannel.onopen = function() {
                remoteChannel.close();
            };
            setTimeout(test.step_func(function() {
                if (!(isDCRemoteClose && isDCLocalClose))
                    assert_unreached("onclose function was not called " + waitTime + " sec. - local:" + isDCLocalClose + ' / remote:' + isDCRemoteClose);
                test.done();
            }), waitTime);
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A/B:  sends a message 
- Wait 3 seconds
- Peer A/B:  checks if the onmessage EventHandler was called

 */
// Origin: W3C - 5.2.1 Attributes - onmessage - type EventHandler
function testDC_event004(test) {
    var isLocalMessage = false, isRemoteMessage = false;
    var waitTime = 3000;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);

        try {
            localChannel = localPeerConnection.createDataChannel("testDC_evten002");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;

            remoteChannel.onopen = function() {
                localChannel.send("message");
                remoteChannel.send("message");
            };
            localChannel.onmessage = function() {
                isLocalMessage = true;
            };
            remoteChannel.onmessage = function() {
                isRemoteMessage = true;
            };

            setTimeout(test.step_func(function() {
                if (!(isLocalMessage && isRemoteMessage))
                    assert_unreached("onmessage function was not called after " + waitTime + " sec.");

                test.done();
            }), waitTime);

        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Wait 3 seconds
- Peer A/B:  checks if the onopen EventHandler was called

 */
// Origin: W3C - 5.2.1 Attributes - onopen - type EventHandler
function testDC_event005(test) {
    var isLocalOpen = false, isRemoteOpen = false;
    var waitTime = 3000;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);

        try {
            localChannel = localPeerConnection.createDataChannel("testDC_evten003");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        localChannel.onopen = function() {
            isLocalOpen = true;
        };
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = function() {
                isRemoteOpen = true;
            };
        };
        setTimeout(test.step_func(function() {
            if (!(isLocalOpen && isRemoteOpen))
                assert_unreached("onclose function was not called");
            test.done();
        }), waitTime);
    });
}


/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A/B:  closes the DataChannel
- Peer A/B:  checks new readyState, should be “closing” or “closed”

 */
// Origin: W3C - 5.2.2 Methods - close
function testDC_event006(test) {
    var readyStates = "";

    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_evten004");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = function() {
                // regardless which channel initiated the connection
                remoteChannel.close();
                readyStates += remoteChannel.readyState + localChannel.readyState;
                localChannel.close();
                readyStates += remoteChannel.readyState + localChannel.readyState;
                setTimeout(test.step_func(function() {
                    readyStates += remoteChannel.readyState + localChannel.readyState;
                    assert_true(((readyStates.search("closed") != -1) || (readyStates.search("closing") != -1)), "ReadyState 'closing' or 'closed' not set");
                    test.done();
                }), 1000);
            };
        });
    });
}

