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

var dctests_create = {
    "create001": {
        "description": "Call .createDataChannel() while PeerConnection is closed - throw an InvalidStateError exception",
        "timeout": 5000,
        "sync": true,
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#methods-2"
        ],
        "test_function": testDC_create001
    },
    "create002": {
        "description": "Call .createDataChannel() two times with the same id - throw a ResourceInUse exception",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with id = 2.</li>\
            <li>Peer A: creates another DataChannel  with id = 2.</li>\
            <li>Must throw an ResourceInUse exception.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#methods-2"
        ],
        "timeout": 5000,
        "sync": true,
        "test_function": testDC_create002
    },
    "create003": {
        "description": "Set up a DataChannel with ID = 4 – after established connection try to set up another DataChannel with ID = 4 – throw a ResourceInUse exception",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with id = 4.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>After established connection - Peer A: creates another DataChannel with id = 4.</li>\
            <li>Throw an ResourceInUse exception.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#methods-2"
        ],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_create003
    },
    "create004": {
        "description": "Call .createDataChannel() and check readyState - must initially be in the connecting state",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer A: checks readyState, must initially be in the connecting state.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#rtcdatachannel"
        ],
        "timeout": 5000,
        "sync": true,
        "test_function": testDC_create004
    },
    "create005": {
        "description": "Set up a DataChannel and check readyState - should be connecting then open",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer A: checks readyState - should be \“connecting\”.</li>\
            <li>Peer B: waits for the DataChannel.</li>\\n\
            <li>Peer A/B: checks readyState - should be \“open\”.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#rtcdatachannel"
        ],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_create005
    },
    "create006": {
        "description": "Set up a DataChannel - close RTCPeerConnection (creator closes RTCPeerConnection) - readyState on both peers should be closed",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A: After established Connection – closes the PeerConnection.</li>\
            <li>Waiting 3 seconds.</li>\
            <li>Peer A/B: checks readyState.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#rtcdatachannel",
            "http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.7"
        ],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_create006
    },
    "create007": {
        "description": "Set up a DataChannel - close RTCPeerConnection (remote peer closes RTCPeerConnection) - readyState on both peers should be closed.",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer B: After established Connection – closes the PeerConnection.</li>\
            <li>Waiting 3 seconds.</li>\
            <li>Peer A/B: checks readyState.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#rtcdatachannel",
            "http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.7"
        ],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_create007
    },
    "create008": {
        "description": "Set up a DataChannel - close DataChannel (creator closes DataChannel) - readyState on both peers should be closed",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A: After established Connection – closes the DataChannel.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Waiting 3 seconds.</li>\
            <li>Peer A/B: checks readyState.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#rtcdatachannel",
            "http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.7"
        ],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_create008
    },
    "create009": {
        "description": "Set up a DataChannel - close DataChannel (remote peer closes DataChannel) - readyState on both peers should be closed",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer B: After established Connection – closes the DataChannel.</li>\
            <li>Waiting 3 seconds.</li>\
            <li>Peer A/B: checks readyState.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#rtcdatachannel",
            "http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.7"
        ],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_create009
    }
};

/**
- Peer A: creates a DataChannel while RTCPeerConnection signaling State is closed
- Throw an InvalidStateError exception
 */
// Origin: W3C - 5.1.2 - Methods: 1
function testDC_create001() {
    localPeerConnection = new RTCPeerConnection(iceServers);
    localPeerConnection.close();
    assert_throws("InvalidStateError", function() {
        localChannel = localPeerConnection.createDataChannel("testDC_create001");
    }, "Wrong error was thrown ");
}

/**
- Peer A: creates a DataChannel  with id = 2
- Peer A: creates another DataChannel  with id = 2
- Must throw an ResourceInUse exception
 */
