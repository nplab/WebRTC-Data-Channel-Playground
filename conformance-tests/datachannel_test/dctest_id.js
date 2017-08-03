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

var dctests_id = {
    "id001": {
        "description": "Set up a DataChannel and check the id",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B: checks id (Is id a number and equal).</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 5000,
        "sync": false,
        "test_function": testDC_id001
    },
    "id002": {
        "parameters": {
            "id": 1022
        },
        get description() {
            return "Call .createDataChannel() with the specific id = " + this.parameters.id;
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with specific id = 1022.</li>\
            <li>Peer A: checks id.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 5000,
        "sync": true,
        "test_function": testDC_id002
    },
    "id003": {
        "parameters": {
            "id": 1023
        },
        get description() {
            return "Call .createDataChannel() with the specific id = " + this.parameters.id;
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with specific id = 1023.</li>\
            <li>Peer A: checks id</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 5000,
        "sync": true,
        "test_function": testDC_id003
    },
    "id004": {
        "parameters": {
            "id": 1024
        },
        get description() {
            return "Call .createDataChannel() with the specific id = " + this.parameters.id;
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with specific id = 1024.</li>\
            <li>Peer A: checks id.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6",
            "https://code.google.com/p/webrtc/issues/detail?id=3150"
        ],
        "timeout": 5000,
        "sync": true,
        "test_function": testDC_id004
    },
    "id005": {
        "parameters": {
            "id": 65535
        },
        get description() {
            return "Call .createDataChannel() with the specific id = " + this.parameters.id;
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with specific id = 65535 (maximum id value).</li>\
            <li>Peer A: checks id.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 5000,
        "sync": true,
        "test_function": testDC_id005
    },
    "id006": {
        "parameters": {
            "id": 100000
        },
        get description() {
            return "Call .createDataChannel() with the specific id = " + this.parameters.id + " - exceeds maximum value of id (2^16) - the user agent should set another id";
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with specific id = 100000 (exceeds maximum id value).</li>\
            <li>Peer A: checks id – must be smaller than 65536.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 5000,
        "sync": true,
        "test_function": testDC_id006
    },
    "id007": {
        "parameters": {
            "id": 1022
        },
        get description() {
            return "Set up a DataChannel with the specific id = " + this.parameters.id;
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with specific id = 1022.</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B:  checks id.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_id007
    },
    "id008": {
        "parameters": {
            "id": 1023
        },
        get description() {
            return "Set up a DataChannel with the specific id = " + this.parameters.id;
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with specific id = 1023.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A/B:  checks id.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_id008
    },
    "id009": {
        "parameters": {
            "id": 1024
        },
        get description() {
            return "Set up a DataChannel with the specific id = " + this.parameters.id;
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with specific id = 1024.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A/B:  checks id.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_id009
    },
    "id010": {
        "parameters": {
            "id": 65534
        },
        get description() {
            return "Set up a DataChannel with the specific id = " + this.parameters.id + " (maximum stream ID)";
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with specific id = 65534 (stream ID).</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A/B:  checks id.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_id010
    },
    "id011": {
        "parameters": {
            "max": 70000
        },
        get description() {
            return "Call .createDataChannel() " + (this.parameters.max) + " times on a PeerConnection";
        },
        "scenario": "<ol> \
            <li>Peer A: creates 70000 DataChannel  on a PeerConnection.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 20000,
        "sync": true,
        "test_function": testDC_id011
    },
    "id012": {
        "parameters": {
            "max": 511
        },
        get description() {
            return "Set up " + (this.parameters.max) + " DataChannels - with user agent (Browser) generated IDs";
        },
        "scenario": "The procedure runs 511 times\
        <ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A/B: waits until the DataChannel is open.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 20000,
        "sync": false,
        "test_function": testDC_id012
    },
    "id013": {
        "parameters": {
            "max": 512
        },
        get description() {
            return "Set up " + (this.parameters.max) + " DataChannels - with user agent (Browser) generated IDs";
        },
        "scenario": "The procedure runs 512 times\
        <ol> \
            <li>Peer A: creates a DataChannel.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A/B: waits until the DataChannel is open.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 20000,
        "sync": false,
        "test_function": testDC_id013
    },
    "id014": {
        "parameters": {
            "max": 65535
        },
        get description() {
            return "Call .createDataChannel() " + this.parameters.max + " times with specific id on a PeerConnection – starts with id 0 then increase by one";
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with specific id = 0.</li>\
            <li>Repeats 65535 times and increase the id by one.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 20000,
        "sync": true,
        "test_function": testDC_id014
    },
    "id015": {
        "parameters": {
            "max": 1022
        },
        get description() {
            return "Set up " + (1+this.parameters.max) + " DataChannels - with specific id - starts with id 0 then increase by one";
        },
        "scenario": "The procedure runs 1023 times, the id starts with 0 then increased by one and ends with id 1022\
        <ol> \
            <li>Peer A: creates a DataChannel  with specific id = 0.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A/B: waits until the DataChannel is open.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 20000,
        "sync": false,
        "test_function": testDC_id015
    },
    "id016": {
        "parameters": {
            "max": 1023
        },
        get description() {
            return "Set up " + (1+this.parameters.max) + " DataChannels - with specific id - starts with id 0 then increase by one";
        },
        "scenario": "The procedure runs 1024 times, the id starts with 0 then increased by one and ends with id 1023\
        <ol> \
            <li>Peer A: creates a DataChannel  with specific id = 0.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A/B: waits until the DataChannel is open.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
        ],
        "timeout": 20000,
        "sync": false,
        "test_function": testDC_id016
    },
    "id017": {
        "description": "Set up a DataChannel with a specific id - close the DataChannel - set up DataChannel with the same id (reuse id)",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel  with specific id .</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A/B:  closes the DataChannel.</li>\
            <li>Wait 2 seconds.</li>\
            <li>Peer A: creates a new DataChannel with same id.</li>\
            <li>Peer B: waits for the DataChannel.</li>\
            <li>Peer A/B: checks connection.</li>\
        </ol>",
        "references": [
            "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6",
            "http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.7"
        ],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_id017
    }
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel 
- Peer A/B: checks id (Is id a number and equal)

 */
// Origin: W3C - 5.2.1 Attributes
function testDC_id001(test) {
    localPeerConnection = new RTCPeerConnection(iceServers);
    remotePeerConnection = new RTCPeerConnection(iceServers);
    try {
        localChannel = localPeerConnection.createDataChannel("testDC_id001");
    } catch(e) {
        assert_unreached("An error was thrown " + e.name + ": " + e.message);
    }
    createIceCandidatesAndOffer();
    remotePeerConnection.ondatachannel = test.step_func(function(e) {
        remoteChannel = e.channel;
        assert_true( typeof (localChannel.id) === "number");
        assert_equals(localChannel.id, remoteChannel.id, "id not set correct: ");
        test.done();
    });
}

/**
- Peer A: creates a DataChannel  with specific id = 1022
- Peer A: checks id

 */
// Origin: W3C - 5.2.1 Attributes
function testDC_id002(parameters) {
    var dataChannelOptions = {
        id : parameters.id
    };
    localPeerConnection = new RTCPeerConnection(iceServers);
    try {
        localChannel = localPeerConnection.createDataChannel("testDC_id002", dataChannelOptions);
    } catch(e) {
        assert_unreached("An error was thrown " + e.name + ": " + e.message);
    }
    assert_equals(localChannel.id, dataChannelOptions.id, "Wrong id ");
}

/**
- Peer A: creates a DataChannel  with specific id = 1023
- Peer A: checks id

 */
// Origin: W3C - 5.2.1 Attributes
function testDC_id003(parameters) {
    var dataChannelOptions = {
        id : parameters.id
    };
    localPeerConnection = new RTCPeerConnection(iceServers);
    try {
        localChannel = localPeerConnection.createDataChannel("testDC_id003", dataChannelOptions);
    } catch(e) {
        assert_unreached("An error was thrown " + e.name + ": " + e.message);
    }
    //alert(localChannel.id);
    assert_equals(localChannel.id, dataChannelOptions.id, "Wrong id ");
}

/**
- Peer A: creates a DataChannel  with specific id = 1024
- Peer A: checks id

 */
// Origin: W3C - 5.2.1 Attributes
// https://code.google.com/p/webrtc/issues/detail?id=3150
function testDC_id004(parameters) {
    var dataChannelOptions = {
        id : parameters.id
    };
    localPeerConnection = new RTCPeerConnection(iceServers);
    try {
        localChannel = localPeerConnection.createDataChannel("testDC_id004", dataChannelOptions);
    } catch(e) {
        assert_unreached("An error was thrown " + e.name + ": " + e.message);
    }
    assert_equals(localChannel.id, dataChannelOptions.id, "Wrong id ");
}

/**
- Peer A: creates a DataChannel  with specific id = 65535 (maximum id value)
- Peer A: checks id

 */
// Origin: W3C - 5.2.1 Attributes
function testDC_id005(parameters) {
    var dataChannelOptions = {
        id : parameters.id
    };
    localPeerConnection = new RTCPeerConnection(iceServers);
    try {
        localChannel = localPeerConnection.createDataChannel("testDC_id005", dataChannelOptions);
    } catch(e) {
        assert_unreached("An error was thrown " + e.name + ": " + e.message);
    }
    assert_equals(localChannel.id, dataChannelOptions.id, "Wrong id ");
}

/**
- Peer A: creates a DataChannel  with specific id = 100000 (exceeds maximum id value)
- Peer A: checks id – must be smaller than 65536

 */
// Origin: W3C - 5.2.1 Attributes
// FIXME: @ W3C what happens if id exceeds the maximum vaule
// INFO Firefox: If id exceeds the unsigned short value (0-65535): The new id = id % 2^16 
function testDC_id006(parameters) {
    var dataChannelOptions = {
        id : parameters.id
    };
    localPeerConnection = new RTCPeerConnection(iceServers);
    try {
        localChannel = localPeerConnection.createDataChannel("testDC_id006", dataChannelOptions);
    } catch(e) {
        assert_unreached("An error was thrown " + e.name + ": " + e.message);
    }
    assert_not_equals(localChannel.id, dataChannelOptions.id, "id exceeds maximum value of unsigned short: 2^16");
    assert_true((localChannel.id< ((2^16)-1)), "id exceeds maximum value of unsigned short: 2^16");
}


/**
- Peer A: creates a DataChannel  with specific id = 1022
- Peer B: waits for the DataChannel
- Peer A/B:  checks id

 */
// Origin: W3C - 5.2.1 Attributes
function testDC_id007(test, parameters) {
    var dataChannelOptions = {
        id : parameters.id
    };

    localPeerConnection = new RTCPeerConnection(iceServers);
    remotePeerConnection = new RTCPeerConnection(iceServers);
    try {
        localChannel = localPeerConnection.createDataChannel("testDC_id007", dataChannelOptions);
    } catch(e) {
        assert_unreached("An error was thrown " + e.name + ": " + e.message);
    }
    createIceCandidatesAndOffer();
    remotePeerConnection.ondatachannel = test.step_func(function(e) {
        remoteChannel = e.channel;
        assert_equals(localChannel.id, dataChannelOptions.id, "id not set correct: ");
        assert_equals(localChannel.id, remoteChannel.id, "id not set correct: ");
        test.done();
    });
}

/**
- Peer A: creates a DataChannel  with specific id = 1023
- Peer B: waits for the DataChannel
- Peer A/B:  checks id

 */
// Origin: W3C - 5.2.1 Attributes
// TODO: Chrome: 1023 firefox failed, create DataChannel works, but no connection can be established the other side gets no DataChannel (Stream)
function testDC_id008(test, parameters) {
    var dataChannelOptions = {
        id : parameters.id
    };

    var timeoutTime = setTimeout(test.step_func(function() {
        if (dataChannelOptions.id == localChannel.id) {
            assert_unreached("No associated datachannel was created with the id: " + dataChannelOptions.id);
        } else {
            assert_equals(localChannel.id, dataChannelOptions.id, "Created datachannel with wrong id: ");
        }
        test.done();
    }), 2000);
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_id008", dataChannelOptions);
        } catch(e) {
            clearTimeout(timeoutTime);
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }

        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            clearTimeout(timeoutTime);
            assert_equals(localChannel.id, dataChannelOptions.id, "id not set correct: ");
            assert_equals(localChannel.id, remoteChannel.id, "id not set correct: ");
            test.done();
        });

    });
}

/**
- Peer A: creates a DataChannel  with specific id = 1024
- Peer B: waits for the DataChannel
- Peer A/B:  checks id

 */
// Origin: W3C - 5.2.1 Attributes
// DataChannel: Attribute - id - unsigned short -> set and get test
// FIXME: Chrome failed: IF id exceeds the negotiated max stream count for the SCTP connection it throws an error ( 1024 by default)
function testDC_id009(test, parameters) {
    var dataChannelOptions = {
        id : parameters.id
    };

    var timeoutTime = setTimeout(test.step_func(function() {
        if (dataChannelOptions.id == localChannel.id) {
            assert_unreached("No associated datachannel was created with the id: " + dataChannelOptions.id);
        } else {
            assert_equals(localChannel.id, dataChannelOptions.id, "Created datachannel with wrong id: ");
        }
        testDC32_1.done();
    }), 2000);
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_id009", dataChannelOptions);
        } catch(e) {
            clearTimeout(timeoutTime);
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            clearTimeout(timeoutTime);
            assert_equals(localChannel.id, dataChannelOptions.id, "id not set correct: ");
            assert_equals(localChannel.id, remoteChannel.id, "id not set correct: ");
            test.done();
        });

    });
}


