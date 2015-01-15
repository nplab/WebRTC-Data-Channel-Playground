var npmControlChannelCounter = 1;


$('#npmControl button[name="toggleActive"]').click(function(){
	//alert("click");
	$(this).toggleClass('btn-default btn-primary');
	if($(this).hasClass('btn-primary')) {
		$(this).data('active',true);
		console.log('aktiviert');
	} else {
		$(this).data('active',false);
		console.log('deaktiviert');
	}
	
});

$('#npmControl ul.reliabilitySelect a').click(function(){
	
	var parentId = $(this).closest('tr').prop('id');
	$('#'+parentId+' .dropdown-toggle').html($(this).data('method') + ' <span class="caret"></span>');
	
	var relInput = $('#'+parentId +' input[name=paramReliable]');	
	console.log(parentId + ' ' + relInput);
	
	if($(this).data('method') == "default"){
		relInput.prop('disabled',true);
	} else {
		relInput.prop('disabled',false);
	}
	console.log('Methode gewählt:' + $(this).data('method'));
});


function addNpmControlRow() {
	npmControlChannelCounter++;
	var cloneRow = $('#npmControl tr.tr_clone').clone();
	cloneRow.removeClass('tr_clone');
	cloneRow.prop('id','npmControlC'+npmControlChannelCounter);
	cloneRow.find('[name=toggleActive]').html(npmControlChannelCounter);
	$('#npmControl tr').last().after(cloneRow);
	
}


$('#npmControlAddChannel').click(function(){
	console.log('adding row');
	addNpmControlRow();
});
