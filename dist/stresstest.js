/**
 * @author Sven Niehus
 * @version 0.1
 */
var IceCandidate        = window.mozRTCIceCandidate || window.RTCIceCandidate;
var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
var GET_USER_MEDIA = navigator.getUserMedia ? "getUserMedia" :
                     navigator.mozGetUserMedia ? "mozGetUserMedia" :
                     navigator.webkitGetUserMedia ? "webkitGetUserMedia" : "getUserMedia";
var v = document.createElement("video");
var SRC_OBJECT = 'srcObject' in v ? "srcObject" :
                 'mozSrcObject' in v ? "mozSrcObject" :
                 'webkitSrcObject' in v ? "webkitSrcObject" : "srcObject";

//DOM Elements
var textareaTestResults = $('#textareaTestResults');
var formTestConditions = $('#formTestConditions');
var typePeerConnection = new Array(4);
typePeerConnection[0] = $('#typePeerConnectionsConstant');
typePeerConnection[1] = $('#typePeerConnectionsUniformRandom');
typePeerConnection[2] = $('#typePeerConnectionsNonUniformRandom');
typePeerConnection[3] = $('#typePeerConnectionsExponential');
var inputPeerConnections = $('#inputPeerConnections');
var inputPeerConnectionsMax = $('#inputPeerConnectionsMax');
var typeDataChannel = new Array(4);
typeDataChannel[0] = $('#typeDataChannelConstant');
typeDataChannel[1] = $('#typeDataChannelUniformRandom');
typeDataChannel[2] = $('#typeDataChannelNonUniformRandom');
typeDataChannel[3] = $('#typeDataChannelExponential');
var inputDataChannel = $('#inputDataChannel');
var inputDataChannelMax = $('#inputDataChannelMax');
var typeMessageCount = new Array(4);
typeMessageCount[0] = $('#typeMessageCountConstant');
typeMessageCount[1] = $('#typeMessageCountUniformRandom');
typeMessageCount[2] = $('#typeMessageCountNonUniformRandom');
typeMessageCount[3] = $('#typeMessageCountExponential');
var inputMessageCount = $('#inputMessageCount');
var inputMessageCountMax = $('#inputMessageCountMax');
var inputDtlsSrtpKeyAgreement = $('#inputDtlsSrtpKeyAgreement');
var inputRtpDataChannels = $('#inputRtpDataChannels');
var inputMaxRetransmitTime = $('#inputMaxRetransmitTime');
var inputOrdered = $('#inputOrdered');
var inputMessageToSend = $('#inputMessageToSend');
var inputMessageQuantity = $('#inputMessageQuantity');
var buttonStartTest = $('#buttonStartTest');
//DOM Elements end
var br = "&#13;&#10;";

var peerConnectionMode, dataChannelMode, messsageMode;

//Declare variables
var local_dc, local_dc2, remote_dc, remote_dc2, local_pc, remote_pc, messageCount, pcOptions, dataChannelOptions;

// Local ID
var id = "testing";

// ICE Server
var pcConfiguration =
{
    iceServers :
    [
        { url : 'stun:stun.l.google.com:19302'  },
        { url : 'stun:stun1.l.google.com:19302' },
        { url : 'stun:stun2.l.google.com:19302' },
        { url : 'stun:stun3.l.google.com:19302' },
        { url : 'stun:stun4.l.google.com:19302' }
    ]
};

function updateForm()
{
    updateRadioBoxes();
}

