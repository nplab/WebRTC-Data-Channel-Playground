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

// Shows extra test information
var logWrapper = document.getElementById("logWrapper");
var logShort = document.getElementById("logShort");
var logLong = document.getElementById("logLong");
var progressBar = document.getElementById("progressBar");
// Buttons
var btnShowLog = document.getElementById("btnShowLog");
var btnShowResults = document.getElementById("btnShowResults");
var logStart = false;
var time = 0;

// Hide Logging Information
logWrapper.hidden = true;
logLong.hidden = true;

// Logging information about tests
function logWrite(text) {
    if (!logStart)
        logStart = performance.now() / 1000;
    time = ((performance.now() / 1000) - logStart).toFixed(3);
    logShort.innerHTML = time + ": " + text;
    logLong.innerHTML += time + ": " + text + "<br>";
    console.log(text);
}

btnShowLog.onclick = function() {
    logLong.hidden = !logLong.hidden;
};

btnShowResults.onclick = function(){
    // show the results in a table for logging or something else..
    var res = window.open('Test results','Test results','width=800, height=600');
    //res.document.open().write(testCompleteResults).close();
    res.document.open().write(testCompleteResults);
};
