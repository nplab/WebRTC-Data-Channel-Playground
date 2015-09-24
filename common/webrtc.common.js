

// STUN, TURN Servers
var iceServer = {
	iceServers : [
	{
		urls : 'turn:turn1.nplab.de:3478',
		username: 'tiny',
		credential : 'turner'
	}, {
		urls : 'turn:turn2.nplab.de:3478',
		username: 'tiny',
		credential : 'turner'
	}, {
		urls : 'stun:stun.l.google.com:19302'
	}, {
		urls : 'stun:stun1.l.google.com:19302'
	}, {
		urls : 'stun:stun2.l.google.com:19302'
	}, {
		urls : 'stun:stun3.l.google.com:19302'
	}, {
		urls : 'stun:stun4.l.google.com:19302'
	}]
};

// find and return an IPv4 Address from a given string
function extractIpFromString(string) {
	var pattern = '(?:25[0-5]|2[0-4][0-9]|1?[0-9][0-9]{1,2}|[0-9]){1,}(?:\\.(?:25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}|0)){3}';

	var match = string.match(pattern);
	return match ? match[0] : false;
}

var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription;

// generate a unique-ish string for storage in firebase
function generateSignalingId() {
	return (Math.random() * 10000| 0).toString();
}

if(!browsercheck()) {

}

function browsercheck() {
	try {
    	var pc = new PeerConnection(iceServer);
		var dc = pc.createDataChannel('control');
		return true;

	} catch(err) {
		console.log('Browser does not support WebRTC!');
		$('div.main').html('<div class="alert text-center alert-danger"><b>Your Browser does not support WebRTC!</b></div>');
	    return false;
	}
}