/**
- Peer A: creates a DataChannel  with specific id = 65534 (stream ID)
- Peer B: waits for the DataChannel
- Peer A/B:  checks id

 */
// Origin: W3C - 5.2.1 Attributes
// DataChannel: Attribute - id - unsigned short -> set and get test
// FIXME: 1023 firefox failed: IF id exceeds the negotiated max stream count for the SCTP connection it throws an error ( 1024 by default)
function testDC_id010(test, parameters) {
    var dataChannelOptions = {
        id : parameters.id
    };

    var timeoutTime = setTimeout(test.step_func(function() {
        if (dataChannelOptions.id == localChannel.id) {
            assert_unreached("No associated datachannel was created with the id: " + dataChannelOptions.id);
        } else {
            assert_equals(localChannel.id, dataChannelOptions.id, "No associated datachannel was created, the created datachannel has a wrong id: ");
        }
        test.done();
    }), 2000);
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_id010", dataChannelOptions);
        } catch(e) {
            clearTimeout(timeoutTime);
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            clearTimeout(timeoutTime);
            console.log(localChannel.id+"           "+remoteChannel.id);
            assert_equals(localChannel.id, dataChannelOptions.id, "id not set correct: ");
            assert_equals(localChannel.id, remoteChannel.id, "id not set correct: ");
            test.done();
        });
    });
}

