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
 * The two PeerConnections are modeled on one peer (Browser)!
 * Peer A = localPeerConnection, localChannel
 * Peer B = remotePeerConnection, remoteChannel 
 * 
 */


// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
// FIXME: W3C API: No information about which error should throw (API says parameter label is not optional)
function testDC_label001() {
    test(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        assert_throws(null, function() {
            localChannel = localPeerConnection.createDataChannel();
        }, "No error was thrown ");
    }, "testDC_label001: Call .createDataChannel() without parameters - should throw an error", {timeout: 5000});
}

/**
- Peer A: creates a DataChannel with label = “test-label”
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label
 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
function testDC_label002() {
    var label = "test-label";
    var test = async_test("testDC_label002: Set up a DataChannel with label \"" + label + "\" - check label on both peers", {timeout: 5000});
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
                test.done();
            });
        });
    });
}

/**
- Peer A: creates a DataChannel with special character label = “test-label漢字“
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label
 */
// DataChannel Label Test - with special characters
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
function testDC_label003() {
    var label = "test-label漢字";
    var test = async_test("testDC_label003: Set up a DataChannel with label \"" + label + "\" - check the label on both peers", {timeout: 5000});
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
                test.done();
            });
        });
    });
}


/**
- Peer A: creates a DataChannel with 32 KB label length
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label

 */
// Label set test with very long label
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
function testDC_label004() {
    var label = generateData(15);
    var test = async_test("testDC_label004: Set up a DataChannel with a label of length " +  label.length / 1024 + " KB - check the label on both peers", {timeout: 5000});
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
- Peer A: creates a DataChannel with 64 KB less one Byte label  length
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label

 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
// Origin: http://tools.ietf.org/html/draft-ietf-rtcweb-data-protocol-07#section-5.1  -   DC Open Message: Label Length 2^16
function testDC_label005() {
    var label = generateData(16);
    label = label.substring(0, (label.length - 1));
    var test = async_test("testDC_label005: Set up a DataChannel with a label of length 65535 Byte - check the label on both peers (should be maximum length)", {timeout: 5000});
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
- Peer A: creates a DataChannel with label 64 KB length
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label

 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
// Origin: http://tools.ietf.org/html/draft-ietf-rtcweb-data-protocol-07#section-5.1  -   DC Open Message: Label Length 2^16
// FIXME @W3C what shoul the user agent do, throw an error...
function testDC_label006() {
    var label = generateData(16);
    var test = async_test("testDC_label006: Create a DataChannel with a label of length 65536 Byte label length - check if an error is thrown", {timeout: 5000});
    test.step(function() {
    	assert_equals(label.length, 65536, "Wrong label length ");
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        
        assert_throws(null, function(){
        	localChannel = localPeerConnection.createDataChannel(label);
        }, "no error was thrown ");
    });
}


/**
- Peer A: creates a DataChannel with empty label string “”
- Peer B: waits for the DataChannel 
- Peer A/B: checks the label

 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
function testDC_label007() {
    var test = async_test("testDC_label007: Set up a DataChannel with an empty label string - check label on both peers", {timeout: 5000});
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
function testDC_label008() {
    var maxChannelCount = 8;
    var channelCount = 0;
    var label = "same label";
    var localChannel = new Array(), remoteChannel = new Array();
    var errorMessage = "", isError = false;
    var test = async_test("testDC_label008: Set up multiple DataChannels with the same label -  try " + maxChannelCount + " DataChannels with the same label", {timeout: 10000});
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
                            if (channelCount == maxChannelCount) {
                                for(var i = 0; i < maxChannelCount; i++){
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
- The procedure runs 9 times with the same label

 */
// Origin: W3C - 5.1.2 Methods: 3 and 5.2.1 Attributes (label)
// FIXME Firefox Crashed if more than 8 Channels are created
function testDC_label009() {
    var maxChannelCount = 100;
    var channelCount = 0;
    var label = "same label";
    var localChannel = new Array(), remoteChannel = new Array();
    var errorMessage = "", isError = false;
    var test = async_test("testDC_label009: Set up multiple DataChannels with the same label -  try " + maxChannelCount + " DataChannels with the same label", {timeout: 20000});
    test.step(function() {
        //if(mozSafeMode)
            //assert_unreached("Mozilla Firefox Safe Mode is activated - This test usually leads to crash ");
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
                            if (channelCount == maxChannelCount) {
                                for(var i = 0; i < maxChannelCount; i++){
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
function testDC_label010() {
    var label = null;
    var test = async_test("testDC_label010: Set up a DataChannel with label NULL (Object) - check the label on both peers - should be the empty string", {timeout: 5000});
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

