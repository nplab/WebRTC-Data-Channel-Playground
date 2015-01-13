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
- Peer A: creates a DataChannel  
- Peer A: tries to send a message
- Throw InvalidStateError

 */
// Origin: W3C - 5.2.3 - send() - send data while readystate = connecting, throw an InvalidStateError
// If channel's readyState attribute is connecting, throw an InvalidStateError exception and abort these steps
function testDC_send001() {
    test(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        localChannel = localPeerConnection.createDataChannel("testDC1_2");
        assert_throws("InvalidStateError", function() {
            localChannel.send("Throw an InvalidState Error");
        });
    }, "Call .createDataChannel() - send data while readystate = connecting -  throw an InvalidStateError", {
        timeout : 5000
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sends 16KB data packets 100 times
- Peer B: checks received data

 */
// Origin: W3C - 5.2.3
function testDC_send002() {
    var expected = generateData(14);
    var repeats = 100;
    // Look whether data is received partial
    var pM = 0;
    var test = async_test("Set up a DataChannel - send " + repeats + "messages of size " + expected.length / 1024 + " KB", {
        timeout : 10000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send002");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        localChannel.onopen = test.step_func(function() {
            try {
                for (var i = 0; i < repeats; i++) {
                    localChannel.send(expected);
                }
            } catch(e) {
                assert_unreached("Send error: " + e.name + ": " + e.message);
            }
        });
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            var messageCount = 0;
            remoteChannel = e.channel;
            remoteChannel.onmessage = test.step_func(function(e) {
                if ((e.data).length + pM == expected.length) {
                    messageCount++;
                } else {
                    pM = e.data.length;
                }
                if (messageCount == repeats) {
                    assert_equals(e.data, expected, "Received data not correct ");
                    test.done();
                }
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer B: closes the PeerConnection
- Peer A: sends data, throw an Error exception

 */
// Origin: W3C - 5.2.3 , when RTCDatachannel objects underlying data transport has been closed... NetworkError
// When a RTCDataChannel object's underlying data transport has been closed, the user agent must queue a task to run the following steps
function testDC_send003() {
    // 8 KB
    var test = async_test("Set up a DataChannel - close remote RTCPeerConnection - send data - throw an Error", {
        timeout : 10000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send003");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                remotePeerConnection.close();
                setTimeout(test.step_func(function() {
                    assert_throws("NetworkError", function() {
                        localChannel.send("Throw an NetworkError");
                    });
                    test.done();
                }), 1500);
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer A: checks binaryType (initialized to string “blob”)

 */
// Origin: W3C - 5.2.1  Attributes
// DataChannel: Attribute - binaryType - DOMString -> oninit = blob
// BINARYTYPE INFO: Otherwise throw a Syntax Error Exception : http://www.w3.org/TR/websockets/
// If type indicates that the data is Text, then initialize event's data attribute to data.
// If type indicates that the data is Binary, and binaryType is set to "blob", then initialize event's data attribute to a new Blob object that represents data as its raw data. [FILEAPI]
// If type indicates that the data is Binary, and binaryType is set to "arraybuffer", then initialize event's data attribute to a new read-only ArrayBuffer object whose contents are data. [TYPEDARRAY]
function testDC_send004() {
    test(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send004");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        assert_equals(localChannel.binaryType, "blob", "Wrong init of binaryType: ");
    }, "Call .createDataChannel() and check the attribute binaryType - initialized to string \"blob\" ", {
        timeout : 5000
    });
}

/**
- Peer A: creates a DataChannel  
- Peer A: change binaryType to “arraybuffer”
- Peer A: checks binaryType 

 */
// Origin: W3C - 5.2.1  Attributes
// DataChannel: Attribute - binaryType - DOMString -> change to arraybuffer
function testDC_send005() {
    test(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send005");
            localChannel.binaryType = "arraybuffer";
        } catch(e) {

            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        assert_equals(localChannel.binaryType, "arraybuffer", "Wrong binaryType: ");
    }, "Call .createDataChannel() and change attribute the binaryType to \"arraybuffer\" ", {
        timeout : 5000
    });

}

/**
- Peer A: creates a DataChannel  
- Peer A: change binaryType to “blob”
- Peer A: checks binaryType

 */
// Origin: W3C - 5.2.1  Attributes
// DataChannel: Attribute - binaryType - DOMString -> change to arraybufferview
function testDC_send006() {
    test(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send006");
            localChannel.binaryType = "blob";
        } catch(e) {

            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        assert_equals(localChannel.binaryType, "blob", "Wrong binaryType: ");
    }, "Call .createDataChannel() and change the attribute binaryType to \"blob\"", {
        timeout : 5000
    });
}

/**
- Peer A: creates a DataChannel  
- Peer A: change binaryType to “arraybuffer”
- Peer A: checks binaryType
- Peer A: change binaryType to “blob”
- Peer A: checks binaryType

 */
// Origin: W3C - 5.2.1  Attributes
// DataChannel: Attribute - binaryType - DOMString -> change to domstring
function testDC_send007() {
    test(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send007");
            localChannel.binaryType = "arraybuffer";
        } catch(e) {

            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        assert_equals(localChannel.binaryType, "arraybuffer", "Wrong binaryType: ");
        try {
            localChannel.binaryType = "blob";
        } catch(e) {

            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        assert_equals(localChannel.binaryType, "blob", "Wrong binaryType: ");
    }, "Call .createDataChannel() and change the attribute binaryType to \"arraybuffer\" then to \"blob\"", {
        timeout : 5000
    });
}

/**
- Peer A: creates a DataChannel  
- Peer A: change binaryType to “unknown”
- Throw a SyntaxError

 */
// Origin: W3C - 5.2.1  Attributes (W3C - Websocket API) -When a WebSocket object is created, its binaryType IDL
// attribute must be set to the string "blob". On getting, it must return the last value it was set to.
// On setting, if the new value is either the string "blob" or the string "arraybuffer", then set the IDL attribute to this new value. Otherwise, throw a SyntaxError exception.
function testDC_send008() {
    test(function() {
        var isError = false;
        localPeerConnection = new RTCPeerConnection(iceServers);
        localChannel = localPeerConnection.createDataChannel("testDC_send008");
        assert_throws("SyntaxError", function() {
            localChannel.binaryType = "unknown";
        });
    }, "Call .createDataChannel() and change the attribute binaryType to \"unknown\" - throw a SyntaxError", {
        timeout : 5000
    });
}

/**
- Peer A: creates a DataChannel  
- Peer A: change binaryType to “” (empty String)
- Throw SyntaxError

 */
// Origin: W3C - 5.2.1  Attributes
// DataChannel: Attribute - binaryType - DOMString -> changeto blob (normal init)
function testDC_send009() {
    test(function() {
        var isError = false;
        localPeerConnection = new RTCPeerConnection(iceServers);
        localChannel = localPeerConnection.createDataChannel("testDC_send009");
        assert_throws("SyntaxError", function() {
            localChannel.binaryType = "";
        });
    }, "Call .createDataChannel() and change the attribute binaryType to empty string - Throw SyntaxError", {
        timeout : 5000
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A/B:  checks bufferedAmount value should be 0

 */
// Origin: W3C - 5.2.1  Attributes - bufferedAmount - unsigned long
function testDC_send010() {
    var test = async_test("Set up a DataChannel and check the bufferedAmount value - should be 0", {
        timeout : 5000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send010");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            assert_equals(localChannel.bufferedAmount, 0, "Can't get buffered Amount: ");
            assert_equals(remoteChannel.bufferedAmount, 0, "Can't get buffered Amount: ");
            test.done();
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sends data quick until bufferedAmount increases

 */
// Origin: W3C - 5.2.1  Attributes
function testDC_send011() {
    var data = generateData(14);
    //16 KB
    var test = async_test("Set up a DataChannel - check whether bufferedAmount increases (Send data until bufferedAmount increases) ", {
        timeout : 15000
    });
    test.step(function() {
        var bA = false;
        var i = 0;
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send011");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                // Send 1024 x 16 KB and look at the bufferedAmount value 16MB
                try {
                    for (i; i < 128; i++) {
                        localChannel.send(data);
                        if (localChannel.bufferedAmount > 0) {
                            console.log(i);
                            bA = true;
                            break;
                        }
                    }
                } catch(e) {
                    assert_unreached("Only can send " + i + " x " + data.length / 1024 + " KB before Error and bufferedAmount value did not increase: " + e.name + ": " + e.message);
                }
                if (!bA) {
                    assert_unreached("BufferedAmount value did not increase");
                }
                test.done();
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sends data quick until bufferedAmount increases
- Peer B: closes the DataChannel
- Peer A: sends 1 Byte
- Peer A: checks whether bufferedAmount increases after closing 

 */
// Origin: W3C - 5.2.1  Attributes - bufferedAmount - unsigned long - If the channel is closed, the attribute value will only increase with each call to the send() method
// the attribute does not reset to zero once the channel closes
function testDC_send012() {
    var data = generateData(14);
    var isError = false;
    //16 KB
    var test = async_test("Set up a DataChannel - check whether bufferedAmount increases after closing the remote DataChannel ", {
        timeout : 15000
    });
    test.step(function() {
        var bA = false;
        var bAValue = 0;
        var i = 0;
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send012");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                // Send 1024 x 16 KB and look at the bufferedAmount value
                try {
                    for (i; i < 1024; i++) {
                        localChannel.send(data);
                        if (localChannel.bufferedAmount > 0) {
                            bA = true;
                            // Close the other channel and look at bufferedAmount afer a send
                            remoteChannel.close();
                            bAValue = localChannel.bufferedAmount;
                            localChannel.send(data);
                            if (localChannel.bufferedAmount <= bAValue) {
                                assert_unreached("The bufferedAmount value did not increase after close: ");
                            }
                            break;
                        }
                    }
                } catch(e) {
                    isError = true;
                    errorMessage = e.name + ": " + e.message;
                }
                if (isError) {
                    assert_unreached("Only can send " + i + " x " + data.length / 1024 + " KB before Error: " + e.name + ": " + e.message);
                }
                if (!bA) {
                    assert_unreached("BufferedAmount value did not increase");
                }
                test.done();
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sends data quick until bufferedAmount increases
- Peer A: closes the DataChannel
- Wait 3 seconds
- Peer A: checks whether bufferedAmount not decrease

 */
// Origin: W3C - 5.2.1  Attributes - bufferedAmount - the attribute does not reset to zero once the channel closes
// FIXME : @ W3C bufferedAmount, only can send data if the dataChannel is open so the bufferedAmount value only increases if the corresponding remote datachannel is closed, thats not clear in the api
function testDC_send013() {
    var data = generateData(14);
    //16 KB
    var test = async_test("Set up a DataChannel - check whether the bufferedAmount is not reset to zero once the channel closes", {
        timeout : 15000
    });
    test.step(function() {
        var bA = false;
        var bAValue = 0;
        var i = 0;
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);

        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send013");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                // Send 1024 x 16 KB and look at the bufferedAmount value
                try {
                    for (i; i < 1024; i++) {
                        localChannel.send(data);
                        if (localChannel.bufferedAmount > 0) {
                            bA = true;
                            bAValue = localChannel.bufferedAmount;
                            remoteChannel.close();
                            break;
                        }
                    }
                } catch(e) {
                    assert_unreached("Only can send " + i + " x " + data.length / 1024 + " KB before Error: " + errorMessage);
                }
                if (!bA) {
                    assert_unreached("BufferedAmount value did not increase");
                }
                setTimeout(test.step_func(function() {
                    assert_equals(localChannel.bufferedAmount, bAValue, "bufferedAmount value decreased  ");
                    test.done();
                }), 3000);
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer B: sends String
- Peer A: checks type and data from received message

 */
// Origin: W3C - 5.2.2 - Method send - Type - DOMString
// Info - Binarytype: 5.2.1 The user Agent must set the IDL attribute to the new value...
function testDC_send014() {
    var expected = "string";
    var test = async_test("Set up a DataChannel - send and receive a String - check type and received data", {
        timeout : 10000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send014");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            assert_equals( typeof e.data, expected, "Received wrong type: ");
            assert_equals(e.data, expected, "Receive Fail: ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    remoteChannel.send(expected);
                } catch(e) {
                    assert_unreached(" Error: " + e.name + ": " + e.message);
                }
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer B: sends Blob
- Peer A: checks type and data from received message

 */
// Origin: W3C - 5.2.2 - Methods send - send - Type - Blob
// FIXME: Chrome/Opera: No Blob support yet
function testDC_send015() {
    var test = async_test("Set up a DataChannel - send and receive a Blob - check type and received data", {
        timeout : 10000
    });
    test.step(function() {
        var myBlobData = "<strong> This is a blob </strong><br /> Testing send a blob with webRTC";
        var myBlob = new Blob([myBlobData], {
            type : "text/plain"
        });
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send015");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {

            assert_true(e.data instanceof Blob, "No blob ");
            assert_equals(e.data.size, myBlob.size, "Received wrong size ");
            // read content from a Blob with a FileReader
            var reader = new FileReader();
            reader.addEventListener("loadend", function() {
                assert_equals(reader.result, myBlobData, "Wrong Data ");
                test.done();
            });
            reader.readAsText(e.data);
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    remoteChannel.send(myBlob);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }
            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sets binaryType to Blob
- Peer B: sends ArrayBuffer (16 KB)
- Peer A: checks type (Blob) and data from received message

 */
// Origin: W3C - 5.2.2 - Methods send - Type - Blob
// FIXME: Chrome/Opera: No Blob support yet
function testDC_send016() {
    var datasize = 16384;
    var test = async_test("Set up a DataChannel - send an ArrayBuffer with " + datasize / 1024 + " KB size and receive data as a Blob - check type and data", {
        timeout : 10000
    });
    var expected = "blob";
    test.step(function() {
        var myBlob = new ArrayBuffer(datasize);
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send016");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            assert_true(e.data instanceof Blob, "No blob received ");
            assert_equals(e.data.size, datasize, "Received wrong size ");
            assert_equals(localChannel.binaryType, expected, "Wrong binaryType ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.binaryType = expected;
                    remoteChannel.send(myBlob);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }
            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sets binaryType to ArrayBuffer
- Peer B: sends ArrayBuffer (Int32Array)
- Peer A: checks type (ArrayBuffer) and data from received message

 */
// Origin: W3C - 5.2.2 - Methods send - Type - ArrayBuffer
function testDC_send017() {
    var test = async_test("Set up a DataChannel - send an ArrayBuffer (Int32Array) and receive data as an ArrayBuffer - check type and data", {
        timeout : 10000
    });
    var expected = "arraybuffer";
    test.step(function() {
        var buffer = new ArrayBuffer(12);
        var x = new Int32Array(buffer);
        x[0] = 11111111;
        x[1] = 22222222;
        x[2] = 33333333;
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send017");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            var slice = e.data.slice();
            var y = new Int32Array(slice);
            assert_array_equals(y, x, "Data not send correct ");
            assert_true(e.data instanceof ArrayBuffer, "No blob received ");
            assert_equals(localChannel.binaryType, expected, "Wrong binaryType: ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.binaryType = expected;
                    remoteChannel.send(x.buffer);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }
            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sets binaryType to ArrayBuffer
- Peer B: sends Blob 
- Peer A: checks type (ArrayBuffer) and data from received message

 */
// Send Blob receive as ArrayBuffer
// Origin: W3C - 5.2.2 - Methods send
function testDC_send018() {
    var test = async_test("Set up a DataChannel - send a Blob and receive data as an ArrayBuffer - check type and data", {
        timeout : 10000
    });
    var expected = "arraybuffer";
    test.step(function() {

        var data = new Blob(['<a>Message</a>']);

        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send018");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            assert_equals(e.data.byteLength, data.size, "Receive wrong length");
            assert_equals(localChannel.binaryType, expected, "Wrong binaryType: ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.binaryType = expected;
                    remoteChannel.send(data);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }
            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sets binaryType to ArrayBuffer
- Peer B: sends ArrayBuffer (64 KB)
- Peer A: checks type (ArrayBuffer) and data from received message

 */
// Origin: W3C - 5.2.2 - Methods send -
function testDC_send019() {
    var datasize = 65536;
    var test = async_test("Set up a DataChannel - send an ArrayBuffer with " + datasize / 1024 + " KB size and receive data as an ArrayBuffer - check type and data", {
        timeout : 10000
    });
    var expected = "arraybuffer";
    test.step(function() {
        var buffer = new ArrayBuffer(datasize);
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send019");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {

            assert_equals(e.data.byteLength, datasize, "Receive wrong length");
            assert_equals(localChannel.binaryType, expected, "Wrong binaryType: ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.binaryType = expected;
                    remoteChannel.send(buffer);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }
            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sets binaryType to ArrayBuffer
- Peer B: sends ArrayBufferView (Int8Array)
- Peer A: checks type (ArrayBuffer) and data from received message

 */
// Origin: W3C - 5.2.2 - Methods send -
function testDC_send020() {
    var test = async_test("Set up a DataChannel - send an ArrayBufferView (Int8Array)  and receive data - check type and data", {
        timeout : 10000
    });
    test.step(function() {
        var expected = "arraybuffer";
        var datasize = 32;
        var data = new ArrayBuffer(datasize);
        var int8View = new Int8Array(data);
        for (var i = 0; i < datasize; i++) {
            int8View[i] = 16;
        }
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send020");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            var result = new Int8Array(e.data);
            assert_array_equals(result, int8View, "Array not Equal: ");
            assert_equals(localChannel.binaryType, expected, "Send and receive was successfull but Wrong binaryType: ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.binaryType = expected;
                    remoteChannel.send(int8View);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }

            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sets binaryType to ArrayBuffer
- Peer B: sends ArrayBufferView (Int16Array with offset)
- Peer A: checks type (ArrayBuffer) and data from received message

 */
// Origin: W3C - 5.2.2 - Methods send -
function testDC_send021() {
    var test = async_test("Set up a DataChannel - send an ArrayBufferView (Int16Array with offset) and receive data - check type and data ", {
        timeout : 10000
    });
    test.step(function() {
        var expected = "arraybuffer";
        var datasize = 16;

        var int16View = new Int16Array(datasize, 2);
        for (var i = 0; i < datasize; i++) {
            int16View[i] = i;
        }
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send021");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            var result = new Int16Array(e.data);
            assert_array_equals(result, int16View, "Array not Equal: ");
            assert_equals(localChannel.binaryType, "arraybuffer", "Send and receive was successfull but Wrong binaryType: ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.binaryType = expected;
                    remoteChannel.send(int16View);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }

            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: set binaryType to ArrayBuffer
- Peer B: sends ArrayBufferView (Uint32Array - 4 KB)
- Peer A: checks type (ArrayBuffer) and data from received message

 */
// Origin: W3C - 5.2.2 - Methods send -
function testDC_send022() {
    var expected = "arraybuffer";
    var datasize = 4096;
    var data = new ArrayBuffer(datasize);
    var view = new Uint32Array(data);
    for (var i = 0; i < (datasize / 4); i++) {
        view[i] = i;
    }
    var test = async_test("Set up a DataChannel - send an ArrayBufferView (Uint32Array - " + datasize / 1024 + " KB) and receive data - check type and data ", {
        timeout : 10000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send022");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            var result = new Uint32Array(e.data);
            assert_array_equals(result, view, "Array not Equal: ");
            assert_equals(localChannel.binaryType, expected, "Send and receive was successfull but Wrong binaryType: ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.binaryType = expected;
                    remoteChannel.send(view);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }

            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: set binaryType to ArrayBuffer
- Peer B: sends ArrayBufferView (Float32Array - 32 KB)
- Peer A: checks type (ArrayBuffer) and data from received message

 */
// Origin: W3C - 5.2.2 - Methods send -
function testDC_send023() {
    var expected = "arraybuffer";
    var datasize = 32768;
    var data = new ArrayBuffer(datasize);
    var view = new Float32Array(data, 0);
    for (var i = 0; i < (datasize / 4); i++) {
        view[i] = i;
    }
    a = view;
    var test = async_test("Set up a DataChannel - send an ArrayBufferView (Float32Array - " + datasize / 1024 + " KB) and receive data - check type and data ", {
        timeout : 5000
    });
    test.step(function() {

        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send023");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            var result = new Float32Array(e.data);
            assert_array_equals(result, view, "Array not Equal: ");
            assert_equals(localChannel.binaryType, expected, "Send and receive was successfull but Wrong binaryType: ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.binaryType = expected;
                    remoteChannel.send(view);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }

            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer B: sends “” 0 Bytes 
- Peer A: should receives 0 Bytes

 */
// Origin: W3C - 5.2.2 - Methods send -
// Should receive 0 Byte
function testDC_send024() {
    var expected = "";
    var test = async_test("Set up a DataChannel - send 0 byte data - send and receive", {
        timeout : 10000
    });
    var waitTime = 3000;
    setTimeout(test.step_func(function() {
        assert_unreached("Timeout in " + (waitTime / 1000) + " sec. no error was thrown and no data was sent");
    }), waitTime);
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("test_send024");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            assert_equals(e.data, expected, "Receive Fail: ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    remoteChannel.send(expected);
                    test.done();
                } catch(e) {
                    assert_unreached(e.name +": " + e.message);
                }
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer B: sends “¥¥¥¥¥¥” Unicode data
- Peer A: checks received data

 */
// Origin: W3C - 5.2.2 - Methods send -
function testDC_send025() {
    var expected = "¥¥¥¥¥¥";
    var test = async_test("Set up a DataChannel - send Unicode data: " + expected, {
        timeout : 10000
    });
    var waitTime = 3000;
    var testTimeout = setTimeout(test.step_func(function() {
        assert_unreached("Timeout in: " + (waitTime / 1000) + " sec. no error and no data was send");
    }), waitTime);
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send025");
        } catch(e) {

            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            assert_equals(e.data, expected, "Receive Fail: ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    remoteChannel.send(expected);
                } catch(e) {
                    assert_unreached(" Error: " + e.message);
                }
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer B: send null (type object) 
- Peer A: checks received data, should be “null” String

 */
// Origin: W3C - 5.2.2 - Methods send - Type - DOMString
// http://www.w3.org/TR/WebIDL/#es-DOMString - WebIDL convertes null to String "null"
function testDC_send026() {
    var data = null;
    var expected = "null";
    var test = async_test("Set up a DataChannel - send " + data + " (type " + typeof data + ") - should receive \"null\" String", {
        timeout : 5000
    });
    var waitTime = 2000;
    setTimeout(test.step_func(function() {
        assert_unreached("Timeout in: " + (waitTime / 1000) + " sec. no error and no data was send");
    }), waitTime);
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send026");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            assert_equals(e.data, expected, "Receive Fail object null was not converted from WebIDL: ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    remoteChannel.send(data);
                } catch(e) {
                    assert_unreached(" Error: " + e.message);
                }
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: send 32 MB message
- Peer B: checks received data

 */
// Origin: W3C - 5.2.2 - Methods send
// Firefox sends and receives the data with increasing the buffered mount value with one big Data
// FIXME: Chrome cant send more than 512 KB (Failed to excecute send), after Chrome version update from v36 to 37 no error is thrown but both channel where closed
function testDC_send027() {
    var data = generateData(25);
    var test = async_test("Set up a DataChannel - send " + data.length / 1024 / 1024 + " MB data packet!", {
        timeout : 180000
    });
    test.step(function() {
        console.log(data.length / 1024 / 1024);
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send027");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }

        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;

            remoteChannel.onmessage = test.step_func(function(e) {
                console.log("got data ", e.data.length);
                assert_equals(e.data.length, data.length, "Wrong length received ");
                test.done();
            });

            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.send(data);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }
            });

            remoteChannel.onclose = test.step_func(function(e) {
                console.log("New Channel State: ", localChannel.readyState, remoteChannel.readyState);
                assert_unreached("Channel was closed after send, no data received ");
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sends 128 KB message
- Peer B: checks received data, should receive message complete (not partial)

 */
// Origin: W3C - 5.2.2 - Methods send - DataChannel test for partial delivery
// FIXME: @ W3C No Information about partial delivery in the api
// FIXME: @ Chrome: Fails receives or send Data Partial
// http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.6
function testDC_send028() {
    var data = generateData(17);
    var test = async_test("Set up a DataChannel - send a message of size " + data.length / 1024 + " KB and check whether the other channel receives the complete message (partial delivery) - should receive complete message", {
        timeout : 20000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send028");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.send(data);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }
            });
            remoteChannel.onmessage = test.step_func(function(e) {
                if ((e.data).length != data.length) {
                    assert_unreached("Data was send like partial-delivery - received  " + ((e.data).length / 1024) + " KB not - " + (data.length / 1024) + " KB");
                }
                test.done();

            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sends 66528 Byte message
- Peer B: checks received data, should receive message complete (not partial)

 */
// Origin: W3C - 5.2.2 - Methods send - DataChannel test for partial delivery
// FIXME: @ W3C No Information about partial delivery in the api
// http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.6
function testDC_send029() {
    var data = generateData(16);
    data += generateLinearData(992);
    var test = async_test("Set up a DataChannel - send message of size " + data.length + " Bytes and check whether the other channel receives the complete message (partial delivery) - should receive complete message", {
        timeout : 20000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send029");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.send(data);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }
            });
            remoteChannel.onmessage = test.step_func(function(e) {
                if ((e.data).length != data.length) {
                    assert_unreached("Data was send like partial-delivery - received  " + ((e.data).length ) + " Byte not - " + (data.length) + " Byte");
                }
                test.done();
            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sends 66529 Byte message
- Peer B: checks received data, should receive message complete (not partial)

 */
// Origin: W3C - 5.2.2 - Methods send - DataChannel test for partial delivery
// FIXME: @ W3C No Information about partial delivery in the api
// FIXME: @ Chrome: Fails receives or send Data Partial
// http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.6
function testDC_send030() {
    var data = generateData(16);
    data += generateLinearData(993);
    var test = async_test("Set up a DataChannel - send message of size " + data.length + " Bytes and check whether the other channel receives the complete message (partial delivery) - should receive complete message", {
        timeout : 20000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send030");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.send(data);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);

                }
            });
            remoteChannel.onmessage = test.step_func(function(e) {
                if ((e.data).length != data.length) {
                    assert_unreached("Data was send like partial-delivery - received  " + ((e.data).length ) + " Byte not - " + (data.length) + " Byte");
                }
                test.done();

            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer B: closes the DataChannel
- Wait 1 second
- Peer A: sends data, throw an Error exception

 */
// Origin: W3C - 5.2.3 - Methods send - before send data -> close the correspondending Channel
// FIXME W3C wich error should throw (InvalidStateError or NetworkError)?
function testDC_send031() {
    var test = async_test("Set up a DataChannel - before sending data close the remote DataChannel - throw an Error", {
        timeout : 10000
    });
    test.step(function() {
        var data = generateData(12);
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send031");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                remoteChannel.close();
                setTimeout(test.step_func(function() {
                    try {
                        localChannel.send(data);
                    } catch(e) {
                        console.log(e);
                        test.done();
                    }
                }), 1000);
            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer B: sets binaryType to ArrayBuffer 
- Peer A: sends 32 MB ArrayBufferView (Uint32Array) 
- Peer B: checks received data and binaryType

 */
// Origin: W3C - 5.2.2 - Methods send
function testDC_send032() {
    var expected = "arraybuffer";
    var datasize = 32 * 1024 * 1024;
    var data = new ArrayBuffer(datasize);
    var view = new Uint32Array(data);
    for (var i = 0; i < (datasize / 1024); i++) {
        view[i] = i;
    }
    var test = async_test("Set up a DataChannel - send " + datasize / 1024 / 1024 + " MB ArrayBufferView (Uint32Array) data packet!", {
        timeout : 180000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send032");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    remoteChannel.binaryType = "arraybuffer";
                    localChannel.send(data);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }
            });
            remoteChannel.onmessage = test.step_func(function(e) {
                var result = new Uint32Array(e.data);
                assert_array_equals(result, view, "Array not Equal: ");
                assert_equals(remoteChannel.binaryType, expected, "Send and receive was successfull but Wrong binaryType: ");
                test.done();
            });
            remoteChannel.onclose = test.step_func(function(e) {
                console.log("New Channel State: ", localChannel.readyState, remoteChannel.readyState);
                assert_unreached("Channel was closed after send, no data received ");
            });
        };
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sends 16 KB data 512 times (8 MB)
- Peer B: checks received data 

 */
// Origin: W3C - 5.2.2 - Methods send data quick after each other
function testDC_send033() {
    var data = generateData(14);
    var repeats = 512;
    var receive = 0;
    var i = 0;
    var test = async_test("Set up a DataChannel - send " + (data.length / 1024) + " KB data " + repeats + " times = " + (data.length * repeats / 1024 / 1024) + " MB", {
        timeout : 20000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send033");
        } catch(e) {
            assert_unreached(e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    for ( i = 0; i < repeats; i++) {
                        localChannel.send(data);
                    }
                } catch(e) {
                    assert_unreached("Can send " + i + " times before error " + e.name + ": " + e.message);
                }
            });

            remoteChannel.onmessage = function(e) {
                receive++;
                if (receive == repeats) {
                    test.done();
                }
            };
        };

    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer B: sends undefined (type undefined) 
- Peer A: checks received data, should be “undefined” String

 */
// Origin: W3C - 5.2.2 - Methods send - Type - DOMString
// http://www.w3.org/TR/WebIDL/#es-DOMString - WebIDL convertes undefined to String "undefined"
function testDC_send034() {
    var data = undefined;
    var expected = "undefined";
    var test = async_test("Set up a DataChannel - send " + data + " (type " + typeof data + ") - should receive \"undefined\" String", {
        timeout : 10000
    });
    var waitTime = 3000;
    setTimeout(test.step_func(function() {
        assert_unreached("Timeout in: " + (waitTime / 1000) + " sec. no error and no data was send");
    }), waitTime);
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send034");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            assert_equals(e.data, expected, "Receive Fail object undefined was not converted from WebIDL: ");
            test.done();
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    remoteChannel.send(data);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A/B: sends 16 KB data 256 times (4 MB) and receive
- Peer A/B: checks received data

 */
// Origin: W3C - 5.2.2 - Methods send data quick after each other
// FIXME: Chrome crashes
function testDC_send035() {
    var data = generateData(14);
    var repeats = 256;
    var receiveLocal = 0;
    var receiveRemote = 0;
    var received = false;
    var i = 0;
    var test = async_test("Set up a DataChannel - send "+ repeats + " messages of size " + (data.length / 1024) + " KB (total of "+ (data.length * repeats / 1024 / 1024) + " MB) and receive - synchronous", {
        timeout : 25000
    });
    var waitTime = 20000;
    var testTimeout = setTimeout(test.step_func(function() {
        assert_unreached("Timeout in: " + (waitTime / 1000) + " sec. - Local Channel sends: " + i + " times and receives " + receiveRemote + " messages. - Remote Channel sends: " + j + " times and receives " + receiveLocal + " messages!");
    }), waitTime);

    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send035");
        } catch(e) {
            assert_unreached(e.name + ": " + e.message);
        }
        localChannel.onmessage = function(e) {
            receiveLocal++;
            if (receiveLocal == repeats) {
                if (received) {
                    test.done();
                } else {
                    received = true;
                }
            }
        };
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    for ( i = 0; i < repeats; i++) {
                        remoteChannel.send(data);
                        localChannel.send(data);
                    }
                } catch(e) {
                    assert_unreached("Can send " + i + " times before " + e.name + ": " + e.message);
                }
            });
            remoteChannel.onmessage = function(e) {
                console.log("rec");
                receiveRemote++;
                if (receiveRemote == repeats) {
                    if (received) {
                        test.done();
                    } else {
                        received = true;
                    }
                }
            };
        };

    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sends data 2048 times 
- Peer B: checks correct order from received data

 */
// Origin: W3C - 5.2.2 - Methods send data quick and check Right order
function testDC_send036() {
    var data = "1";
    var repeats = 2048;
    var receive = 0;
    var i = 0;
    var test = async_test("Set up a DataChannel - send " + repeats + " messages - check right order", {
        timeout : 15000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send036");
        } catch(e) {
            assert_unreached(e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    for ( i = 0; i < repeats; i++) {
                        localChannel.send(data);
                        data = data + "1";
                    }
                } catch(e) {
                    assert_unreached("Can send " + i + " times before error " + e.name + ": " + e.message);
                }
            });

            remoteChannel.onmessage = test.step_func(function(e) {
                //console.log(e.data);
                receive++;
                if (!((e.data).length == receive)) {
                    assert_unreached("Got messages in wrong order ");
                }
                if (receive == repeats) {
                    test.done();
                }
            });
        };

    });
}

/**
- Peer A: creates a DataChannel  with id= 2, ordered = true and negotiated = true
- Peer B: creates a DataChannel  with id= 2, ordered = false  and negotiated = true
- Peer A/B: sends data 2048 times (beginning with 1 KB then increment 1 Byte)
- Peer B must receive data ordered
- Peer A can receive data randomly

 */
// Origin: W3C - 5.2.2 - Methods send
// @ W3C No information about asymmetric option should they send in differents options
function testDC_send037() {
    var data = generateData(10);
    var repeats = 2048;
    var receiveLocal = 0, receiveRemote = 0;
    var i = 0;
    var test = async_test("Create two DataChannels with the same id and negotiated = true - with asymmetric attribute ordered true/false - send  " + repeats + " times and receive - synchronous", {
        timeout : 500000
    });
    test.step(function() {
        // localChannel
        var dataChannelOptions1 = {
            id : 2,
            negotiated : true,
            ordered : true
        };
        // remoteChannel
        var dataChannelOptions2 = {
            id : 2,
            negotiated : true,
            ordered : false
        };
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send037", dataChannelOptions1);
            remoteChannel = remotePeerConnection.createDataChannel("testDC_send037", dataChannelOptions2);
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }

        createIceCandidatesAndOffer();

        remoteChannel.onopen = function() {
            setTimeout(test.step_func(function() {
                try {
                    for ( i = 0; i < repeats; i++) {
                        localChannel.send(data);
                        remoteChannel.send(data);
                        data = data + "1";
                    }
                } catch(e) {
                    assert_unreached("Can send " + i + " times before error " + e.name + ": " + e.message);
                }
            }), 1000);
        };

        // Should receive Ordered (localChannel: ordered = true)
        remoteChannel.onmessage = test.step_func(function(e) {
            receiveRemote++;
            if (!((e.data).length == (receiveRemote + 1023))) {
                assert_unreached("REMOTE Got messages in wrong order ");
            }
            if (receiveLocal == repeats && receiveRemote == repeats) {
                assert_not_equals(localChannel.ordered, remoteChannel.ordered, "No assymetric options - ordered ");
                test.done();
            }
        });

        // Should receive in any order (remoteChannel: ordered = false)
        localChannel.onmessage = test.step_func(function(e) {

            receiveLocal++;
            if (!((e.data).length == (receiveLocal + 1023))) {
                console.log("Peer A (localChannel) received message not in order ");
            }
            if (receiveLocal == repeats && receiveRemote == repeats) {
                assert_not_equals(localChannel.ordered, remoteChannel.ordered, "No assymetric options - ordered ");
                test.done();
            }
        });
    });

}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sends 16 KB data 96 times (1.5 MB) – waits 2 seconds
- Peer A: repeats the send procedure 20 times
- Peer B: checks received data

 */
// Origin: W3C - 5.2.2 - Methods send data quick after each other
function testDC_send038() {
    var data = generateData(14);
    var repeats = 96;
    var replays = 20;
    var replayCount = 0;
    var receive = 0;
    var i = 0;
    var test = async_test("Set up a DataChannel - send "+ repeats + " messages of size " + (data.length / 1024) + " KB (total of " + (data.length * repeats / 1024 / 1024) + " MB) - wait 2 second and replay " + replays + " times (total of " + ((data.length * repeats / 1024 / 1024) * replays) + " MB)", {
        timeout : 80000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send038");
        } catch(e) {
            assert_unreached(e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                var iV = setInterval(function() {
                    test.step(function() {
                        try {
                            for ( i = 0; i < repeats; i++) {
                                localChannel.send(data);
                            }
                        } catch(e) {
                            assert_unreached("Can send " + i * replayCount + " times before error " + e.name + ": " + e.message);
                        }
                    });
                    replayCount++;
                    if (replayCount == replays) {
                        clearInterval(iV);
                    }
                }, 2000);
            });

            remoteChannel.onmessage = function(e) {
                receive++;
                if (receive == (replays * repeats) && replayCount == replays) {
                    test.done();
                }
            };
        };

    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sends 256 KB message
- Peer B: checks received data

 */
// Origin: W3C - 5.2.2 - Methods send - Chrome and Opera maximum message size
function testDC_send039() {
    var data = generateData(18), partialLength = 0;
    var test = async_test("Set up a DataChannel - send a message of size " + data.length / 1024 + " KB (find maximum message size Chrome/Opera)", {
        timeout : 10000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send039");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.send(data);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }
            });
            remoteChannel.onmessage = test.step_func(function(e) {
                if ((e.data).length + partialLength == data.length) {
                    test.done();
                } else {
                    partialLength += (e.data).length;
                    console.log("Partial receive " + partialLength);
                }
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: send 256 KB  +  1 Byte message
- Peer B: checks received data

 */
// Origin: W3C - 5.2.2 - Methods send - find Chrome and Opera maximum message size
function testDC_send040() {
    var data = generateData(18), partialLength = 0;
    var test = async_test("Set up a DataChannel - send a message of size " + data.length / 1024 + " KB + 1 Byte (find maximum message size Chrome/Opera)", {
        timeout : 10000
    });
    data += "s";
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send040");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    localChannel.send(data);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                };
            });
            remoteChannel.onmessage = test.step_func(function(e) {
                if ((e.data).length + partialLength == data.length) {
                    test.done();
                } else {
                    partialLength += (e.data).length;
                    console.log("Partial receive " + partialLength);
                }
            });
            remoteChannel.onclose = test.step_func(function(e) {
                console.log("New Channel State: ", localChannel.readyState, remoteChannel.readyState);
                assert_unreached("Channel was closed after send, no data received ");
            });
        });
    });
}

/**
- Peer A: creates a DataChannel  
- Peer B: waits for the DataChannel
- Peer A: sends message
- Peer B: checks received data
- Wait 25 seconds
- Peer A: sends message ( Connection should be open)
- Peer B: checks received data

 */
// Origin: W3C - 5.2.2 - Methods send - Type - DOMString
function testDC_send041() {
    var expected = "data";
    var waitTime = 25000;
    var rec = false;
    var test = async_test("Set up a DataChannel - send data - wait " + waitTime / 1000 + " seconds - send data - Connection should be open (keeping connection)", {
        timeout : 30000
    });

    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send041");
        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }
        localChannel.onmessage = test.step_func(function(e) {
            assert_equals(e.data, expected, "Receive Fail  ");
            if (rec)
                test.done();
            rec = true;
        });
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = test.step_func(function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    remoteChannel.send(expected);
                    setTimeout(test.step_func(function() {
                        remoteChannel.send(expected);
                    }), waitTime);
                } catch(e) {
                    assert_unreached(e.name + ": " + e.message);
                }
            });
        });
    });
}

/**
 * ===========================================================================================
 * Tests who can't run in the Testsuite
 */
/**

 */
// Origin: W3C - 5.2.2 - Methods send data quick after each other
function test_send042() {
    var data = generateData(18);
    var repeats = 256;

    var received = 0;
    var receiveLength = data.length * repeats + repeats;
    var i = 0;
    var test = async_test("Set up a DataChannel with max Retransmits = 1 (unreliable)- send " + (data.length / 1024) + " KB data " + repeats + " times = " + (data.length * repeats / 1024 / 1024) + " MB", {
        timeout : 90000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send042", {
                maxRetransmits : 1
            });
        } catch(e) {
            assert_unreached(e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    for ( i = 0; i < repeats; i++) {
                        localChannel.send(data);
                    }
                } catch(e) {
                    assert_unreached("Can send " + i + " times before error " + e.name + ": " + e.message);
                }
                try {
                    for ( i = 0; i < repeats; i++) {
                        localChannel.send("a");
                    }
                } catch(e) {
                    assert_unreached("Can send " + i + " times before error " + e.name + ": " + e.message);
                }

            });
            remoteChannel.onmessage = function(e) {
                received += e.data.length;
                b = received;
                c = receiveLength;
                if (received == receiveLength) {
                    test.done();
                }
            };
        };

    });
}

// DataChannel check when the buffer is full, if we use not local peers the buffered Amount value increases faster
// Buffered Amount unsigned long 0 - 4.294.967.295
// 2143076352 maximum value in Firefox
// FIXME Test runs only in Firefox
function test_send050() {
    var data = generateData(23);
    var repeats = 64;
    var test = async_test("Create associated DataChannels send " + data.length / 1024 / 1024 + " MB " + repeats + " times and try to reach bufferedAmount value", {
        timeout : 5000
    });
    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_send036");
        } catch(e) {
            assert_unreached(e.name + ": " + e.message);
        }
        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            remoteChannel = e.channel;
            remoteChannel.onopen = test.step_func(function() {
                try {
                    for (var i = 0; i < repeats; i++) {
                        localChannel.send(data);
                    }
                } catch(e) {
                    assert_unreached("Current bufferedAmound value: " + localChannel.bufferedAmount / 1024 + " KB " + e.name + ": " + e.message);
                }
                assert_true(false, "Can send all data and the current bufferedAmount value is: " + localChannel.bufferedAmount + " - " + localChannel.bufferedAmount / 1024 + " KB" + " - " + localChannel.bufferedAmount / 1024 / 1024 + " MB");
                test.done();
            });
        };
    });
}

// Origin: W3C - 5.2.2 - Methods send - Type - DOMString
// http://www.w3.org/TR/WebIDL/#es-DOMString - WebIDL convertes undefined to String "undefined"

function test_testING() {
    var expected = "data";

    var test = async_test("Testing ", {
        timeout : 30000
    });

    test.step(function() {
        localPeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection = new RTCPeerConnection(iceServers);
        try {
            localChannel = localPeerConnection.createDataChannel("testDC_0", {
                //    maxRetransmits : 0
            });
            createIceCandidatesAndOffer();
            //   lc = localPeerConnection.createDataChannel("testDC_1", {
            //      maxRetransmits : 1
            //  });

        } catch(e) {
            assert_unreached("An error was thrown " + e.name + ": " + e.message);
        }

        createIceCandidatesAndOffer();
        remotePeerConnection.ondatachannel = function(e) {
            if (remoteChannel == null) {
                remoteChannel = e.channel;
            } else {
                //   rC = e.channel;
            }

        };

    });
}