function updateRadioBoxes()
{
    if(typePeerConnection[0].prop('checked'))
    {
        inputPeerConnectionsMax.prop('disabled', true);
        inputPeerConnectionsMax.prop('placeholder', '');
        peerConnectionMode = 'con';
    }
    else if(typePeerConnection[1].prop('checked'))
    {
        inputPeerConnectionsMax.prop('disabled', false);
        inputPeerConnectionsMax.prop('placeholder', 'max');
        peerConnectionMode = 'uni';
    }
    else if(typePeerConnection[2].prop('checked'))
    {
        inputPeerConnectionsMax.prop('disabled', false);
        inputPeerConnectionsMax.prop('placeholder', 'max');
        peerConnectionMode = 'nuni';
    }
    else if(typePeerConnection[3].prop('checked'))
    {
        inputPeerConnectionsMax.prop('disabled', true);
        inputPeerConnectionsMax.prop('placeholder', '');
        peerConnectionMode = 'exp';
    }

    if(typeDataChannel[0].prop('checked'))
    {
        inputDataChannelMax.prop('disabled', true);
        inputDataChannelMax.prop('placeholder', '');
        dataChannelMode = 'con';
    }
    else if(typeDataChannel[1].prop('checked'))
    {
        inputDataChannelMax.prop('disabled', false);
        inputDataChannelMax.prop('placeholder', 'max');
        dataChannelMode = 'uni';
    }
    else if(typeDataChannel[2].prop('checked'))
    {
        inputDataChannelMax.prop('disabled', false);
        inputDataChannelMax.prop('placeholder', 'max');
        dataChannelMode = 'nuni';
    }
    else if(typeDataChannel[3].prop('checked'))
    {
        inputDataChannelMax.prop('disabled', true);
        inputDataChannelMax.prop('placeholder', '');
        dataChannelMode = 'exp';
    }

    if(typeMessageCount[0].prop('checked'))
    {
        inputMessageCountMax.prop('disabled', true);
        inputMessageCountMax.prop('placeholder', '');
        messsageMode = 'con';
    }
    else if(typeMessageCount[1].prop('checked'))
    {
        inputMessageCountMax.prop('disabled', false);
        inputMessageCountMax.prop('placeholder', 'max');
        messsageMode = 'uni';
    }
    else if(typeMessageCount[2].prop('checked'))
    {
        inputMessageCountMax.prop('disabled', false);
        inputMessageCountMax.prop('placeholder', 'max');
        messsageMode = 'nuni';
    }
    else if(typeMessageCount[3].prop('checked'))
    {
        inputMessageCountMax.prop('disabled', true);
        inputMessageCountMax.prop('placeholder', '');
        messsageMode = 'exp';
    }
}

/**
 * extract IP from given string
 * @param {string} string   String that the IP is going to be extracted from
 * @return {int} int     extracted IP
 */
function extractIpFromString(string)
{
    var pattern = '(?:25[0-5]|2[0-4][0-9]|1?[0-9][0-9]{1,2}|[0-9]){1,}(?:\\.(?:25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}|0)){3}';
    var match = string.match(pattern);
    return match[0];
}

/**
 * returns an random uniform number between min and max
 * @param {int} min      Minimum number
 * @param {int} max      Maximum number
 * @return {int}
 */
function randomUniform(min, max)
{
     return Math.floor((Math.random() * (max - min + 1 )) + min);
}

/**
 * returns an random non uniform number between min and max
 * @param {int} min      Minimum number
 * @param {int} max      Maximum number
 * @return {int}
 */
function randomNonUniform(min, max)
{
     return Math.round((Math.random() * (max - min + 1)) + min);
}

function randomString(length)
{
    var randString="";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < length; i++)
    {
        randString += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return randString;
}

/**
 * returns an random exponential number
 * @param {int} int
 * @return {int} int     Returns the random exponential number
 */
function randomExponential(expectation)
{
    return Math.round(Math.abs(Math.log(Math.random()) / (1 / expectation)));
}

/**
 * Start the test
 */
