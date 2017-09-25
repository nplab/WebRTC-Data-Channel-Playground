var IceCandidate        = window.mozRTCIceCandidate || window.RTCIceCandidate;
var PeerConnection      = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var SessionDescription  = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

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

var typeMessageChars = new Array(4);
typeMessageChars[0] = $('#typeMessageCharsConstant');
typeMessageChars[1] = $('#typeMessageCharsUniformRandom');
typeMessageChars[2] = $('#typeMessageCharsNonUniformRandom');
typeMessageChars[3] = $('#typeMessageCharsExponential');
var inputMessageChars = $('#inputMessageChars');
var inputMessageCharsMax = $('#inputMessageCharsMax');

var inputDtlsSrtpKeyAgreement = $('#inputDtlsSrtpKeyAgreement');
var inputRtpDataChannels = $('#inputRtpDataChannels');
var inputMaxRetransmitTime = $('#inputMaxRetransmitTime');
var inputOrdered = $('#inputOrdered');
var inputMessageToSend = $('#inputMessageToSend');
var inputMessageQuantity = $('#inputMessageQuantity');
var buttonStartTest = $('#buttonStartTest');

var tdSendMessages = $('#tdSendMessages');
var tdRecievedMessages = $('#tdRecievedMessages');
var tdPercentMessages = $('#tdPercentMessages');
var tdStatusMessages = $('#tdStatusMessages');

var tdChannelsCreated = $('#tdChannelsCreated');
var tdChannelsOpened = $('#tdChannelsOpened');
var tdChannelsPercent = $('#tdChannelsPercent');
var tdChannelsStatus = $('#tdChannelsStatus');

var tdPCCreated = $('#tdPCCreated');
var tdPCEtablished = $('#tdPCEtablished');
var tdPCPercent = $('#tdPCPercent');
var tdPCStatus = $('#tdPCStatus');

var inputSettings = $('#inputSettings');

//DOM Elements end
var br = "&#13;&#10;";

//Declare variables
var availableSettings,
    local_dc,
    local_dc2,
    remote_dc,
    remote_dc2,
    local_pc,
    remote_pc,
    messageCount,
    peerConnections,
    dataChannelsPerPC,
    messagesRecieved,
    pcOptions,
    dataChannelOptions,
    peerConnectionMode,
    dataChannelMode,
    messsageMode,
    messageCharMode,
    messagesSent,
    messagesRecieved,
    channelsCreated,
    channelsOpened,
    peerConnectionsCreated,
    peerConnectionsEtablished,
    updateTimer,
    settings;

// Local ID
var id = "testing";

$(function() {
	loadSettings();
});

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