/**
- Peer A: creates 70000 DataChannel  on a PeerConnection
 */
// Origin: W3C - 5.2.1 Attributes
function testDC_id011(parameters) {
    var max = parameters.max;
    var localChannels = new Array();
    localPeerConnection = new RTCPeerConnection(iceServers);
    var i;
    for ( i = 0; i < max; i++) {
        try {
            localChannels[i] = localPeerConnection.createDataChannel("testDC_id011_" + i);
            if (i % 1000 == 0)
                console.log("DC " + i + "  DC ID: " + localChannels[i].id);
        } catch(e) {
            assert_unreached(true, "Could only generate " + i + " DataChannels");
        }
    }
    for (i=0; i< max; i++){
       // localChannels[i].close();
    }
}


/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A/B: waits until the DataChannel is open
- The procedure runs 511 times 

 */
// Origin: W3C - 5.2.1 Attributes
// FIXME: Firefox crashed 
// The Last ID created is 1021
function testDC_id012(test, parameters) {
    var dcLocal = new Array();
    var dcRemote = new Array();
    var max = parameters.max;
    var i = 0;
    setTimeout(test.step_func(function() {
        assert_unreached("No connection established with the channel ID " + localChannel[i].id);
    }), 15000);
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        dcLocal[i] = localPeerConnection.createDataChannel("testDC_id012");
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            dcRemote[i] = e.channel; 
            if(i== (max-1))
                console.log(dcRemote[i].id + " Thats the id");
            i++;
            try {
                if (i < max) {                
                    dcLocal[i] = localPeerConnection.createDataChannel("testDC103_" + i);
                } else {
                    for (var j = 0; j < dcLocal.length; j++) {
                      //  console.log("id: " + dcLocal[j].id);
                        dcLocal[j].close();
                        dcRemote[j].close();
                    }
                    test.done();
                }
            } catch(e) {
                assert_unreached("Can only create " + i + " associated DataChannels with last id " + localChannel.id + " Error" + errorMessage);
            }
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A/B: waits until the DataChannel is open
- The procedure runs 512 times

 */
// Origin: W3C - 5.2.1 Attributes
// FIXME: Firefox crashed 
// The last ID created is 1023 - no connection established in Chrome 
function testDC_id013(test, parameters) {
    var dcLocal = new Array(), dcRemote = new Array();
    var max = parameters;
    var i = 0;
    setTimeout(test.step_func(function() {
        assert_unreached("No connection established with the channel ID " + dcLocal[i].id);
    }), 15000);
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        dcLocal[i] = localPeerConnection.createDataChannel("testDC_id013");
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            dcRemote[i] = e.channel; 
            i++;
            try {
                if (i < max) {                
                    dcLocal[i] = localPeerConnection.createDataChannel("testDC103_" + i);
                } else {
                    for (var j = 0; j < dcLocal.length; j++) {
                        
                        dcLocal[j].close();
                        dcRemote[j].close();
                    }
                    test.done();
                }
            } catch(e) {
                assert_unreached("Can only create " + i + " associated DataChannels with last id " + localChannel.id + " Error" + errorMessage);
            }
        });
    });
}


