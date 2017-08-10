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
 * Description:
 * The two PeerConnections are modeled on one host (browser)!
 * Peer A = localPeerConnection, localChannel
 * Peer B = remotePeerConnection, remoteChannel 
 * 
 */


var dctests_label = {
    "label001": {
        "description": "Call .createDataChannel() without parameters - should throw an error",
        "timeout": 5000,
        "sync": true,
        "references": [
            1,
            3
        ],
        "test_function": testDC_label001
    },
    "label002": {
        "parameters": {
            "label": "test-label"
        },
        get description() {
            return "Create a DataChannel with label \"" + this.parameters.label + "\" - check label on both peers"; 
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel with a label.</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B: checks the label.</li>\
        </ol>",
        "references": [
            1,
            3
        ],
        "timeout": 5000,
        "sync": false,
        "test_function": testDC_label002
    },
    "label003": {
        "parameters": {
            "label": "test-label漢字"
        },
        get description() {
            return "Create a DataChannel with label \"" + this.parameters.label + "\" - check the label on both peers";
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel with special characters (UTF-8) in the label.</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B: checks the label.</li>\
        </ol>",
        "references": [
            1,
            3
        ],
        "timeout": 5000,
        "sync": false,
        "test_function": testDC_label003
    },
    "label004": {
        "parameters": {
            "datasize": 15
        },
        get description() {
            return "Set up a DataChannel with a label of length 2^" +  this.parameters.datasize + " byte - check the label on both peers";
        },
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel with a label of 32 KB length.</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B: checks the label.</li>\
        </ol>",
        "references": [1, 3],
        "timeout": 5000,
        "sync": false,
        "test_function": testDC_label004
    },
    "label005": {
        "description": "Set up a DataChannel with a label of length 65535 Byte - check the label on both peers (should be the maximum length",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel with a 65535 Byte (64 KB - 1 Byte) label length.</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B: checks the label.</li>\
        </ol>",
        "references": [1, 3, 7],
        "timeout": 5000,
        "sync": false,
        "test_function": testDC_label005
    },
    "label006": {
        "description": "Create a DataChannel with a label of length 65536 Byte label length - check if an error is thrown",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel with label of 64 KB length.</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B: checks the label.</li>\
        </ol>",
        "references": [1, 3, 7],
        "timeout": 5000,
        "sync": false,
        "test_function": testDC_label006
    },
    "label007": {
        "description": "Set up a DataChannel with an empty label string - check label on both peers",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel with an empty label string \“\"</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B: checks the label.</li>\
        </ol>",
        "references": [
            1,
            3
        ],
        "timeout": 5000,
        "sync": false,
        "test_function": testDC_label007
    },
    "label008": {
        "parameters": {
            "maxChannelCount": 8
        },
        get description() {
            return "Create multiple DataChannels with the same label -  try " + this.parameters.maxChannelCount + " DataChannels with the same label";
        },
        "scenario": "The procedure runs 8 times with the same label.\
        <ol> \
            <li>Peer A: creates a DataChannel with specific label.</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B: checks the label.</li>\
        </ol>",
        "references": [
            1,
            3
        ],
        "timeout": 10000,
        "sync": false,
        "test_function": testDC_label008
    },
    "label009": {
        "parameters": {
            "maxChannelCount": 16
        },
        get description() {
            return "Create multiple DataChannels with the same label -  try " + this.parameters.maxChannelCount + " DataChannels with the same label";
        },
        "scenario": "The procedure runs 16 times with the same label.\
        <ol> \
            <li>Peer A: creates a DataChannel with specific label.</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B: checks the label.</li>\
        </ol>",
        "references": [
            1,
            3
        ],
        "timeout": 20000,
        "sync": false,
        "test_function": testDC_label009
    },
    "label010": {
        "description": "Create a DataChannel with label = NULL (Object) - check the label on both peers - should be the empty string",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel with label NULL (Object).</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B: checks the label – should be empty string \“\”.</li>\
        </ol>",
        "references": [
            1,
            3
        ],
        "timeout": 5000,
        "sync": false,
        "test_function": testDC_label010
    },
    "label011": {
        "description": "Create a DataChannel with a label of length 65535 (3x21845) Byte due special characters - check the label on both peers (should be maximum length)",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel with 65535 Byte label length.</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B: checks the label.</li>\
        </ol>",
        "references": [
            1,
            3,
            7
        ],
        "timeout": 5000,
        "sync": false,
        "test_function": testDC_label011
    },
    "label012": {
        "description": "Create a DataChannel with a label of length 65538 (3x21846) Byte due special characters - check the label on both peers (should be maximum length)",
        "scenario": "<ol> \
            <li>Peer A: creates a DataChannel with 65538 Byte label length.</li>\
            <li>Peer B: waits for the DataChannel</li>\
            <li>Peer A/B: checks the label.</li>\
        </ol>",
        "references": [
            1,
            3,
            7
        ],
        "timeout": 5000,
        "sync": false,
        "test_function": testDC_label012
    }
};

// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
// FIXME: W3C API: No information about which error should throw (API says parameter label is not optional)
/**
 - Peer A: creates a DataChannel without label parameter 
 */
function testDC_label001() {
    localPeerConnection = new RTCPeerConnection(iceServers);
    assert_throws(null, function() {
        localChannel = localPeerConnection.createDataChannel();
    }, "No error was thrown ");
}

/**
- Peer A: creates a DataChannel with label = “test-label”
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label
 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
function testDC_label002(test, parameters) {
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel(parameters.label);
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                assert_equals(localChannel.label, parameters.label, "Wrong label ");
                assert_equals(remoteChannel.label, localChannel.label, "Wrong label ");
                test.done();
            });
        });
    });
}

/**
- Peer A: creates a DataChannel with special characters (UTF-8) in the label = “test-label漢字“
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label
 */
// DataChannel Label Test - with special characters
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
function testDC_label003(test, parameters) {
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel(parameters.label);
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                assert_equals(localChannel.label, parameters.label, "Wrong label ");
                assert_equals(remoteChannel.label, localChannel.label, "Wrong label ");
                test.done();
            });
        });
    });
}

