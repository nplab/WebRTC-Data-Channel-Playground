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
	statusRefreshRate	: 500,
};

/*
 * SETTINGS SECTION END
 */

var npmcDcCounter = 1;
var npmcStatisticsTimerActive = false;

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
$('#npmChannelParameters').on('click', 'ul.reliabilitySelect a', function(event){
	var parentId 		= $(this).closest('tr').prop('id');
	var toggleButton 	= $('#'+parentId+' .dropdown-toggle');
	toggleButton.html($(this).data('shortdesc') + ' <span class="caret"></span>');
	toggleButton.data('method',$(this).data('method'));
	
	var relInput = $('#'+parentId +' input[name=paramReliable]');	
	
	if($(this).data('method') == "reliable"){
		relInput.prop('disabled',true);
	} else {
		relInput.prop('disabled',false);
	}
	event.preventDefault();
});

$('#signalingID').change(function(){
	prepareRole();
});


// clone the first row from dc parameters and append it after the last row
function cloneFirstParametersRow() {
	npmcDcCounter++;
	var cloneRow = $('#npmChannelParameters > tbody > tr.tr_clone').clone();
	cloneRow.removeClass('tr_clone');
	cloneRow.prop('id','npmChannelParametersC'+npmcDcCounter);
	cloneRow.find('[name=toggleActive]').val('o'+npmcDcCounter);
	cloneRow.find('[name=toggleActive]').html(npmcDcCounter);
	cloneRow.find('[name=paramSleep]').val(cloneRow.find('[name=paramSleep]').val()*npmcDcCounter);
	$('#npmChannelParameters tr').last().after(cloneRow);
	
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
		
		// if init channel is open, enable npm and ping - if not: disable!
		if(value.channel.label == 'init') {
			if(value.channel.readyState === 'open') {
				$('#npmcRun').removeAttr('disabled');
				$('#npmcPing').removeAttr('disabled');
				$('#npmSaveStats').removeAttr('disabled');
			} else {
				$('#npmcRun').attr('disabled','disabled');
				$('#npmcPing').attr('disabled','disabled');
				$('#npmSaveStats').attr('disabled','disabled');
			}
		}
		
		// if channel is open, offer to close it
		if(value.channel.readyState === 'open') {
			activeChannels = true;
			var actionHTML = '<button class="btn-default btn btn-xs" onclick="closeDataChannel(\'' + value.channel.label + '\');">close</button>';
		}
		
		// different statistics for offerer and answerer
		if(offerer) {
			$('table#dcStatusOfferer tbody').append('<tr><td>'+ value.channel.id + '</td><td><span class="dcStatus-'+value.channel.readyState+'">' + value.channel.readyState + '</span></td><td>' + value.channel.label + '</td><td>' + value.statistics.npmPktRxAnsw + '</td><td>' + value.statistics.npmPktTx + '</td><td>'+actionHTML + '</td></tr>');
		} else {
			// calculate some statistics
			rateAll = Math.round(value.statistics.npmBytesRx / ((value.statistics.t_end - value.statistics.t_start) / 1000));
			
			$('table#dcStatusAnswerer tbody').append('<tr><td>'+ value.channel.id + '</td><td><span class="dcStatus-'+value.channel.readyState+'">' + value.channel.readyState + '</span></td><td>'+ value.channel.label + '</td><td>' + value.statistics.npmPktRxAnsw + '</td><td>' + value.statistics.npmBytesRx + '</td><td></td><td>'+rateAll+'kb/s</td><td>'+actionHTML + '</td></tr>');
		}
		
	});
	
	if(activeChannels && npmcStatisticsTimerActive == false) {
		npmcStatisticsTimerActive = true;
		setTimeout(function(){
			npmcStatisticsTimerActive = false;
			updateChannelStatus();
		},npmcSettings.statusRefreshRate);
	} 
	return true;
}


