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

var availableTestList = [];
var availableDcTests = {};
var selectedTestList = [];
var selectedDcTests = [];


// Run the next test
function testSwitcher(count) {
    if (count < selectedTestList.length) {
        try {
            eval(selectedTestList[count] + "()");
        } catch(err) {
            console.log("Error while eval function " + selectedTestList[count], err);
        }
    } else {
        done();
    }
}

// Check for all functions are available in space with name testDC - all dataChannel tests
function getMethods(obj) {
    var tests = [];
    for (var m in obj) {
        console.log(m + " - " + obj[m] + " is " + (typeof obj[m] === "object"));
        if ( typeof obj[m] === "function") {
            if (m.search("testDC") != -1) {
                tests.push(m);
            }
        }
    }
    $('#badgeTestcount').html(tests.length);
    availableTestList = tests;
}

function getDcTests(obj) {
    var dctests = {};
    for (var o in obj) {
        if ( typeof obj[o] === "object") {
            var oParts = o.split("_");
            if (oParts.length === 2 && oParts[0] === "dctests") {
                dctests[oParts[1]] = obj[o];
            }
        }
    }
    $('#badgeTestcount').html(dctests.length);
    availableDcTests = dctests;
}

// Create the table with all available tests
function fillTestList() {
    var testlistHTML = "<tr>";

    $.each(availableTestList,function(key,val) {
        testlistHTML += '<td><span class="glyphicon glyphicon-search inspectFunction" aria-hidden="true" data-function="'+val+'"></span> <label><input type="checkbox" name="test" value="' + val + '"> '+ val + '</label></td>';
        // new row every 5 cols
        if (key % 5 == 4) {
            testlistHTML += "</tr><tr>";
        }
    });
    testlistHTML += "</tr></table></form>";

    $('#testlist').append(testlistHTML);
}

// Create the table with all available tests
function fillDcTestTable() {
    var testlistHTML = "<tr>";

    for (var testCategory in availableDcTests) {
        testlistHTML += '<tr>';
        testlistHTML += '<td><b> '+ testCategory + '</b></td>';
        testlistHTML += '</tr>';
        for (var testName in availableDcTests[testCategory]) {
            var test = availableDcTests[testCategory][testName];
            testlistHTML += '<tr><td>';
            testlistHTML += '<span class="glyphicon glyphicon-search inspectFunction" aria-hidden="true" data-function="'+htmlEncode(test.test_function.toString())+'"></span> <label><input type="checkbox" name="test" value="' + testCategory + '.' + testName + '"> '+ testName + ' - ' + test.description + '</label>';
            if (test.references !== undefined) {
                for (var i=0; i<test.references.length; i++) {
                    testlistHTML += ' <a href="' + test.references[i] + '">' + (i+1) + '</a>'; 
                }
            }
            if (test.scenario !== undefined) {
                testlistHTML += test.scenario;
            }
            testlistHTML += '</td></tr>';
        }
            
    }
    //testlistHTML += "</table></form>";

    $('#testlist').append(testlistHTML);
}

function htmlEncode(value){
  // Create a in-memory div, set its inner text (which jQuery automatically encodes)
  // Then grab the encoded contents back out. The div never exists on the page.
  return $('<div/>').text(value).html().replace(/"/g, '&quot;');
}

// Create new TestList with only selected Tests
function generateNewTestList() {
	selectedTestList = [];
    $('#testlist input:checkbox').each(function(){
    	if($(this).prop('checked')) {
    		selectedTestList.push($(this).prop('value'));
    	}
    });

    console.log('new list ist generated: '+selectedTestList.length + ' items');
}

// Create new TestList with only selected Tests
function generateNewDcTestList() {
    selectedDcTests = {};
    $('#testlist input:checkbox').each(function(){
    	if($(this).prop('checked')) {
            testParts = $(this).prop('value').split(".");
            if (selectedDcTests[testParts[0]] === undefined) {
                selectedDcTests[testParts[0]] = {};
            }
            selectedDcTests[testParts[0]][testParts[1]] = availableDcTests[testParts[0]][testParts[1]];
    	}
    });

    console.log('new list ist generated: '+selectedTestList.length + ' items');
}

// check the tests from selected tests (eg loaded from cookies)
function setCertainCheckboxes(){
    $("#testlist INPUT[type='checkbox']").prop('checked',false);
    $.each(selectedTestList,function(key,val) {
        $('#testlist input:checkbox[value='+val+']').prop('checked',true);
     });
}

function setCookie(name) {
    localStorage.setItem(name,JSON.stringify(selectedTestList));
    return true;
}

function loadCookie(name) {
    var cookie = localStorage.getItem(name);
    if(cookie != null) {
		selectedTestList = JSON.parse(cookie);
		setCertainCheckboxes();
	} else {
		alert("Sorry, no Data!");
	}
}

function startSelectedTests() {
    $('.progressbar').css('width', '0%').attr('aria-valuenow', 0).html('0/'+selectedTestList.length);
    //testSwitcher(0);
    for (var test in dctests) {
        run_dctest(test, dctests[test]);
    }
    done();
    $('#logWrapper').show();
    $('#testWrapper').hide();
}

function startTests(tests) {
    $('.progressbar').css('width', '0%').attr('aria-valuenow', 0).html('0/'+selectedTestList.length);
    for (var testCategory in tests) {
        for (var testName in tests[testCategory]) {
            var test = tests[testCategory][testName];
            run_dctest(testName, test);
        }
    }
    done();
    $('#logWrapper').show();
    $('#testWrapper').hide();
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
        atest.step(function() {
            attr.test_function(atest, attr.parameters);
        });
    }
}

// Button - start all Tests
$('button#btnTestStartAll').click(function() {
    //setCookie("previous");
    selectedTestList = availableTestList;
    startSelectedTests();
});

// Button - start selected Tests
$('button#btnTestStartSelected').click(function() {
    //generateNewTestList();
    generateNewDcTestList();

    if (selectedDcTests.length === 0) {
        alert("Please choose some tests");
    } else {
        setCookie("previous");
        startTests(selectedDcTests);
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
    //alert("hallo");
    loadCookie("test");
});

// Button - save selection to cookie
$('button#btnTestSave').click(function(){
    generateNewTestList();
    setCookie("test");
});

$('button#btnTestLoadPrevious').click(function(){
    loadCookie("previous");
});

