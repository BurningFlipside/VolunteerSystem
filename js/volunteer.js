function showProfileWizard() {
  $('#profileWizard').modal('show');
}

function gotMyProfile(jqXHR) {
  if(jqXHR.status === 404) {
    showProfileWizard();
    return;
  }
  console.log(jqXHR);
}

function privacyShown(page) {
  var first = $('#givenName').val();
  var last = $('#sn').val();

  var selects = page.find('select');
  if(first === '' || first === false || first === 'false') {
    selects.find('[value=full]').attr('disabled', true);
    selects.find('[value=firstBurner]').attr('disabled', true);
  }
  if(last === '' || last === false || last === 'false') {
    selects.find('[value=full]').attr('disabled', true);
    selects.find('[value=burnerLast]').attr('disabled', true);
  }
  selects.find('option:not([disabled]):first').attr('selected', true);
  for(var i = 0; i < selects.length; i++) {
    updateDisplayName(selects[i]);
  }
}

function updateDisplayName(elem) {
  var value = elem.value;
  var displayField = $('#'+elem.id.replace('Name', 'DisplayName'));
  var burner = $('#displayName').val();
  var first = $('#givenName').val();
  var last = $('#sn').val();
  switch(value) {
    case 'anonymous':
      displayField.val('Anonymous');
      break;
    case 'full':
      displayField.val(first+' "'+burner+'" '+last);
      break;
    case 'burnerLast':
      displayField.val(burner+' '+last);
      break;
    case 'firstBurner':
      displayField.val(first+' '+burner);
      break;
    case 'burner':
      displayField.val(burner);
      break;
  }
}

function initVolPage() {
  $.ajax({
    url: 'api/v1/participants/me',
    complete: gotMyProfile
  });
  $('[data-toggle="popover"]').popover();
}

$(initVolPage);
