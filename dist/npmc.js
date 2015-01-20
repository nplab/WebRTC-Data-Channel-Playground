var npmControlChannelCounter = 1;
var npmcStatisticsTimerActive = false;


$('#npmControl button[name="toggleActive"]').click(function(event){
	$(this).toggleClass('btn-default btn-primary');
	if($(this).hasClass('btn-primary')) {
		$(this).data('active',true);
	} else {
		$(this).data('active',false);
	}
	event.preventDefault();
});

$('#npmControl ul.reliabilitySelect a').click(function(event){
	var parentId 		= $(this).closest('tr').prop('id');
	var toggleButton 	= $('#'+parentId+' .dropdown-toggle');
	toggleButton.html($(this).data('method') + ' <span class="caret"></span>');
	toggleButton.data('method',$(this).data('method'));
	
	var relInput = $('#'+parentId +' input[name=paramReliable]');	
	console.log(parentId + ' ' + relInput);
	
	if($(this).data('method') == "reliable"){
		relInput.prop('disabled',true);
	} else {
		relInput.prop('disabled',false);
	}
	console.log('Methode gewählt:' + $(this).data('method'));
	console.log(toggleButton.data('method'));
	event.preventDefault();
});


function addNpmControlRow() {
	npmControlChannelCounter++;
	var cloneRow = $('#npmControl tr.tr_clone').clone(true);
	cloneRow.removeClass('tr_clone');
	cloneRow.prop('id','npmControlC'+npmControlChannelCounter);
	cloneRow.find('[name=toggleActive]').val('o'+npmControlChannelCounter);
	cloneRow.find('[name=toggleActive]').html(npmControlChannelCounter);
	cloneRow.find('[name=paramSleep]').val(cloneRow.find('[name=paramSleep]').val()*npmControlChannelCounter);
	$('#npmControl tr').last().after(cloneRow);
	
}


$('#npmControlAddChannel').click(function(event){
	console.log('adding row');
	addNpmControlRow();
	event.preventDefault();
});


function updatePeerConnectionState(event) {
	$('#signalingState').html(pc.signalingState);
	$('#iceConnectionState').html(pc.iceConnectionState);
	$('#iceGatheringState').html(pc.iceGatheringState);
	console.log('PeerConnection - Change signaling state:' + pc.signalingState);
	return true;
}

function updateChannelState(event) {
	
	$('table#dcStatusOfferer tbody').empty();
	$('table#dcStatusAnswerer tbody').empty();
	var activeChannels = false;
	
	$.each(channels, function(key, value) {		
		var actionHTML = '';
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
	
	if(activeChannels && npmcStatisticsTimerActive == false) {
		npmcStatisticsTimerActive = true;
		setTimeout(function(){
			npmcStatisticsTimerActive = false;
			updateChannelState();
		},500);
	} 
	return true;
}

function updateChannelStatistics(event) {
	console.log('updateChannelStatistics');
	return true;
}