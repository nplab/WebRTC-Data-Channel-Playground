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

var availableTestList = null;
var checkboxes = document.getElementsByName("test");
var testList = document.getElementById("testList");
var testInformation = document.getElementById("testInformation");
// Wrapper to hide and show test checkboxes and buttons informations
var testWrapper = document.getElementById("testWrapper");
// Buttons
var btnTestStart = document.getElementById("btnTestStart");
var btnTestStartAll = document.getElementById("btnTestStartAll");
var btnTestUnselect = document.getElementById("btnTestUnselect");
var btnTestSelectOposite = document.getElementById("btnTestSelectOposite");
var btnTestSave = document.getElementById("btnTestSave");
var btnTestLoad = document.getElementById("btnTestLoad");
var btnTestLoadPrevious = document.getElementById("btnTestLoadPrevious");

// Run the next test
function testSwitcher(count) {
    if (count < availableTestList.length) {
        try {
            eval(availableTestList[count] + "()");
        } catch(err) {
            console.log("Error while eval function " + availableTestList[count], err);
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
    availableTestList = tests;
}

// Create the table with all available tests
function fillTestList() {
    var checkboxHTML = "";
    checkboxHTML = '<form name="testListForm" action=""><table border="0"><tr>';
    for (var m in availableTestList) {
        checkboxHTML += "<td><input type='checkbox' name='test' value='" + availableTestList[m] + "'> " + availableTestList[m] + "</td>";
        // make list with 5 elements
        m++;
        if (m % 5 == 0) {
            checkboxHTML += "</tr><tr>";
        }
    }
    checkboxHTML += "</tr></table></form>";
    // Show and list all available Tests
    testList.innerHTML += availableTestList.length + " tests available";
    testList.innerHTML += checkboxHTML;
}

// Create new TestList with only selected Tests
function generateNewTestList() {
    var tests = [];
    var count = 0;
    for (var i = 0; i < availableTestList.length; i++) {
        if (document.testListForm.elements[i].checked) {
            tests[count] = availableTestList[i];
            count++;
        }
    }
    return tests;
}


function setAllCheckboxes(state) {
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = state;
    }
}

function setCertainCheckboxes(tests){
    setAllCheckboxes(false);
        for (var i = 0; i < (tests.length - 1); i++) {
            checkboxes[tests[i]].checked = true;
        }
}

function setCookie(name) {
    var cook;
    cook = name + "=";
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked)
            cook += i + "#";
    }
    cook += name;
    document.cookie = cook;
    console.log(cook);
    return true;
}

function loadCookie(name) {
    if (document.cookie.search(name) != -1) {
        var i = 0;
        var search = name + "=";
        var end, begin, result;
        begin = document.cookie.indexOf(search) + search.length;
        end = document.cookie.lastIndexOf(name);
        result = document.cookie.slice(begin, end);
        if (result.length == 0)
            return false;
        return result.split("#");
    } else {
        return false;
    }
}

function startSelectedTests() {
    progressBar.max = availableTestList.length;
    testInformation.innerHTML += "Run " + availableTestList.length + " tests!";
    testSwitcher(0);
    testWrapper.hidden = true;
    logWrapper.hidden = false;
}

btnTestStart.onclick = function() {
    if (generateNewTestList() == "") {
        alert("Please choose some tests");
    } else {
        availableTestList = generateNewTestList();
        setCookie("previous");
        startSelectedTests();
    }

};

btnTestStartAll.onclick = function() {
    setCookie("previous");
    startSelectedTests();

};

btnTestSelectOposite.onclick = function() {
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = !checkboxes[i].checked;
    }
};

btnTestUnselect.onclick = function() {
    setAllCheckboxes(false);
};

btnTestLoad.onclick = function() {
    var tests = loadCookie("test");
    if (tests) {
        setCertainCheckboxes(tests);
    }else{      
        alert("No saved tests found");
    }
};

btnTestSave.onclick = function() {
    setCookie("test");
};

btnTestLoadPrevious.onclick = function() {
    var tests = loadCookie("previous");
    if (tests) {
        setCertainCheckboxes(tests);
    }else{
        alert("No previous tests found");
    }
};