function startTest()
{
    textareaTestResults.text("");
    logToTextArea('Test started');
    // Everything back to start
    local_dc = null;
    local_dc2 = null;
    local_pc = null;
    remote_dc = null;
    remote_dc2 = null;
    remote_pc = null;
    dataChannelOptions = null;

    messageCount = null;

    local_dc2 = [];
    remote_dc2 = [];

    switch(peerConnectionMode)
    {
        case 'con':
        {
            var _peerConnections = inputPeerConnections.val();
            console.log("PC Con: " + _peerConnections);
            break;
        }
        case 'uni':
        {
            var _peerConnections = randomUniform(inputPeerConnections.val(), inputPeerConnectionsMax.val());
            console.log("PC Uni: " + _peerConnections);
            break;
        }
        case 'nuni':
        {
            var _peerConnections = randomNonUniform(inputPeerConnections.val(), inputPeerConnectionsMax.val());
            console.log("PC NUni: " + _peerConnections);
            break;
        }
        case 'exp':
        {
            var _peerConnections = randomExponential(inputPeerConnections.val());
            console.log("PC Exp: " + _peerConnections);
            break;
        }
        default:
        {
            var _peerConnections = inputPeerConnections.val();
            console.log("PC Def: " + _peerConnections);
            break;
        }
    }
    logToTextArea("Creating " + _peerConnections + " Peer Connections");

    var _DtlsSrtpKeyAgreement = inputDtlsSrtpKeyAgreement.is(':checked');

    var _maxRetransmitTime = inputMaxRetransmitTime.val();
    var _ordered = inputOrdered.is(':checked');

    var pcOptions =
    {
        optional:
        [
            {DtlsSrtpKeyAgreement: _DtlsSrtpKeyAgreement}
        ]
    };

    var dataChannelOptionds =
    {
        ordered: _ordered,
        maxRetransmitTime: _maxRetransmitTime,
    };

    local_pc = new Array(_peerConnections);
    local_dc = new Array(_peerConnections);
    for(var i = 0; i < _peerConnections; i++)
    {
        local_dc[i] = new Array(_dataChannelsPerPC);
    }

    remote_pc = new Array(_peerConnections);
    remote_dc = new Array(_peerConnections);
    for(var i = 0; i < _peerConnections; i++)
    {
        remote_dc[i] = new Array(_dataChannelsPerPC);
    }

    for (var i=0; i < _peerConnections; i++)
    {
        local_pc[i] = new PeerConnection(pcConfiguration, pcOptions);
        remote_pc[i] = new PeerConnection(pcConfiguration, pcOptions);
        bindPCEvents(i);
        logToTextArea(i + ". PeerConections created");
    };


    switch(messsageMode)
    {
        case 'con':
        {
            messageCount = inputMessageCount.val();
            console.log("MM Con: " + messageCount);
            break;
        }
        case 'uni':
        {
            messageCount = randomUniform(inputMessageCount.val(), inputMessageCountMax.val());
            console.log("MM Uni: " + messageCount);
            break;
        }
        case 'nuni':
        {
            messageCount = randomNonUniform(inputMessageCount.val(), inputMessageCountMax.val());
            console.log("MM NUni: " + messageCount);
            break;
        }
        case 'exp':
        {
            messageCount = randomExponential(inputMessageCount.val());
            console.log("MM Exp: " + messageCount);
            break;
        }
        default:
        {
            messageCount = inputMessageCount.val();
            console.log("MM Def: " + messageCount);
            break;
        }
    }
    logToTextArea("Sending " + messageCount + " Messages");


    for (var i= 0; i < _peerConnections; i++)
    {
        switch(dataChannelMode)
        {
            case 'con':
            {
                var _dataChannelsPerPC = inputDataChannel.val();
                console.log("DC Con: " + _dataChannelsPerPC);
                break;
            }
            case 'uni':
            {
                var _dataChannelsPerPC = randomUniform(inputDataChannel.val(), inputDataChannelMax.val());
                console.log("DC Uni: " + _dataChannelsPerPC);
                break;
            }
            case 'nuni':
            {
                var _dataChannelsPerPC = randomNonUniform(inputDataChannel.val(), inputDataChannelMax.val());
                console.log("DC NUni: " + _dataChannelsPerPC);
                break;
            }
            case 'exp':
            {
                var _dataChannelsPerPC = randomExponential(inputDataChannel.val());
                console.log("DC Exp: " + _dataChannelsPerPC);
                break;
            }
            default:
            {
                var _dataChannelsPerPC = inputDataChannel.val();
                console.log("DC Def: " + _dataChannelsPerPC);
                break;
            }
        }
        logToTextArea("Creating " + _dataChannelsPerPC + " Data Channels for " + i +  ". Peer Connection");
        for(var j=0; j < _dataChannelsPerPC; j++)
        {
            remote_dc[i][j] = remote_pc[i].createDataChannel("remote_pc_" + i + "_remote_dc_" + j);
            logToTextArea("remote_pc_" + i + "_remote_dc_" + j + " created");
            local_dc[i][j] = local_pc[i].createDataChannel("local_pc_" + i + "_local_dc_" + j, { reliable: true});
            logToTextArea("local_pc_" + i + "_local_dc_" + j + " created");
            bindDCEvents(i, j);
        }
        createOfferAnswer(i);
    }
    createLocalConnections(_peerConnections, _dataChannelsPerPC);
    createRemoteConnections(_peerConnections, _dataChannelsPerPC);
}

/**
 * sendMessages over all dataChannels
 * @param {int} messageCount
 * @param {int} index
 * @param {int} index
 * @param {int} local/remote (0/1)
 */
function sendMessages(messageCount, i, j, k)
{
    if(k == 0)
    {
        for(var m = 0; m < messageCount; m++)
        {
            local_dc[i][j].send(randomString(100));
        }
    }
    else if(k == 1)
    {
        for(var m = 0; m < messageCount; m++)
        {
            remote_dc[i][j].send(randomString(100));
        }
    }
}

/**
 * sendMessages over all dataChannels
 * @param {int} messageCount
 * @param {int} index
 * @param {int} local/remote (0/1)
 */
