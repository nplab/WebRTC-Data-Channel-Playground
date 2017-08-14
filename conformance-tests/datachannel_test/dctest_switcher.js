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
 * This file takes care of the test excecution
 */

var dctestrefs = {
    "W3CPeerM": {
        "author": "W3C",
        "title": "WebRTC 1.0: Real-time Communication Between Browsers - RTCPeerConnection Methods",
        "status": "Working Draft",
        "date": "2015-02-10",
        "url": "https://www.w3.org/TR/2015/WD-webrtc-20150210/#methods-2"
    },
    "W3CData": {
        "author": "W3C",
        "title": "WebRTC 1.0: Real-time Communication Between Browsers - RTCDataChannel",
        "status": "Working Draft",
        "date": "2015-02-10",
        "url": "https://www.w3.org/TR/2015/WD-webrtc-20150210/#rtcdatachannel"
    },
    "W3CDataA": {
        "author": "W3C",
        "title": "WebRTC 1.0: Real-time Communication Between Browsers - RTCDataChannel Attributes",
        "status": "Working Draft",
        "date": "2015-02-10",
        "url": "https://www.w3.org/TR/2015/WD-webrtc-20150210/#attributes-6"
    },
    "W3CDataM": {
        "author": "W3C",
        "title": "WebRTC 1.0: Real-time Communication Between Browsers - RTCDataChannel Methods",
        "status": "Working Draft",
        "date": "2015-02-10",
        "url": "https://www.w3.org/TR/2015/WD-webrtc-20150210/#methods-3"
    },
    "W3CDataD": {
        "author": "W3C",
        "title": "WebRTC 1.0: Real-time Communication Between Browsers - RTCDataChannel Dictionary",
        "status": "Working Draft",
        "date": "2015-02-10",
        "url": "https://www.w3.org/TR/2015/WD-webrtc-20150210/#dictionary-rtcdatachannelinit-members"
    },
    "W3CDOM": {
        "author": "W3C",
        "title": "WebIDL Level 1 - ECMAScript binding",
        "status": "Recommendation",
        "date": "2016-12-15",
        "url": "http://www.w3.org/TR/WebIDL/#es-DOMString"
    },
    "IETFDataP": {
        "author": "IETF",
        "title": "WebRTC Data Channel Establishment Protocol - Message Formats",
        "status": "Internet-Draft",
        "date": "2014-07-04",
        "url": "http://tools.ietf.org/html/draft-ietf-rtcweb-data-protocol-07#section-5.1"
    },
    "IETFData66": {
        "author": "IETF",
        "title": "WebRTC Data Channels - Transferring User Data on a Channel",
        "status": "Internet-Draft",
        "date": "2014-07-04",
        "url": "http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.6"
    },
    "IETFData67": {
        "author": "IETF",
        "title": "WebRTC Data Channels - Closing a Channel",
        "status": "Internet-Draft",
        "date": "2014-07-04",
        "url": "http://tools.ietf.org/html/draft-ietf-rtcweb-data-channel-11#section-6.7"
    },
    "ChromeBug": {
        "author": "Chromium",
        "title": "SCTP DataChannel stream id assignment does not respect the negotiated max stream count",
        "status": "Bug Report",
        "date": "2014-04-02",
        "url": "https://code.google.com/p/webrtc/issues/detail?id=3150"
    }
};
        
var availableDcTests = {};
var selectedDcTestList = [];
var selectedDcTestNames = [];

// Run the next test
function dctestSwitcher(count) {
    if (count < selectedDcTestList.length) {
        try {
            run_dctest(selectedDcTestNames[count], selectedDcTestList[count]);
        } catch(err) {
            console.log("Error while executing test " + selectedDcTestList[count].description, err);
        }
    } else {
        done();
    }
}

// Finds all objects in space that start with dctests - all dataChannel test definitions
function getDcTests(obj) {
    var dctests = {};
    var count = 0;
    for (var o in obj) {
        if ( typeof obj[o] === "object") {
            var oParts = o.split("_");
            if (oParts.length === 2 && oParts[0] === "dctests") {
                dctests[oParts[1]] = obj[o];
                for (var testName in obj[o]) {
                    count++;
                }
            }
        }
    }
    $('#badgeTestcount').html(count);
    availableDcTests = dctests;
}

// Create the table with all available tests
function fillDcTestTable() {
    var testlistHTML = "<tr>";
    var ref2Num = {};
    var i = 1;
    for (var key in dctestrefs) {
        ref2Num[key] = i;
        i++;
    }

    for (var testCategory in availableDcTests) {
        testlistHTML += '<tr>';
        testlistHTML += '<td><b> '+ testCategory + '</b></td>';
        testlistHTML += '</tr>';
        for (var testName in availableDcTests[testCategory]) {
            var test = availableDcTests[testCategory][testName];
            var fullName = testCategory + '.' + testName;
            testlistHTML += '<tr><td>';
            testlistHTML += '<span class="glyphicon glyphicon-search inspectFunction" aria-hidden="true" data-function="'+htmlEncode(test.test_function.toString())+'"></span> <label><input type="checkbox" name="test" value="' + testCategory + '.' + testName + '"> '+ testName + ' - ' + test.description + '</label>';
            if (test.scenario !== undefined) {
                testlistHTML += ' <a href="javascript:;" data-target="#' + testCategory + '_' + testName + '_scenario" data-toggle="collapse" data-target="#' + testCategory + '_' + testName + '_scenario">scenario</a>';
            }
            if (test.references !== undefined) {
                for (var i=0; i<test.references.length; i++) {
                    testlistHTML += ' <a href="#ref' + test.references[i] + '">[' + ref2Num[test.references[i]] + ']</a>'; 
                }
            }
            if (test.scenario !== undefined) {
                testlistHTML += '<div id="' + testCategory + '_' + testName + '_scenario" class="collapse">' + test.scenario + '</div>';
            }
            testlistHTML += '</td></tr>';
        }
            
    }
    //testlistHTML += "</table></form>";

    $('#testlist').append(testlistHTML);
}

