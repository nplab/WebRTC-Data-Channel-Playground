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
var selectedTestList = [];


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
        if ( typeof obj[m] === "function") {
            if (m.search("testDC") != -1) {
                tests.push(m);
            }
        }
    }
    $('#badgeTestcount').html(tests.length);
    availableTestList = tests;
}

// Create the table with all available tests
function fillTestList() {
    var testlistHTML = "<tr>";
    
    $.each(availableTestList,function(key,val) {
        testlistHTML += "<td><label><input type='checkbox' name='test' value='" + val + "'> " + val + "</label></td>";
        // new row every 5 cols
        if (key % 5 == 4) {
            testlistHTML += "</tr><tr>";
        }
    });
    testlistHTML += "</tr></table></form>";
    
    $('#testlist').append(testlistHTML);
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

// check the tests from selected tests (eg loaded from cookies)
function setCertainCheckboxes(){
    $("#testlist INPUT[type='checkbox']").prop('checked',false);
    $.each(selectedTestList,function(key,val) {
        $('#testlist input:checkbox[value='+val+']').prop('checked',true);
     });
       
}

function setCookie(name) {
   	$.cookie(name, JSON.stringify(selectedTestList));
    return true;
}

function loadCookie(name) {
	var cookie = $.cookie(name);
	if(cookie != null) {
		selectedTestList = JSON.parse($.cookie(name));
		setCertainCheckboxes();
	} else {
		alert("Sorry, no Data!");
	}
    
}

function startSelectedTests() {
    $('.progressbar').css('width', '0%').attr('aria-valuenow', 0).html('0/'+selectedTestList.length); 
    testInformation.innerHTML += "Run " + availableTestList.length + " tests!";
    testSwitcher(0);
    $('#logWrapper').show();
    $('#testWrapper').hide();
    
}

// Button - start all Tests
$('button#btnTestStartAll').click(function() {
    //setCookie("previous");
    selectedTestList = availableTestList;
    startSelectedTests();
});

// Button - start selected Tests
$('button#btnTestStartSelected').click(function() {
    generateNewTestList();
    
    if (selectedTestList.length == 0) {
        alert("Please choose some tests");
    } else {
        setCookie("previous");
        startSelectedTests();
    }
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