function sendMessages2(messageCount, i, j)
{
    if(j == 0)
    {
        for(var m = 0; m < messageCount; m++)
        {
            local_dc2[i].send(randomString(100));
        }
    }
    else if(j == 1)
    {
        for(var m = 0; m < messageCount; m++)
        {
            remote_dc2[i].send(randomString(100));
        }
    }
}

/**
 * Bind events to given peer connection
 */
function bindPCEvents(i)
{
    local_pc[i].oniceconnectionstatechange =
    function()
    {
        console.log(i + ". LocalPC Connection State: " + local_pc[i].iceConnectionState);
    };
    remote_pc[i].oniceconnectionstatechange =
    function()
    {
        console.log(i + ". RemotePC Connection State: " + remote_pc[i].iceConnectionState);
    };
    remote_pc[i].ondatachannel = function (evt)
    {
        bindDC2Events((remote_dc2.push(evt.channel) - 1), 1);
    };
    local_pc[i].ondatachannel = function (evt)
    {
        bindDC2Events((local_dc2.push(evt.channel) - 1), 0);
    };
}


/**
 * Bind events to given data channel
 * @param {int} index
 * @param {int} local/remote (0/1)
 */
function bindDC2Events(i, j)
{
    if(j == 0)
    {
        local_dc2[i].onopen = function ()
        {
            //local_dc2[i].send("Hi Local!");
            sendMessages2(messageCount, i, 0);
        };
        local_dc2[i].onmessage = function (e)
        {
            var msg = e.data;
            console.log("Message recieved: " + msg);
            logToTextArea(i + ". PC " + j + ". Local DC Message (from Remote) recieved: " + msg);
        };
        local_dc2[i].onError = function (e)
        {
            console.log("Datachannel Error: " + err);
        };
    }
    else if(j == 1)
    {
        remote_dc2[i].onopen = function ()
        {
            //remote_dc2[i].send("Hi Remote!");
            sendMessages2(messageCount, i, 1);
        };
        remote_dc2[i].onmessage = function (e)
        {
            var msg = e.data;
            console.log("Message recieved: " + msg);
            logToTextArea(i + ". PC " + j + ". Remote DC Message (from Remote) recieved: " + msg);
        };
        remote_dc2[i].onError = function (e)
        {
            console.log("Datachannel Error: " + err);
        };
    }
    else { return null; }
}

/**
 * Bind events to given data channel
 * @param {int} index
 * @param {int} index
 */
function bindDCEvents (i, j)
{
    remote_dc[i][j].onopen = function ()
    {
        logToTextArea(i + ". PC " + j + ". Local DC opened");
        //remote_dc[i][j].send("Hi Local!");
        sendMessages(messageCount, i, j, 1);
    };
    remote_dc[i][j].onclose = function ()
    {
        console.log("Channel closed");
        logToTextArea(i + ". PC " + j + " Remote DC closed!");
    };
    remote_dc[i][j].onmessage = function (e)
    {
        var msg = e.data;
        console.log("Message recieved: " + msg);
        logToTextArea(i + ". PC " + j + ". DC Message recieved: " + msg);
    };
    remote_dc[i][j].onError = function (e)
    {
        console.log("Datachannel Error: " + err);
    };
    //---------
    local_dc[i][j].onopen = function ()
    {
        logToTextArea(i + ". PC " + j + ". Local DC opened");
        //local_dc[i][j].send("Hi Remote!");
        sendMessages(messageCount, i, j, 0);
    };
    local_dc[i][j].onclose = function ()
    {
        console.log("Channel closed");
        logToTextArea(i + ". PC " + j + " Local DC closed!");
    };
    local_dc[i][j].onmessage = function (e)
    {
        var msg = e.data;
        console.log("Message recieved: " + msg);
        logToTextArea(i + ". PC " + j + ". DC Message recieved: " + msg);
    };
    local_dc[i][j].onError = function (e)
    {
        console.log("Datachannel Error: " + err);
    };
}


/**
 * Create IceCandidate Event Handler for given PeerConnection
 * @param {int} index
 */
function createRemoteOnIceCandidate(i)
{
    logToTextArea("Creating onIceCandidate for " + i + ". RemotePeerConnection");
    remote_pc[i].onicecandidate = function (ev)
    {
        if(!ev.candidate)
        {
            logToTextArea("(" + i + ". RemotePC) All ICE Candidates got");
        }
        else
        {
            local_pc[i].addIceCandidate(new IceCandidate(ev.candidate),
            function()
            {
                logToTextArea("(" +i + ". Local PC) ICE Candidate: " + extractIpFromString(ev.candidate.candidate));
            },
            function(err)
            {
               console.log("Error while adding Ice Candidate: " + err.toString());
            });
        }
    };
    logToTextArea("onIceCandidate for " + i + ". PeerConnection created");
}

