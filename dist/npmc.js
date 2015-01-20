/* Netperfmeter via WebRTC 
 * npmc.js - NetPerfMeterControl functions
 * by Felix Weinrank in 2015
 */


/*
 * SETTINGS SECTION BEGIN
 */

npmcSettings = {
	// refresh rate for the status tables in ms
	statusRefreshRate	: 500,
};

/*
 * SETTINGS SECTION END
 */

var npmcDcCounter = 1;
var npmcStatisticsTimer = false;

// button toggle used to activate and deactivate channels
$('#npmChannelParameters button[name="toggleActive"]').click(function(event){
	$(this).toggleClass('btn-default btn-primary');
	if($(this).hasClass('btn-primary')) {
		$(this).data('active',true);
	} else {
		$(this).data('active',false);
	}
	event.preventDefault();
});

// select reliability options for specific channel - this function provides dropdown functionality
$('#npmChannelParameters ul.reliabilitySelect a').click(function(event){
	var parentId 		= $(this).closest('tr').prop('id');
	var toggleButton 	= $('#'+parentId+' .dropdown-toggle');
	toggleButton.html($(this).data('method') + ' <span class="caret"></span>');
	toggleButton.data('method',$(this).data('method'));
	
	var relInput = $('#'+parentId +' input[name=paramReliable]');	
	
	if($(this).data('method') == "reliable"){
		relInput.prop('disabled',true);
	} else {
		relInput.prop('disabled',false);
	}
	event.preventDefault();
});

// clone the first row from dc parameters and append it after the last row
function cloneFirstParametersRow() {
	npmcDcCounter++;
	var cloneRow = $('#npmControl tr.tr_clone').clone(true);
	cloneRow.removeClass('tr_clone');
	cloneRow.prop('id','npmControlC'+npmcDcCounter);
	cloneRow.find('[name=toggleActive]').val('o'+npmcDcCounter);
	cloneRow.find('[name=toggleActive]').html(npmcDcCounter);
	cloneRow.find('[name=paramSleep]').val(cloneRow.find('[name=paramSleep]').val()*npmcDcCounter);
	$('#npmControl tr').last().after(cloneRow);
	
}

// bind cloneFirstParametersRow() to button
$('#npmChannelParametersClone').click(function(event){
	cloneFirstParametersRow();
	event.preventDefault();
});

// update the PeerConnectionStatus Table
function updatePeerConnectionStatus(event) {
	$('#signalingState').html(pc.signalingState);
	$('#iceConnectionState').html(pc.iceConnectionState);
	$('#iceGatheringState').html(pc.iceGatheringState);
	console.log('PeerConnection - Change signaling state:' + pc.signalingState);
	return true;
}

// update the ChannelStatus Table - in dependency of being offerer or sender
function updateChannelStatus(event) {
	
	$('table#dcStatusOfferer tbody').empty();
	$('table#dcStatusAnswerer tbody').empty();
	var activeChannels = false;
	
	$.each(channels, function(key, value) {		
		var actionHTML = '';
		
		// if channel is open, offer to close it
		if(value.channel.readyState === 'open') {
			activeChannels = true;
			var actionHTML = '<button class="btn-default btn" onclick="closeDataChannel(\'' + value.channel.label + '\');">close</button>';
		}
		if(offerer) {
			$('table#dcStatusOfferer tbody').append('<tr><td>'+ value.channel.id + '</td><td>' + value.channel.readyState + '</td><td>' + value.channel.label + '</td><td>' + value.statistics.npmPktRx + '</td><td>' + value.statistics.npmPktTx + '</td><td>'+actionHTML + '</td></tr>');
		} else {
			rateAll = Math.round(value.statistics.npmBytesRx / ((value.statistics.t_end - value.statistics.t_start) / 1000));
			$('table#dcStatusAnswerer tbody').append('<tr><td>'+ value.channel.id + '</td><td>' + value.channel.label + '</td><td>' + value.channel.readyState + '</td><td>' + value.statistics.npmPktRx + '</td><td>' + value.statistics.npmBytesRx + '</td><td></td><td>'+rateAll+'kb/s</td><td>'+actionHTML + '</td></tr>');
	
		}
		
	});
	
	if(activeChannels && npmcStatisticsTimerActive != false) {
		npmcStatisticsTimerActive = true;
		setTimeout(function(){
			npmcStatisticsTimerActive = false;
			updateChannelStatus();
		},npmcSettings.statusRefreshRate);
	} 
	return true;
}
