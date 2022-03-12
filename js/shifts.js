/* global $ */
function gotShifts(jqXHR) {
  if(jqXHR.status === 401) {
    location.reload();
    return;
  }
  else if(jqXHR.status !== 200) {
    alert('Unable to get shifts!');
    console.log(jqXHR);
    return;
  }
  var array = jqXHR.responseJSON;
  for(let shift in array) {
    console.log(shift);
  }
}

function initPage() {
  $.ajax({
    url: 'api/v1/shifts',
    complete: gotShifts
  });
}

$(initPage);
