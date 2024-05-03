/* global $ */
/* exported privacyShown, saveProfile */
function showProfileWizard() {
  $('#profileWizard').modal('show');
}

function createdProfile(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to create volunteer profile!');
    return;
  }
  location.reload();
}

function saveProfile(profile) {
  for(var key in profile) {
    if(key.includes('DisplayName')) {
      delete profile[`${key}`];
    }
  }
  //convert from profile standard to fvs
  profile.burnerName = profile.displayName;
  delete profile.displayName;
  if(profile.givenName && profile.givenName.length > 0 && profile.givenName !== 'false') {
    profile.firstName = profile.givenName;
  }
  delete profile.givenName;
  if(profile.sn && profile.sn.length > 0 && profile.sn !== 'false') {
    profile.lastName = profile.sn;
  }
  delete profile.sn;
  profile.email = profile.mail;
  delete profile.mail;
  $.ajax({
    url: 'api/v1/participants',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(profile),
    complete: createdProfile
  });
  $('#profileWizard').modal('hide');
}

function gotMyProfile(jqXHR) {
  if(jqXHR.status === 404) {
    showProfileWizard();
    return;
  }
  let profile = jqXHR.responseJSON;
  $('body').data('profile', profile);
  $('body').trigger('fvs:ready');
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
  for(let select of selects) {
    updateDisplayName(select);
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
    url: 'api/v1/participants/me?$select=campName,webName,paperName,burnerName,firstName,lastName,email,uid,shiftSize,critVol,ticketCode',
    complete: gotMyProfile
  });
  $('[data-toggle="tooltip"]').tooltip();
}

$(initVolPage);
