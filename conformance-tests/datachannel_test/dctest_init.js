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
 * This testsuite runs with datachannellocal.js and datachannellocal_switcher.js
 * Testframework: testharness W3C http://testthewebforward.org/docs/
 * Testing the webRTC DataChannel API: http://dev.w3.org/2011/webrtc/editor/webrtc.html#peer-to-peer-data-api
 * 
 * To mimic a DataChannel connection between two peers the sript creates two different RTCPeerConnections in one Browser
 * Peer A = localPeerConnection, localChannel
 * Peer B = remotePeerConnection, remoteChannel 
 */

var showResults = false;
var testResult = ["Pass", "Fail", "Timeout"];
var testCounter = 0;
// Stores all test names
var testNames ="";
// Stores all test results
var testResults = "";
// Stores complete information
var testCompleteResults = "<table style='width:100%'><tr><th>No.</th><th>Test name</th><th>Result </th><th>Message</th></tr>";

function testMessage(res){
    if(res!= null){
        return res;
    }
    return "";
}

// Testharness setup
setup({
    explicit_done : true,
    explicit_timeout : true
});

// Testharness callback - start
function start_callback() {
    logWrite("Tests started!");
}

// Testharness functions result callback
function result_callback(res) {
    // increment Counter and Progressbar
    //progressBar.value++;
    $('#progressbar').css('width', 100*testCounter/selectedTestList.length+'%').attr('aria-valuenow', 0).html(testCounter+'/'+selectedTestList.length); 
    testCounter++;
    
    // Safe Values for logging test information
    testNames += res.name + "<br />";
    testResults += testResult[res.status] +"<br />";
    testCompleteResults += "<tr><td>"+testCounter+"</td><td>"+res.name+"</td><td>"+testResult[res.status]+"</td><td>"+testMessage(res.message)+"</td></tr>";


    logWrite("Test: " + (res.name) + "... done! - \"" + availableTestList[testCounter] + "\"");    
    if (showResults)
        console.log("Result received", res);
        
    //If only runs one test don't close the channels to test with the console
    if(availableTestList.length != 1)
    {
        // Close the channels and set to null
        closeRTCPeerConnection();
    }

    // If test completed start the next test after short break 
    setTimeout(function(){
        testSwitcher(testCounter);
    }, 500);
}

// Testharness completion callback from all tests.
function completion_callback(allRes, status) {
	$('#progressbar').css('width', '100%').attr('aria-valuenow', 100).html(testCounter+' tests completed!').removeClass('active').removeClass('progress-bar-striped');
	
    logWrite("Tests completed!");
    testCompleteResults += "</table>";
    console.log("Test results: ", allRes, status);
}


/**
 * Test whether prefixes are used
 */
function testDCPC() {
    test(function() {
        assert_true(!!testRTCPeerConnection, "RTCPeerConnection not available, musst use prefix");
    }, "testDCPC: Check if RTCPeerConnection is available");
}

function _testDCPC() {
    assert_true(!!testRTCPeerConnection, "RTCPeerConnection not available, musst use prefix");
}

function testDCPCWebkit() {
    test(function() {
        assert_true(!!window.webkitRTCPeerConnection, "You don't use Google/Opera or a too old version");
    }, "testDCPCWebkit: Check if webkitRTCPeerConnection (Google/Opera) is available");
}
