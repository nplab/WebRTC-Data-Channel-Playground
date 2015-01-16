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
 * Returns current System Time: HH:MM:SS,ms 
 */
function getCurrentTime() {
    var now = new Date();
    var hour = now.getHours();
    var min = now.getMinutes();
    var sec = now.getSeconds();
    var ms = now.getMilliseconds();
    if (hour < 10) {
        hour = "0" + hour;
    }
    if (min < 10) {
        min = "0" + min;
    }
    if (sec < 10) {
        sec = "0" + sec;
    }
    return hour + ":" + min + ":" + sec+","+ms;
}

/**
 * Returns a string
 * @param {Object} size: returns a string:  2^size Byte (= letters)
 */
function generateData(size) {
    var s = "-";
    for (var i = 0; i < size; i++) {
        s += s;
    }
    return s;
}

/**
 * Retruns a String
 * @param {Object} size: returns a string with length size
 */
function generateLinearData(size) {
    var s = "";
    for (var i = 0; i < size; i++) {
        s += "s";
    }
    return s;
}

function generateLinearDataChar(character, length) {
	var string = "";
	for(var i=0; i < length; i++) {
		string += character;
	}
	
	return string;
}

/**
 * Returns the Byte count from a string 
 * @param {Object} str
 */
function byteCount(str) {
    return encodeURI(str).split(/%..|./).length - 1;
}

/**
 * Check for available readyStates in a String, returns the Objekt 
 * @param {Object} str
 */
function checkForReadyStates(str){
    var check = new Array();
    var values = ["connecting", "open", "closing", "closed"];
    var returnValue = { missed: false,message: ""};   
    for(var i = 0; i< values.length; i++){        
        if(str.search(values[i]) == -1){
            returnValue.message += " '" +values[i]+"'";
            returnValue.missed = true;
        }        
    }
    if(returnValue.missed == true)
        returnValue.message =  "Missed readyState" + returnValue.message;   
    return returnValue;
}

function getBrowserInformation() {
	if(window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.RTCPeerConnection){
		$('#browserInformation').addClass('alert-success');
	} else {
		$('#browserInformation').addClass('alert-danger');
	}
		$('#browserInformation').append(navigator.userAgent);        
}


