/**
- Peer A: creates a DataChannel  with specific id = 0
- Repeats 65535 times and increase the id by one

 */
// Origin: W3C - 5.2.1 Attributes
// FIXME: No Information from W3C whats the maximum ID
// FIXME: Firefox crashed 
function testDC_id014(parameters) {
    var max = parameters.max;
    localPeerConnection = new RTCPeerConnection(iceServers);
    var i;
    for ( i = 0; i < max; i++) {
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_id014" + i, {
                id : i
            });
        } catch(e) {
            assert_unreached("Could only generate " + i + " DataChannels! " +e.name+ ": "+ e.message);
        }
    }
}


/**
- Peer A: creates a DataChannel  with specific id = 0
- Peer B: waits for the DataChannel
- Peer A/B: waits until the DataChannel is open
- The procedure runs 1023 times, the id starts with 0 then increased by one and ends with id 1022

 */
// Origin: W3C - 5.2.1 Attributes
// FIXME: Firefox crashed by creating more than 16 datachannels
function testDC_id015(test, parameters) {
    var dcLocal = new Array(), dcRemote = new Array();
    var max = parameters.max;
    var i = 0;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        dcLocal[i] = localPeerConnection.createDataChannel("testDC_id015", {
            id : i
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            dcRemote[i] = e.channel;
            try {
                if (i < max) {
                    //console.log("Channels: " + dcLocal[i].id + "  " + dcRemote[i].id);
                    i++;
                    dcLocal[i] = localPeerConnection.createDataChannel("testDC_id015_" + i, {
                        id : i
                    });
                } else {
                    for (var j; j < dcLocal.length; j++) {
                        dcLocal[j].close();
                        dcRemote[j].close();
                    }
                    test.done();
                }
            } catch(e) {
                assert_unreached("Can only create " + i + " associated DataChannels with last id " + dcLocal.id + " Error: " + e);
            }
        });
    });
}