/**
- Peer A: creates a DataChannel with a label of 32 KB length
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label

 */
// Label set test with very long label
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
function testDC_label004(test, parameters) {
    var label = generateData(parameters.datasize);
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel(label);
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                assert_equals(localChannel.label, label, "Wrong label ");
                assert_equals(remoteChannel.label, localChannel.label, "Wrong label ");
                assert_equals(remoteChannel.label.length, localChannel.label.length, "Wrong label ");
                test.done();
            });
        });
    });
}


/**
- Peer A: creates a DataChannel with a 65535 Byte (64 KB - 1 Byte) label length
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label

 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
// Origin: http://tools.ietf.org/html/draft-ietf-rtcweb-data-protocol-07#section-5.1  -   DC Open Message: Label Length 2^16
function testDC_label005(test) {
    var label = generateData(16);
    label = label.substring(0, (label.length - 1))
    test.step(function() {
        assert_equals(label.length, 65535, "Wrong label length ");
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel(label);
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                assert_equals(localChannel.label, label, "Wrong label ");
                assert_equals(remoteChannel.label, localChannel.label, "Wrong label ");
                assert_equals(remoteChannel.label.length, localChannel.label.length, "Wrong label ");
                test.done();
            });
        });
    });
}




/**
- Peer A: creates a DataChannel with label of 64 KB length
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label

 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
// Origin: http://tools.ietf.org/html/draft-ietf-rtcweb-data-protocol-07#section-5.1  -   DC Open Message: Label Length 2^16
// FIXME @W3C what shoul the user agent do, throw an error...
function testDC_label006(test) {
    var label = generateData(16);
    test.step(function() {
        assert_equals(label.length, 65536, "Wrong label length ");
        localPeerConnection = new RTCPeerConnection(iceServers);

        assert_throws(null, function(){
                localChannel = localPeerConnection.createDataChannel(label);
        }, " Exception for exceeding label length");
    });
}


/**
- Peer A: creates a DataChannel with an empty label string “”
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label

 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
function testDC_label007(test) {
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
            test.done();
        }
        createIceCandidatesAndOffer();

        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;

            remoteChannel.onopen = test.step_func(function() {
                assert_equals(localChannel.label, "");
                assert_equals(remoteChannel.label, localChannel.label);
                test.done();
            });
        });
    });
}

/**
- Peer A: creates a DataChannel with specific label
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label
- The procedure runs 8 times with the same label

 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
function testDC_label008(test, parameters) {
    var channelCount = 0;
    var label = "same label";
    var localChannel = new Array(), remoteChannel = new Array();
    var errorMessage = "", isError = false;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        function tryCreateChannel() {
            try {
                localChannel[channelCount] = localPeerConnection.createDataChannel(label);

            } catch(e) {
                isError = true;
                errorMessage = e.name + ": " + e.message;
            }
            tryConnection();
        }

        function tryConnection() {
            if (isError) {
                assert_unreached("An error was thrown " + errorMessage + " creating the " + channelCount + " Channel");
                test.done();
            } else {
                test.step(function() {

                    remotePeerConnection.ondatachannel = function(e) {
                        remoteChannel[channelCount] = e.channel;
                        remoteChannel[channelCount].onopen = test.step_func(function() {
                            assert_equals(localChannel[channelCount].label, label);
                            assert_equals(remoteChannel[channelCount].label, localChannel[channelCount].label);
                            channelCount++;
                            if (channelCount == parameters.maxChannelCount) {
                                for(var i = 0; i < parameters.maxChannelCount; i++){
                                    localChannel[i].close();
                                    remoteChannel[i].close();
                                }
                                console.log(localChannel);
                                test.done();
                            } else {
                                test.step(function() {
                                    tryCreateChannel();
                                });
                            }
                        });
                    };
                });
            }
        }

        tryCreateChannel();
        createIceCandidatesAndOffer();
    });
}

/**
- Peer A: creates a DataChannel with specific label
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label
- The procedure runs 16 times with the same label

 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
// FIXME Firefox Crashed if more than 16 Channels are created
function testDC_label009(test, parameters) {
    var channelCount = 0;
    var label = "same label";
    var localChannel = new Array(), remoteChannel = new Array();
    var errorMessage = "", isError = false;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        function tryCreateChannel() {
            try {
                localChannel[channelCount] = localPeerConnection.createDataChannel(label);
            } catch(e) {
                isError = true;
                errorMessage = e.name + ": " + e.message;
            }
            tryConnection();
        }

        function tryConnection() {
            if (isError) {
                assert_unreached("An error was thrown " + errorMessage + " creating the " + channelCount + " Channel");
                test.done();
            } else {
                test.step(function() {                  
                    remotePeerConnection.ondatachannel = function(e) {
                        remoteChannel[channelCount] = e.channel;
                        remoteChannel[channelCount].onopen = test.step_func(function() {
                            assert_equals(localChannel[channelCount].label, label);
                            assert_equals(remoteChannel[channelCount].label, localChannel[channelCount].label);
                            channelCount++;
                            if (channelCount == parameters.maxChannelCount) {
                                for(var i = 0; i < parameters.maxChannelCount; i++){
                                    localChannel[i].close();
                                    remoteChannel[i].close();
                                }
                                console.log(localChannel);
                                test.done();
                            } else {
                                test.step(function() {
                                    tryCreateChannel();
                                });
                            }
                        });
                    };
                });
            }
        }

        tryCreateChannel();
        createIceCandidatesAndOffer();
    });
}

/**
- Peer A: creates a DataChannel with label NULL (Object)
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label – should be empty string “”

 */
