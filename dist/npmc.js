/*-
 * Copyright (c) 2015 Daniel Richters, Felix Weinrank
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
 *
 */


/*
 * SETTINGS SECTION BEGIN
 */

var npmcSettings = {
	// refresh rate for the status tables in ms
	statusRefreshRate	: 1000,
};

/*
 * SETTINGS SECTION END
 */

var npmcDcCounter = 0;
var npmcStatisticsTimerActive = false;

parametersRowAddSamples();


// button toggle used to activate and deactivate channels
$('#npmChannelParameters').on('click', 'button[name="toggleActive"]', function(event){
	$(this).toggleClass('btn-default btn-success');
	if($(this).hasClass('btn-success')) {
		$(this).data('active',true);
	} else {
		$(this).data('active',false);
	}
	event.preventDefault();
});

// select reliability options for specific channel - this function provides dropdown functionality
$('#npmChannelParameters').on('change', 'select[name=paramMode]', function(event){
	var parentId 				= $(this).closest('tr').prop('id');
	var paramModeValueInput 	= $('#' +parentId + ' input[name=paramModeValue]');
	var selectedMode			= $(this).val();
	
	
	if(selectedMode== "reliable"){
		paramModeValueInput.prop('disabled',true);
	} else {
		paramModeValueInput.prop('disabled',false);
	}
	
	$(this).children("option").each(function(){
		if($(this).val() == selectedMode) {
			$(this).attr('selected',true);
		} else {
			$(this).attr('selected',false);
		}
	});
	
	event.preventDefault();
});


// after chaning the signaling ID value - prepare role
$('#signalingID').change(function(){
	prepareRole();
});


// clone the first row from dc parameters and append it after the last row
function npmParametersRowAdd() {
	npmcDcCounter++;
	var cloneRow = $('.npmChannelParametersBlank').clone();
	cloneRow.removeClass('npmChannelParametersBlank');
	cloneRow.show();
	cloneRow.find('[name=toggleActive]').val('o'+npmcDcCounter);
	cloneRow.find('[name=toggleActive]').html(npmcDcCounter);
	$('#npmChannelParameters tr').last().after(cloneRow);
	
	return cloneRow;
}

// remove specific row
function parametersRowDelete(element) {
	$(element).closest('tr').remove();
}

function parametersRowCopy(element) {
	npmcDcCounter++;
	var cloneRow = $(element).closest('tr').clone();
	cloneRow.find('[name=toggleActive]').val('o'+npmcDcCounter);
	cloneRow.find('[name=toggleActive]').html(npmcDcCounter);
	$('#npmChannelParameters tr').last().after(cloneRow);
}

// create sample data
function parametersRowAddSamples() {
	var first = npmParametersRowAdd();
	first.find('[name=paramPktCount]').val('1000');
	first.find('[name=paramPktSize]').val('1024');
	first.find('[name=paramInterval]').val('10');
	first.find('[name=paramDelay]').val('5');
	first.find('[name=paramRuntime]').val('30');

	var second = npmParametersRowAdd();
	
	second.find('[name=paramPktCount]').val('1000');
	second.find('[name=paramPktSize]').val('u:1024:2048');
	second.find('[name=paramInterval]').val('e:10');
	second.find('[name=paramDelay]').val('5');
	second.find('[name=paramRuntime]').val('30');
}

function parametersValidate() {
	$('#npmChannelParameters body tr input').not('.npmChannelParametersBlank').each(function(){
		alert($(this).attr('name'));
	});
}

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
	
	$('table#dcStatus tbody').empty();
	var activeChannels = false;
	
	
	$.each(channels, function(key, value) {		
		var channel 	= value.channel;
		var statistics 	= value.statistics;
		
		// if init channel is open, enable npm and ping - if not: disable!
		if(channel.label == 'init') {
			if(channel.readyState === 'open') {
				$('#npmcRun').removeAttr('disabled');
				$('#npmcPing').removeAttr('disabled');
				$('#npmSaveStats').removeAttr('disabled');
			} else {
				$('#npmcRun').attr('disabled',true);
				$('#npmcPing').attr('disabled',true);
				$('#npmSaveStats').attr('disabled',true);
			}
		}
		
		// if channel is open, offer to close it
		var actionHTML = '';
		if(channel.readyState === 'open') {
			if(channel.label != 'init') {
				activeChannels = true;
			}
			
			actionHTML = '<button class="btn-default btn btn-xs" onclick="closeDataChannel(\'' + value.channel.label + '\');">close</button>';
		}
		
		// calculate statistics
		if(statistics.t_start != 0) {
			statistics.rx_rate_avg = statistics.rx_bytes / (statistics.t_end - statistics.t_start) * 1000;
			statistics.tx_rate_avg = statistics.tx_bytes / (statistics.t_end - statistics.t_start) * 1000;
		}
		
		if(role == 'offerer') {
			$('table#dcStatus tbody').append('<tr><td>'+ channel.id + '</td><td><span class="dcStatus-'+channel.readyState+'">' + channel.readyState + '</span></td><td>' + channel.label + '</td><td>' + statistics.tx_pkts + '</td><td>' + bytesToSize(statistics.tx_bytes) + '</td><td>'+bytesToSize(statistics.tx_rate_avg)+'/s</td><td>'+actionHTML + '</td></tr>');
		} else {
			$('table#dcStatus tbody').append('<tr><td>'+ channel.id + '</td><td><span class="dcStatus-'+channel.readyState+'">' + channel.readyState + '</span></td><td>' + channel.label + '</td><td>' + statistics.rx_pkts + '</td><td>' + bytesToSize(statistics.rx_bytes) + '</td><td>'+bytesToSize(statistics.rx_rate_avg)+'/s</td><td>'+actionHTML + '</td></tr>');

		}
		
	});
	
	if(activeChannels && npmcStatisticsTimerActive == false) {
		npmcStatisticsTimerActive = true;
		setTimeout(function(){
			npmcStatisticsTimerActive = false;
			updateChannelStatus();
		},npmcSettings.statusRefreshRate);
		refreshCounter++;
	} 
	if(refreshCounter%3 == 0) {
		console.log('Graphzeichenn!!!');
		statsDrawChart();
	}
	
	return true;
}