// Origin: W3C - 5.1.2 - Methods: 7
function testDC_create002() {
    var isError = false;
    var dataChannelOptions = {
        id : 2
    };
    var localChannel2;
    // Create Peer Connection
    localPeerConnection = new RTCPeerConnection(iceServers);
    localChannel = localPeerConnection.createDataChannel("testDC_create002", dataChannelOptions);
    try {
        localChannel2 = localPeerConnection.createDataChannel("testDC_create002", dataChannelOptions);
    } catch(e) {
        isError = true;
        assert_equals(e.name, "ResourceInUse", "Wrong error was thrown: ");
    }
    if (!isError) {
        assert_unreached("Can create two DataChannels with same id: Channel1-ID: " + localChannel.id + " Channel2-ID: " + localChannel2.id);
        localChannel2.close();
    }
}

/**
- Peer A: creates a DataChannel  with id = 4
- Peer B: waits for the DataChannel 
- After established connection - Peer A: creates another DataChannel with id = 4  
- Throw an ResourceInUse exception
 */
// Origin: W3C - 5.1.2 Methods: 7
function testDC_create003(test) {
    test.step(function() {
        var dataChannelOptions = {
            id : 4
        };
        var localChannel2;
        var remoteChannel2;
        // Create Peer Connection
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        localChannel = localPeerConnection.createDataChannel("testDC_create003", dataChannelOptions);
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            try {
                localChannel2 = localPeerConnection.createDataChannel("testDC_create003", dataChannelOptions);
            } catch(e) {
                assert_equals(e.name, "ResourceInUse", "Wrong error was thrown: ");
                test.done();
            }
            remotePeerConnection.ondatachannel = test.step_func(function(e) {
                remoteChannel2 = e.channel;
                assert_true(false, "Can create 2 DataChannels with same ID: Channel1-ID: " + localChannel.id + "/" + remoteChannel.id + " Channel2-ID: " + localChannel2.id + "/" + remoteChannel2.id);
                localChannel2.close();
                remoteChannel2.close();
                test.done();
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer A: checks readyState, must initially be in the connecting state

 */
// Origin: W3C - 5.2 RTCDataChannel - DataChannel state created with createDataChannel() or dispatched via a RTCDataChannelEvent, MUST initially be in the connectiong state
function testDC_create004() {
    test(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_create004");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        assert_equals(localChannel.readyState, "connecting", "RTCDatachannelEvent initially wrong");
    }, "Call .createDataChannel() and check readyState - must initially be in the connecting state", {
        timeout : 5000
    });
}

/**
- Peer A: creates a DataChannel  
- Peer A: checks readyState - should be “connecting”
- Peer B: waits for the DataChannel 
- Peer A/B: checks readyState - should be “open”

 */
// Origin: W3C - 5.2 RTCDataChannel - DataChannel state created with createDataChannel() or dispatched via a RTCDataChannelEvent, MUST initially be in the connectiong state
// If underlying data transport is ready, the user agent must announce the RTCDataChannel as open
function testDC_create005(test) {
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);

        try {
            localChannel = localPeerConnection.createDataChannel("testDC_create005");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        assert_equals(localChannel.readyState, "connecting", "RTCDatachannelEvent 'connecting' initially wrong");
        createIceCandidatesAndOffer();
        localChannel.onopen = test.step_func(function() {
            assert_equals(localChannel.readyState, "open", "RTCDatachannelEvent 'open' initially wrong ");
        });
        // DataChannel created with event
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = function() {
                assert_equals(remoteChannel.readyState, "open", "RTCDatachannelEvent 'open' initially wrong ");
                test.done();
            };
        });
    });
}


/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel 
- Peer A: After established Connection – closes the PeerConnection
- Waiting 3 seconds
- Peer A/B: checks readyState

 */
// Origin: W3C - 5.2 RTCDataChannel
// If RTCDataChannel object's underlying data transport has been closed...
/* http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.7
 * 6.7 Closing a Channel
 * Closing of a Data Channel MUST be signaled by resetting the
 * corresponding outgoing streams [RFC6525].  This means that if one
 * side decides to close the channel, it resets the corresponding
 * outgoing stream.  When the peer sees that an incoming stream was
 * reset, it also resets its corresponding outgoing stream.
 */
