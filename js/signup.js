function signupDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to sign up for shift');
    return;
  }
  alert('Success!');
  window.history.back();
}

function abandon() {
  var shiftID = getParameterByName('shiftID'); 
  $.ajax({
    url: 'api/v1/shifts/'+shiftID+'/Actions/Abandon',
    method: 'POST',
    complete: signupDone
  });
}

function signup() {
  var shiftID = $('#shiftID').val();
  $.ajax({
    url: 'api/v1/shifts/'+shiftID+'/Actions/Signup',
    method: 'POST',
    complete: signupDone
  });
}

function override() {
  var shiftID = $('#shiftID').val();
  var obj = {};
  obj['participant'] = '/dev/null';
  obj['status'] = 'filled';
  obj['volunteer'] = $('#participantOverride').val();
  $.ajax({
    url: 'api/v1/shifts/'+shiftID,
    method: 'PATCH',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    complete: signupDone
  });
}

function showAdminSignup() {
  $('#adminSignup').removeClass('d-none');
}

function revealPage() {
  $('#signupContent').removeClass('d-none');
  $('#groupContent').removeClass('d-none');
}