/**
- Peer A: creates a DataChannel  with specific id = 0
- Peer B: waits for the DataChannel
- Peer A/B: waits until the DataChannel is open
- The procedure runs 1024 times, the id starts with 0 then increased by one and ends with id 1023

 */

// Origin: W3C - 5.2.1 Attributes
// FIXME: Firefox crashed by creating more than 16 datachannels
function testDC_id016(test, parameters) {
    var dcLocal = new Array(), dcRemote = new Array();
    var max = parameters.max;
    var i = 0;
    setTimeout(test.step_func(function() {
        assert_unreached("No connection established with the channel ID " + dcLocal[i].id);
    }), 15000);
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        dcLocal[i] = localPeerConnection.createDataChannel("testDC_id016", {
            id : i
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            dcRemote[i] = e.channel;
            try {
                if (i < max) {
                    //console.log("Channels: " + dcLocal[i].id + "  " + dcRemote[i].id);
                    i++;
                    dcLocal[i] = localPeerConnection.createDataChannel("testDC_id016_" + i, {
                        id : i
                    });
                } else {
                    for (var j=0; j < dcLocal.length; j++) {
                        dcLocal[j].close();
                        dcRemote[j].close();
                    }
                    test.done();
                }
            } catch(e) {
                assert_unreached("Can only create " + i + " associated DataChannels with last id " + dcLocal.id + " Error: " + e);
            }
        });
    });
}