/**
 * Create OnNegotiationNeeded Event Handler for given PeerConnection
 * @param {Objec} index
 */
function createRemoteOnNegotiationNeeded(i)
{
    logToTextArea("Creating onNegotiationNeeded for " + i + ". RemotePeerConnection");
    remote_pc[i].onnegotiationneeded = function()
    {
        console.log("Remote Neogation Needed");
        //createAnswer(i);
    };
    logToTextArea("onNegotiationNeeded for " + i + ". RemotePeerConnection created");
}

/**
 * Create remote DataChannels, PeerConnections, IceCandidate Handler
 * @param {int} peerConnections
 * @param {int} dataChannelsPerlocalPeerConnection
 */
function createRemoteConnections(peerConnections, dataChannelsPerPC)
{
    for (var i=0; i < peerConnections; i++)
    {
        createRemoteOnIceCandidate(i);
        //createAnswer(i);
        //createRemoteOnNegotiationNeeded(i);
    };
}

/**
 * Create IceCandidate Event Handler for given PeerConnection
 * @param {int} index
 */
function createLocalOnIceCandidate(i)
{
    logToTextArea("Creating onIceCandidate for " + i + ". LocalPeerConnection");
    local_pc[i].onicecandidate = function (ev)
    {
        if(!ev.candidate)
        {
            logToTextArea("(" + i + ". Local PC) All ICE Candidates got");
        }
        else
        {
            remote_pc[i].addIceCandidate(new IceCandidate(ev.candidate),
            function()
            {
                logToTextArea("(" +i + ". RemotePC) ICE Candidate: " + extractIpFromString(ev.candidate.candidate));
            },
            function(err)
            {
               console.log("Error while adding Remote Ice Candidate: " + err.toString());
            });
        }
    };
    logToTextArea("onIceCandidate for " + i + ". LocalPeerConnection created");
}

/**
 * Create OnNegotiationNeeded Event Handler for given PeerConnection
 * @param {Objec} index
 */
function createLocalOnNegotiationNeeded(i)
{
    logToTextArea("Creating onNegotiationNeeded for " + i + ". LocalPeerConnection");
    local_pc[i].onnegotiationneeded = function()
    {
        console.log("Local Neogation Needed");
        createOfferAnswer(i);
    };
    logToTextArea("onNegotiationNeeded for " + i + ". LocalPeerConnection created");
}

/**
 * Generic errorHandler
 */
function errorHandler (err)
{
    logToTextArea("Generic Error: " + err);
}
/**
 * Generic successHandler
 */
function successHandler ()
{
}

/**
 * Create offer for given PeerConnection
 * @param {Objec} index
 */
function createOfferAnswer(i)
{
    logToTextArea("Creating offer for " + i + ". LocalPeerConnection");
    local_pc[i].createOffer(function (description)
    {
        local_pc[i].setLocalDescription(description, successHandler, errorHandler);
        remote_pc[i].setRemoteDescription(description, successHandler, errorHandler);
        //logToTextArea("LocalDescription: " + br + description.sdp);

        remote_pc[i].createAnswer(function (description)
        {
            remote_pc[i].setLocalDescription(description, successHandler, errorHandler);
            local_pc[i].setRemoteDescription(description, successHandler, errorHandler);
            //logToTextArea("RemoteDescription: " + br + description.sdp);
        }, errorHandler, constraints);
    }, errorHandler, constraints);

    var constraints =
    {
        mandatory:
        {
            OfferToReceiveAudio: false,
            OfferToReceiveVideo: false
        }
    };
    logToTextArea("offer for " + i + ". PeerConnection created");
}

/**
 * Create local DataChannels, PeerConnections, IceCandidate Handler and Offers
 * @param {int} peerConnections
 * @param {int} dataChannelsPerlocalPeerConnection
 */
function createLocalConnections(peerConnections, dataChannelsPerPC)
{
    for (var i=0; i < peerConnections; i++)
    {
        createLocalOnIceCandidate(i);
        //createLocalOnNegotiationNeeded(i);
    };
}

/**
 * Add a message to the textareaTestResults
 * @param {int} msg
 */
function logToTextArea(msg)
{
    var now = (window.performance.now() / 1000).toFixed(3);
    textareaTestResults.append(now + " " +msg + "&#13;&#10");
    textareaTestResults.scrollTop(textareaTestResults[0].scrollHeight);
}