function fillDcTestRefsTable() {
    var testrefsHTML;
    var i = 1;
    for (var key in dctestrefs) {
        testrefsHTML += '\
        <tr>\
        <td class="text-right">' + i + '. </td>\
        <td id="ref' + key + '">\
        <a href="' + dctestrefs[key].url + '">' + dctestrefs[key].title + '</a>. \
        ' + dctestrefs[key].author + ((dctestrefs[key].author === "") ? "" : ". ") + '\
        ' + dctestrefs[key].status + ((dctestrefs[key].status === "") ? "" : ". ") + '\
        ' + dctestrefs[key].date + '\
        </td>\
        </tr>';
        i++;
    }

    $('#testrefs').append(testrefsHTML);
}

function htmlEncode(value){
  // Create a in-memory div, set its inner text (which jQuery automatically encodes)
  // Then grab the encoded contents back out. The div never exists on the page.
  return $('<div/>').text(value).html().replace(/"/g, '&quot;');
}

// Create new TestList with only selected Tests
function generateNewDcTestList(all) {
    selectedDcTestList = [];
    selectedDcTestNames = [];
    if (all) {
        for (var testCategory in availableDcTests) {
            for (var testName in availableDcTests[testCategory]) {
                selectedDcTestNames.push(testCategory + "." + testName);
                selectedDcTestList.push(availableDcTests[testCategory][testName]);
            }
        }
    } else {
        $('#testlist input:checkbox').each(function(){
            if($(this).prop('checked')) {
                testParts = $(this).prop('value').split(".");
                selectedDcTestNames.push(testParts[0] + "." + testParts[1]);
                selectedDcTestList.push(availableDcTests[testParts[0]][testParts[1]]);
            }
        });
    }

    console.log('new list was generated: '+selectedDcTestList.length + ' items');
}

// check the tests from selected tests (eg loaded from cookies)
function setCertainCheckboxes(){
    $("#testlist INPUT[type='checkbox']").prop('checked',false);
    $.each(selectedDcTestNames,function(key,val) {
        $('#testlist input:checkbox[value="'+val+'"]').prop('checked',true);
     });
}

function setCookie(name) {
    localStorage.setItem(name,JSON.stringify(selectedDcTestList));
    localStorage.setItem(name+"Names",JSON.stringify(selectedDcTestNames));
    return true;
}

function loadCookie(name) {
    var cookie = localStorage.getItem(name);
    var cookieNames = localStorage.getItem(name+"Names");
    if (cookie !== null) {
        selectedDcTestList = JSON.parse(cookie);
        selectedDcTestNames = JSON.parse(cookieNames);
        setCertainCheckboxes();
    } else {
        alert("Sorry, no Data!");
    }
}

function startSelectedDcTests() {
    $('.progressbar').css('width', '0%').attr('aria-valuenow', 0).html('0/'+selectedDcTestList.length);
    dctestSwitcher(0);
    $('#logWrapper').show();
    $('#testWrapper').hide();
}

function countDcTests(tests) {
    var count = 0;
    for (var testCategory in tests) {
        for (var testName in tests[testCategory]) {
            count++;
        }
    }
    return count;
}

function run_dctest(name, attr) {
    if (attr.sync) {
        test(function() {
                attr.test_function(attr.parameters);
            }, name + ' - ' + attr.description, {
                timeout: attr.timeout
            }
        );
    } else {
        var atest = async_test(name + ' - ' + attr.description, {
            timeout: attr.timeout}
        );
        /*
        atest.step(function() {
            attr.test_function(atest, attr.parameters);
        });
        */
       attr.test_function(atest, attr.parameters);
    }
}

// Button - start all Tests
$('button#btnTestStartAll').click(function() {
    //setCookie("previous");
    generateNewDcTestList(true);
    
    startSelectedDcTests();
});

// Button - start selected Tests
$('button#btnTestStartSelected').click(function() {
    generateNewDcTestList(false);

    if (selectedDcTestList.length === 0) {
        alert("Please choose some tests");
    } else {
        setCookie("previous");
        startSelectedDcTests();
    }
});

// Dropdown - select Testgroup
$('ul#testGroupSelect li a').click(function(event){
    console.log('selecting: '+ $(this).data("testgroup"));
    $("#testlist INPUT[type='checkbox']").prop('checked',false);
    $("#testlist INPUT[type='checkbox'][value^='"+$(this).data('testgroup')+"']").prop('checked',true);
    event.preventDefault();
});

// Button - invert selection
$('button#btnTestSelectOpposite').click(function(){
    $("#testlist INPUT[type='checkbox']").each( function() {
        if($(this).prop('checked', !$(this).prop('checked'))){

    	};
    });
    return false;
});

// Button - unselect all
$('button#btnTestUnselect').click(function(){
    $("#testlist INPUT[type='checkbox']").prop('checked',false);
    return false;
});

// Button - load selection from cookie
$('button#btnTestLoad').click(function(){
    loadCookie("test");
});

// Button - save selection to cookie
$('button#btnTestSave').click(function(){
    generateNewDcTestList();
    setCookie("test");
});

$('button#btnTestLoadPrevious').click(function(){
    loadCookie("previous");
});

