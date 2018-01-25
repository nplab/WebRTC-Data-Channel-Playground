

// STUN, TURN Servers
var iceServer = {
	iceServers : [
	{
		urls : 'stun:stun.l.google.com:19302'
	}, {
		urls : 'stun:stun1.l.google.com:19302'
	}, {
		urls		: "turn:bsd3.nplab.de",
		credential	: "nplab",
		username	: "nplab"
	}]
};

// find and return an IPv4 Address from a given string
// taken from: https://gist.github.com/syzdek/6086792
function extractIpFromString(string) {
	var match;
	var pattern4 = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/
	var pattern6 = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/

	if(match = string.match(pattern4)) {
		return match[0];
	} else if(match = string.match(pattern6)) {
		return match[0];
	} else {
		return false;
	}
}

// generate a unique-ish string for storage in firebase
function generateSignalingId() {
	return (Math.random() * 10000|0).toString();
}

// check WebRTC capabilities of the browser
function browsercheck() {
	try {
		var pc = new RTCPeerConnection();
		var dc = pc.createDataChannel('control');
		return true;
	} catch(err) {
		console.log('Browser does not support WebRTC!');
		$('div.main').html('<div class="alert text-center alert-danger"><b>Browser does not support WebRTC!</b></div>');
		return false;
	}
}