Object.size = function(obj)
{
    var size = 0, key;
    for (key in obj)
    {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function saveSetting()
{
    var name,
        pcType, pcMin, pcMax,
        dcType, dcMin, dcMax,
        meType, meMin, meMax,
        chType, chMin, chMax;

    switch(peerConnectionMode)
    {
        case 'con':
        {
            pcType = 0;
            break;
        }
        case 'uni':
        {
            pcType = 1;
            break;
        }
        case 'nuni':
        {
            pcType = 2;
            break;
        }
        case 'exp':
        {
            pcType = 3;
            break;
        }
        default:
        {
            pcType = 4;
            break;
        }
    }
    switch(dataChannelMode)
    {
         case 'con':
        {
            dcType = 0;
            break;
        }
        case 'uni':
        {
            dcType = 1;
            break;
        }
        case 'nuni':
        {
            dcType = 2;
            break;
        }
        case 'exp':
        {
            dcType = 3;
            break;
        }
        default:
        {
            dcType = 4;
            break;
        }
    }
    switch(messsageMode)
    {
         case 'con':
        {
            meType = 0;
            break;
        }
        case 'uni':
        {
            meType = 1;
            break;
        }
        case 'nuni':
        {
            meType = 2;
            break;
        }
        case 'exp':
        {
            meType = 3;
            break;
        }
        default:
        {
            meType = 4;
            break;
        }
    }
    switch(messageCharMode)
    {
         case 'con':
        {
            chType = 0;
            break;
        }
        case 'uni':
        {
            chType = 1;
            break;
        }
        case 'nuni':
        {
            chType = 2;
            break;
        }
        case 'exp':
        {
            chType = 3;
            break;
        }
        default:
        {
            chType = 4;
            break;
        }
    }

    name = inputSettings.val();

    pcMin = inputPeerConnections.val();
    pcMax = inputPeerConnectionsMax.val();

    dcMin = inputDataChannel.val();
    dcMax = inputDataChannelMax.val();

    meMin = inputMessageCount.val();
    meMax = inputMessageCountMax.val();

    chMin = inputMessageChars.val();
    chMax = inputMessageCharsMax.val();
    settings.push(
    	{"0":name,
    	 "1":[pcType, pcMin, pcMax],
    	 "2":[dcType, dcMin, dcMax],
    	 "3":[meType, meMin, meMax],
    	 "4":[chType, chMin, chMax]});
    saveSettings();
}
function saveSettings()
{
    localStorage['stresstestSettings'] = JSON.stringify(settings);
}

function loadSetting()
{
    var setting = inputSettings.val();
    var settingNr;
    var found = false;
    for(var i = 0; i < Object.size(settings); i++)
    {
        if(settings[i][0] == setting)
        {
            found = true;
            settingNr = i;
        }
    }
    if(!found)
    {
        alert("Setting not found!");
        return;
    }
    for(var i = 0; i < 4; i++)
    {
        typePeerConnection[i].prop('checked', false);
        typeDataChannel[i].prop('checked', false);
        typeMessageCount[i].prop('checked', false);
        typeMessageChars[i].prop('checked', false);
    }
    typePeerConnection[settings[settingNr][1][0]].prop('checked', true);
    typeDataChannel[settings[settingNr][2][0]].prop('checked', true);
    typeMessageCount[settings[settingNr][3][0]].prop('checked', true);
    typeMessageChars[settings[settingNr][4][0]].prop('checked', true);

    inputPeerConnections.val(settings[settingNr][1][1]);
    inputPeerConnectionsMax.val(settings[settingNr][1][2]);

    inputDataChannel.val(settings[settingNr][2][1]);
    inputDataChannelMax.val(settings[settingNr][2][2]);

    inputMessageCount.val(settings[settingNr][3][1]);
    inputMessageCountMax.val(settings[settingNr][3][2]);

    inputMessageChars.val(settings[settingNr][4][1]);
    inputMessageCharsMax.val(settings[settingNr][4][2]);
}

function loadSettings()
{
    var datalistSettings = $('#datalistSettings');
    try
    {
        settings = JSON.parse(localStorage['stresstestSettings']);
    }
    catch (e)
    {
        settings = [
                        {"0":'Standard', "1":[0,5,null], "2":[1,5,10], "3":[2,5,10], "4":[3,5,null]}
                   ];
        settings = JSON.stringify(settings);
        settings = JSON.parse(settings);
        saveSettings();
    }
    for (var i=0; i < Object.size(settings); i++)
    {
        datalistSettings.append("<option>" + settings[i][0] +"</option>");
    }

}



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

    if(typeMessageChars[0].prop('checked'))
    {
        inputMessageCharsMax.prop('disabled', true);
        inputMessageCharsMax.prop('placeholder', '');
        messageCharMode = 'con';
    }
    else if(typeMessageChars[1].prop('checked'))
    {
        inputMessageCharsMax.prop('disabled', false);
        inputMessageCharsMax.prop('placeholder', 'max');
        messageCharMode = 'uni';
    }
    else if(typeMessageChars[2].prop('checked'))
    {
        inputMessageCharsMax.prop('disabled', false);
        inputMessageCharsMax.prop('placeholder', 'max');
        messageCharMode = 'nuni';
    }
    else if(typeMessageChars[3].prop('checked'))
    {
        inputMessageCharsMax.prop('disabled', true);
        inputMessageCharsMax.prop('placeholder', '');
        messageCharMode = 'exp';
    }
}

function updateStatistics()
{
    tdRecievedMessages.text(messagesRecieved);
    tdSendMessages.text(messagesSent);

    tdChannelsCreated.text(channelsCreated);
    tdChannelsOpened.text(channelsOpened);

    tdPCCreated.text(peerConnectionsCreated);

    var messagesPercent = ((messagesRecieved / messagesSent) * 100).toFixed(3);
    var channelsPercent = ((channelsOpened / channelsCreated) * 100).toFixed(3);
    var pcPercent;

    if (!(channelsCreated % (peerConnectionsCreated * 2 * dataChannelsPerPC))
        ||(peerConnectionsEtablished > peerConnectionsCreated)
        ||(peerConnectionsCreated / peerConnectionsEtablished) == 2)
    {
        tdPCEtablished.text(peerConnectionsCreated);
        pcPercent = (100).toFixed(3);
    }
    else
    {
        tdPCEtablished.text(peerConnectionsEtablished);
        pcPercent = ((peerConnectionsEtablished / peerConnectionsCreated) * 100).toFixed(3);
    }


    tdPercentMessages.text(messagesPercent);
    tdChannelsPercent.text(channelsPercent);
    tdPCPercent.text(pcPercent);

    if(messagesPercent == 100)
    {
        tdStatusMessages.html("<span class='glyphicon glyphicon-ok' aria-hidden='true'style='color: green;'></span>");
    }
    else
    {
        tdStatusMessages.html("<span class='glyphicon glyphicon-remove' aria-hidden='true' style='color: red;'></span>");
    }

    if(channelsPercent == 100)
    {
        tdChannelsStatus.html("<span class='glyphicon glyphicon-ok' aria-hidden='true'style='color: green;'></span>");
    }
    else
    {
        tdChannelsStatus.html("<span class='glyphicon glyphicon-remove' aria-hidden='true' style='color: red;'></span>");
    }

    if(pcPercent == 100)
    {
        tdPCStatus.html("<span class='glyphicon glyphicon-ok' aria-hidden='true'style='color: green;'></span>");
    }
    else
    {
        tdPCStatus.html("<span class='glyphicon glyphicon-remove' aria-hidden='true' style='color: red;'></span>");
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
    console.log("Test started!");
    clearInterval(updateTimer);
    updateTimer = setInterval(function() { updateStatistics(); }, 500);
    // Everything back to start
    local_dc = null;
    local_dc2 = null;
    local_pc = null;
    remote_dc = null;
    remote_dc2 = null;
    remote_pc = null;
    dataChannelOptions = null;

    local_dc2 = [];
    remote_dc2 = [];

    messageCount = null;
    peerConnections = null;
    dataChannelsPerPC = null;

    messagesRecieved = 0;
    messagesSent = 0;

    channelsCreated = 0;
    channelsOpened = 0;

    peerConnectionsCreated = 0;
    peerConnectionsEtablished = 0;

    switch(peerConnectionMode)
    {

        case 'con':
        {
            peerConnections = inputPeerConnections.val();
            console.log("PC Con: " + peerConnections);
            break;
        }
        case 'uni':
        {
            peerConnections = randomUniform(inputPeerConnections.val(), inputPeerConnectionsMax.val());
            console.log("PC Uni: " + peerConnections);
            break;
        }
        case 'nuni':
        {
            peerConnections = randomNonUniform(inputPeerConnections.val(), inputPeerConnectionsMax.val());
            console.log("PC NUni: " + peerConnections);
            break;
        }
        case 'exp':
        {
            peerConnections = randomExponential(inputPeerConnections.val());
            console.log("PC Exp: " + peerConnections);
            break;
        }
        default:
        {
            peerConnections = inputPeerConnections.val();
            console.log("PC Def: " + peerConnections);
            break;
        }
    }

    var _DtlsSrtpKeyAgreement = inputDtlsSrtpKeyAgreement.is(':checked');

    var _maxRetransmitTime = inputMaxRetransmitTime.val();
    var _ordered = inputOrdered.is(':checked');

    var pcOptions =
    {
        optional:
        [
        ]
    };

    var dataChannelOptionds =
    {
    };

    local_pc = new Array(peerConnections);
    local_dc = new Array(peerConnections);
    for(var i = 0; i < peerConnections; i++)
    {
        local_dc[i] = new Array(dataChannelsPerPC);
    }

    remote_pc = new Array(peerConnections);
    remote_dc = new Array(peerConnections);
    for(var i = 0; i < peerConnections; i++)
    {
        remote_dc[i] = new Array(dataChannelsPerPC);
    }

    for (var i=0; i < peerConnections; i++)
    {
        local_pc[i] = new RTCPeerConnection(pcConfiguration, pcOptions);
        peerConnectionsCreated++;
        remote_pc[i] = new RTCPeerConnection(pcConfiguration, pcOptions);
        peerConnectionsCreated++;
        bindPCEvents(i);
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


    for (var i= 0; i < peerConnections; i++)
    {
        switch(dataChannelMode)
        {
            case 'con':
            {
                dataChannelsPerPC = inputDataChannel.val();
                console.log("DC Con: " + dataChannelsPerPC);
                break;
            }
            case 'uni':
            {
                dataChannelsPerPC = randomUniform(inputDataChannel.val(), inputDataChannelMax.val());
                console.log("DC Uni: " + dataChannelsPerPC);
                break;
            }
            case 'nuni':
            {
                dataChannelsPerPC = randomNonUniform(inputDataChannel.val(), inputDataChannelMax.val());
                console.log("DC NUni: " + dataChannelsPerPC);
                break;
            }
            case 'exp':
            {
                dataChannelsPerPC = randomExponential(inputDataChannel.val());
                console.log("DC Exp: " + dataChannelsPerPC);
                break;
            }
            default:
            {
                dataChannelsPerPC = inputDataChannel.val();
                console.log("DC Def: " + dataChannelsPerPC);
                break;
            }
        }
        for(var j=0; j < dataChannelsPerPC; j++)
        {
            remote_dc[i][j] = remote_pc[i].createDataChannel("remote_pc_" + i + "_remote_dc_" + j);
            channelsCreated++;
            local_dc[i][j] = local_pc[i].createDataChannel("local_pc_" + i + "_local_dc_" + j, { reliable: true});
            channelsCreated++;
            bindDCEvents(i, j);
        }
        createOfferAnswer(i);
    }
    createLocalConnections(peerConnections, dataChannelsPerPC);
    createRemoteConnections(peerConnections, dataChannelsPerPC);
}

/**
 * sendMessages over given dataChannel
 * @param {int} messageCount
 * @param {int} index
 * @param {int} index
 * @param {int} local/remote (0/1)
 */
function sendMessages(messageCount, i, j, k)
{
    var _stringLength;
    if(k == 0)
    {
        for(var m = 0; m < messageCount; m++)
        {
            switch(messageCharMode)
            {
                case 'con':
                {
                    _stringLength = inputMessageChars.val();
                    break;
                }
                case 'uni':
                {
                    _stringLength = randomUniform(inputMessageChars.val(), inputMessageCharsMax.val());
                    break;
                }
                case 'nuni':
                {
                    _stringLength = randomNonUniform(inputMessageChars.val(), inputMessageCharsMax.val());
                    break;
                }
                case 'exp':
                {
                    _stringLength = randomExponential(inputMessageChars.val());
                    break;
                }
                default:
                {
                    _stringLength = inputMessageChars.val();
                    break;
                }
            }
            messagesSent++;
            local_dc[i][j].send(randomString(_stringLength));
        }
    }
    else if(k == 1)
    {
        for(var m = 0; m < messageCount; m++)
        {
            switch(messageCharMode)
            {
                case 'con':
                {
                    _stringLength = inputMessageChars.val();
                    break;
                }
                case 'uni':
                {
                    _stringLength = randomUniform(inputMessageChars.val(), inputMessageCharsMax.val());
                    break;
                }
                case 'nuni':
                {
                    _stringLength = randomNonUniform(inputMessageChars.val(), inputMessageCharsMax.val());
                    break;
                }
                case 'exp':
                {
                    _stringLength = randomExponential(inputMessageChars.val());
                    break;
                }
                default:
                {
                    _stringLength = inputMessageChars.val();
                    break;
                }
            }
            messagesSent++;
            remote_dc[i][j].send(randomString(_stringLength));
        }
    }
}

/**
 * sendMessages over given dataChannel
 * @param {int} messageCount
 * @param {int} index
 * @param {int} local/remote (0/1)
 */
function sendMessages2(messageCount, i, j)
{
    var _stringLength;
    if(j == 0)
    {
        for(var m = 0; m < messageCount; m++)
        {
            switch(messageCharMode)
            {
                case 'con':
                {
                    _stringLength = inputMessageChars.val();
                    break;
                }
                case 'uni':
                {
                    _stringLength = randomUniform(inputMessageChars.val(), inputMessageCharsMax.val());
                    break;
                }
                case 'nuni':
                {
                    _stringLength = randomNonUniform(inputMessageChars.val(), inputMessageCharsMax.val());
                    break;
                }
                case 'exp':
                {
                    _stringLength = randomExponential(inputMessageChars.val());
                    break;
                }
                default:
                {
                    _stringLength = inputMessageChars.val();
                    break;
                }
            }
            messagesSent++;
            local_dc2[i].send(randomString(_stringLength));
        }
    }
    else if(j == 1)
    {
        for(var m = 0; m < messageCount; m++)
        {
            switch(messageCharMode)
            {
                case 'con':
                {
                    _stringLength = inputMessageChars.val();
                    break;
                }
                case 'uni':
                {
                    _stringLength = randomUniform(inputMessageChars.val(), inputMessageCharsMax.val());
                    break;
                }
                case 'nuni':
                {
                    _stringLength = randomNonUniform(inputMessageChars.val(), inputMessageCharsMax.val());
                    break;
                }
                case 'exp':
                {
                    _stringLength = randomExponential(inputMessageChars.val());
                    break;
                }
                default:
                {
                    _stringLength = inputMessageChars.val();
                    break;
                }
            }
            messagesSent++;
            remote_dc2[i].send(randomString(_stringLength));
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
        //(local_pc[i].iceConnectionState == 'completed') ||
        if((local_pc[i].iceConnectionState == 'connected') && (local_pc[i].iceGatheringState == 'complete'))
        {
            peerConnectionsEtablished++;
        }
    };
    remote_pc[i].oniceconnectionstatechange =
    function()
    {
        console.log(i + ". RemotePC Connection State: " + remote_pc[i].iceConnectionState);
        if((remote_pc[i].iceConnectionState == 'connected') && (remote_pc[i].iceGatheringState == 'complete'))
        {
            peerConnectionsEtablished++;
        }
    };
    remote_pc[i].ondatachannel = function (evt)
    {
        bindDC2Events((remote_dc2.push(evt.channel) - 1), 1);
        channelsCreated++;
    };
    local_pc[i].ondatachannel = function (evt)
    {
        bindDC2Events((local_dc2.push(evt.channel) - 1), 0);
        channelsCreated++;
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
            channelsOpened++;
            sendMessages2(messageCount, i, 0);
        };
        local_dc2[i].onmessage = function (e)
        {
            messagesRecieved++;
        };
        local_dc2[i].onError = function (e)
        {
        };
    }
    else if(j == 1)
    {
        remote_dc2[i].onopen = function ()
        {
            channelsOpened++;
            sendMessages2(messageCount, i, 1);
        };
        remote_dc2[i].onmessage = function (e)
        {
            messagesRecieved++;
        };
        remote_dc2[i].onError = function (e)
        {
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
        channelsOpened++;
        sendMessages(messageCount, i, j, 1);
    };
    remote_dc[i][j].onclose = function ()
    {
        console.log("Channel closed");
    };
    remote_dc[i][j].onmessage = function (e)
    {
        messagesRecieved++;
    };
    remote_dc[i][j].onError = function (e)
    {
        console.log("Datachannel Error: " + err);
    };
    //---------
    local_dc[i][j].onopen = function ()
    {
        channelsOpened++;
        sendMessages(messageCount, i, j, 0);
    };
    local_dc[i][j].onclose = function ()
    {
        console.log("Channel closed");
    };
    local_dc[i][j].onmessage = function (e)
    {
        messagesRecieved++;
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
    remote_pc[i].onicecandidate = function (ev)
    {
        if(!ev.candidate)
        {
        }
        else
        {
            local_pc[i].addIceCandidate(new RTCIceCandidate(ev.candidate),
            function()
            {
            },
            function(err)
            {
            });
        }
    };
}

/**
 * Create OnNegotiationNeeded Event Handler for given PeerConnection
 * @param {Objec} index
 */
function createRemoteOnNegotiationNeeded(i)
{
    remote_pc[i].onnegotiationneeded = function()
    {
        console.log("Remote Neogation Needed");
    };
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
    };
}

/**
 * Create IceCandidate Event Handler for given PeerConnection
 * @param {int} index
 */
function createLocalOnIceCandidate(i)
{
    local_pc[i].onicecandidate = function (ev)
    {
        if(!ev.candidate)
        {
        }
        else
        {
            remote_pc[i].addIceCandidate(new IceCandidate(ev.candidate), successHandler, errorHandler);
        }
    };
}

/**
 * Create OnNegotiationNeeded Event Handler for given PeerConnection
 * @param {Objec} index
 */
function createLocalOnNegotiationNeeded(i)
{
    local_pc[i].onnegotiationneeded = function()
    {
        console.log("Local Neogation Needed");
        createOfferAnswer(i);
    };
}

/**
 * Generic errorHandler
 */
function errorHandler (err)
{
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
    local_pc[i].createOffer(function (description)
    {
        local_pc[i].setLocalDescription(description, successHandler, errorHandler);
        remote_pc[i].setRemoteDescription(description, successHandler, errorHandler);

        remote_pc[i].createAnswer(function (description)
        {
            remote_pc[i].setLocalDescription(description, successHandler, errorHandler);
            local_pc[i].setRemoteDescription(description, successHandler, errorHandler);
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
    };
}