function testDC_create006() {
    var waitTime = 3000;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_create006");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = function() {
                localPeerConnection.close();
                setTimeout(test.step_func(function() {
                    assert_equals(localChannel.readyState, "closed", "Wrong readyState - User Agent normaly must change state to closed (localChannel) ");
                    assert_equals(remoteChannel.readyState, "closed", "Wrong readyState - User Agent normaly must change state to closed (remoteChannel) ");
                    assert_equals(remoteChannel.readyState, localChannel.readyState, "Wrong readyState: ");
                    test.done();
                }), waitTime);
            };
        });
    });
}


/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel 
- Peer B: After established Connection – closes the PeerConnection
- Waiting 3 seconds
- Peer A/B: checks readyState

 */
// Origin: W3C - 5.2 RTCDataChannel
// If RTCDataChannel object's underlying data transport has been closed...
/* http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.7
 * 6.7 Closing a Channel
 * Closing of a Data Channel MUST be signaled by resetting the
 * corresponding outgoing streams [RFC6525].  This means that if one
 * side decides to close the channel, it resets the corresponding
 * outgoing stream.  When the peer sees that an incoming stream was
 * reset, it also resets its corresponding outgoing stream.
 */
function testDC_create007() {
    var waitTime = 3000;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_create007");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = function() {
                remotePeerConnection.close();
                setTimeout(test.step_func(function() {
                    assert_equals(localChannel.readyState, "closed", "Wrong readyState - User Agent normaly must change state to closed (localChannel) ");
                    assert_equals(remoteChannel.readyState, "closed", "Wrong readyState - User Agent normaly must change state to closed (remoteChannel) ");
                    assert_equals(remoteChannel.readyState, localChannel.readyState, "Wrong readyState: ");
                    test.done();
                }), waitTime);
            };
        });
    });
}


/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel 
- Peer A: After established Connection – closes the DataChannel
- Waiting 3 seconds
- Peer A/B: checks readyState

 */
// Origin: W3C - 5.2 RTCDataChannel
// If RTCDataChannel object's underlying data transport has been closed...
/* http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.7
 * 6.7 Closing a Channel
 * Closing of a Data Channel MUST be signaled by resetting the
 * corresponding outgoing streams [RFC6525].  This means that if one
 * side decides to close the channel, it resets the corresponding
 * outgoing stream.  When the peer sees that an incoming stream was
 * reset, it also resets its corresponding outgoing stream.
 */
function testDC_create008() {
    var waitTime = 3000;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_create006");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = function() {
                localChannel.close();
                setTimeout(test.step_func(function() {
                    assert_equals(localChannel.readyState, "closed", "Wrong readyState - User Agent normaly must change state to closed (localChannel) ");
                    assert_equals(remoteChannel.readyState, "closed", "Wrong readyState - User Agent normaly must change state to closed (remoteChannel) ");
                    assert_equals(remoteChannel.readyState, localChannel.readyState, "Wrong readyState: ");
                    test.done();
                }), waitTime);
            };
        });
    });
}


/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel 
- Peer B: After established Connection – closes the DataChannel
- Waiting 3 seconds
- Peer A/B: checks readyState

 */
// Origin: W3C - 5.2 RTCDataChannel
// If RTCDataChannel object's underlying data transport has been closed...
/* http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.7
 * 6.7 Closing a Channel
 * Closing of a Data Channel MUST be signaled by resetting the
 * corresponding outgoing streams [RFC6525].  This means that if one
 * side decides to close the channel, it resets the corresponding
 * outgoing stream.  When the peer sees that an incoming stream was
 * reset, it also resets its corresponding outgoing stream.
 */
function testDC_create009() {
    var waitTime = 3000;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_create007");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = function() {
                remoteChannel.close();
                setTimeout(test.step_func(function() {
                    assert_equals(localChannel.readyState, "closed", "Wrong readyState - User Agent normaly must change state to closed (localChannel) ");
                    assert_equals(remoteChannel.readyState, "closed", "Wrong readyState - User Agent normaly must change state to closed (remoteChannel) ");
                    assert_equals(remoteChannel.readyState, localChannel.readyState, "Wrong readyState: ");
                    test.done();
                }), waitTime);
            };
        });
    });
}