/**
- Peer A: creates a DataChannel  with specific id 
- Peer B: waits for the DataChannel
- Peer A/B:  closes the DataChannel
- Wait 2 seconds
- Peer A: creates a new DataChannel with same id
- Peer B: waits for the DataChannel
- Peer A/B: checks connection

 */
// Origin: W3C - 5.2.1 Attributes
// http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.7
// Streams are available for reuse after a reset has been performed
function testDC_id017(test) {
    var dataChannelOptions = {
        id : 4
    };
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        localChannel = localPeerConnection.createDataChannel("testDC_id017", dataChannelOptions);
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = function() {
                localChannel.close();
                remoteChannel.close();
                setTimeout(test.step_func(function() {
                    try {
                        localChannel = localPeerConnection.createDataChannel("testDC_id017", dataChannelOptions);
                        test.done();
                    } catch(e) {
                        assert_unreached(e.name + ": " + e.message);
                    }
                }), 2000);
            };
        };
    });
}


// Origin: W3C - 5.2.1 Attributes
function test_DC_id018() {
    var dataChannelOptions = {
        id : 5
    };
    var test = async_test("Set up dataChannel with an used ID by the other side", {timeout: 10000});
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        localChannel = localPeerConnection.createDataChannel("testDC_id018", dataChannelOptions);
        var remoteChannel2= remotePeerConnection.createDataChannel("remote " , dataChannelOptions);
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            console.log("Got DataChannel with ID " + remoteChannel.id + " And the Label is "+ remoteChannellabel);
            remoteChannel.onopen = function() {
                
            };
        };
    });
}
