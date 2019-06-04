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

function initVolPage() {
  $.ajax({
    url: 'api/v1/participants/me',
    complete: gotMyProfile
  });
  $('[data-toggle="popover"]').popover();
}

$(initVolPage);
