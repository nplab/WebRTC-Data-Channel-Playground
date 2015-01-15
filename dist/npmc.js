var npmControlChannelCounter = 1;


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
	
	event.preventDefault();
});


function addNpmControlRow() {
	npmControlChannelCounter++;
	var cloneRow = $('#npmControl tr.tr_clone').clone(true);
	cloneRow.removeClass('tr_clone');
	cloneRow.prop('id','npmControlC'+npmControlChannelCounter);
	cloneRow.find('[name=toggleActive]').html(npmControlChannelCounter);
	$('#npmControl tr').last().after(cloneRow);
	
}


$('#npmControlAddChannel').click(function(event){
	console.log('adding row');
	addNpmControlRow();
	event.preventDefault();
});
