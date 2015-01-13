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

var msi= "Microsoft Internet Explorer", chrome =  "Chrome", firefox = "Firefox", opera = "Opera", safari = "Safari"; 
var checkImagePath = '<img alt="image" height="14px" src="pics/check.png">';
var errorImagePath = '<img alt="image" height="14px" src="pics/error.png">';  


// If the Element browserVersion is available fill it
var browserInformation = document.getElementById("browserInformation");
if(browserInformation != null)
    browserInformation.innerHTML = getBrowserInformation();     

// Indicates the browser version and shows if the version is WebRTC ready
function getBrowserInformation()
{
    var navigatorAgent = navigator.userAgent;
    var browserName  = navigator.appName;
    var fullVersion  = '' + parseFloat(navigator.appVersion); 
    var nameOffset,versionOffset, trim;
    var browserMessage = "";
    var webRTCMessage = "<td>To open console: Press 'SHIFT-CTRL-I' <br/>";
    var errorMessage = "<strong><br/>Please use Chrome, Opera or Firefox - It is recommend to use the newest Version.</strong>";
    
    
    // Opera, the version is after "Opera" or "Version"
    if ( (versionOffset = navigatorAgent.indexOf("OPR")) != -1) {
     browserName = opera;
     webRTCMessage += "WebRTC Information: opera://webrtc-internals </td></tr></table>";
     fullVersion = navigatorAgent.substring(versionOffset + 4);
     if ((versionOffset= navigatorAgent.indexOf("Version")) != -1) 
       fullVersion = navigatorAgent.substring(versionOffset + 8);
    }    
    // IE, the version is after "MSIE" in userAgent
    else if ((navigatorAgent.indexOf(".NET")) != -1) {
     browserName = msi;
     versionOffset = navigatorAgent.indexOf("rv:");
     fullVersion = navigatorAgent.substring(versionOffset + 3);
    }
    // Chrome, the  version is after "Chrome" 
    else if ((versionOffset = navigatorAgent.indexOf("Chrome")) != -1) {
     browserName = chrome;
     webRTCMessage += "WebRTC Information: chrome://webrtc-internals </td></tr></table>";
     fullVersion = navigatorAgent.substring(versionOffset + 7);
    }
    // Firefox, the version is after "Firefox" 
    else if ((versionOffset = navigatorAgent.indexOf("Firefox")) != -1) {
     browserName = firefox;
     webRTCMessage += "WebRTC Information: about:webrtc </td></tr></table>";
     fullVersion = navigatorAgent.substring(versionOffset + 8);
    }
    // Safari, the  version is after "Safari" or  "Version" 
    else if ((versionOffset = navigatorAgent.indexOf("Safari")) != -1) {
     browserName = safari;
     fullVersion = navigatorAgent.substring(versionOffset + 7);
     if ((versionOffset = navigatorAgent.indexOf("Version")) != -1) 
       fullVersion = navigatorAgent.substring(versionOffset + 8);
       fullVersion += "It is recommend to use Chrome, Opera or Firefox.";
    }else{
        browserName =  -1;
    } 
    
    // trim the  string if " " is present  
    if ((trim=fullVersion.indexOf(" "))!=-1){
       fullVersion=fullVersion.substring(0,trim);
       }
    
    if(browserName == -1)
    {// Error not supported Browser
       browserMessage =  "<strong>Browser: "  + errorImagePath +'<br />'+errorMessage;
    }else if(browserName == msi || browserName == safari){ // Error MSI or Safari
        browserMessage = "<strong>Browser: "  + errorImagePath +'<br />'+ browserName + "-Version " + fullVersion  + errorMessage+ "</strong>";
    } else{
       if(!(window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.RTCPeerConnection)){// Right Browser but to old Version
             browserMessage = '<table ><tr><td>Browser: ' + errorImagePath +'<br/>' + browserName + "-Version " + fullVersion  + "<br /> Please use the newest Version - Your Browser is not up to date ;)" + "</td></tr></table>";
       }else{// WebRTC Browser
           browserMessage = '<table ><tr><td>Browser: ' + checkImagePath +'<br/>' +  browserName + "-Version " + fullVersion  +"</td>";  
           browserMessage += webRTCMessage;
       }
    }
    return browserMessage;
}

