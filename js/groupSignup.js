function signupDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to sign up for shift');
    return;
  }
  alert('Success!');
  location.reload();
}

function signUp(shiftId) {
  $.ajax({
    url: 'api/v1/shifts/'+shiftId+'/Actions/Signup',
    method: 'POST',
    complete: signupDone
  });
}