// Origin: W3C -  5.1 RTCPeerConnection Interface Extensions - [TreatNullAs=EmptyString] DOMString label, 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
function testDC_label010(test) {
    var label = null;
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel(label);
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                assert_equals(localChannel.label, "", "Wrong label ");
                assert_equals(remoteChannel.label, localChannel.label, "Wrong label ");
                test.done();
            });
        });
    });
}

/**
- Peer A: creates a DataChannel with 65535 Byte label length
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label

 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
// Origin: http://tools.ietf.org/html/draft-ietf-rtcweb-data-protocol-07#section-5.1  -   DC Open Message: Label Length 2^16
function testDC_label011(test) {
    var charCount = 21845;
    var label = generateLinearDataChar("€",charCount);
    test.step(function() {
        assert_equals(label.length, charCount, "Wrong label length ");
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel(label);
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {

                assert_equals(localChannel.label, label, "Wrong label ");
                assert_equals(remoteChannel.label, localChannel.label, "Wrong label ");
                assert_equals(remoteChannel.label.length, localChannel.label.length, "Wrong label ");
                test.done();
            });
        });
    });
}

/**
- Peer A: creates a DataChannel with 65538 Byte label length
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label

 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
// Origin: http://tools.ietf.org/html/draft-ietf-rtcweb-data-protocol-07#section-5.1  -   DC Open Message: Label Length 2^16
function testDC_label012(test) {
    var charCount = 21846;
    var label = generateLinearDataChar("€",charCount);
    test.step(function() {
        assert_equals(label.length, charCount, "Wrong label length ");
        localPeerConnection = new RTCPeerConnection(iceServers);
        assert_throws(null, function(){
                localChannel = localPeerConnection.createDataChannel(label);
        }, " Exception for exceeding label length");
                test.done();
    });
}

