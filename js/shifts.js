function gotShifts(jqXHR) {
  if(jqXHR.status === 401) {
    location.reload();
    return;
  }
  else if(jqXHR.status !== 200) {
    alert('Unable to get shifts!');
    conosle.log(jqXHR);
    return;
  }
  var array = jqXHR.responseJSON;
  for(var i = 0; i < array.length; i++) {
    console.log(array[i]);
  }
}

function initPage() {
  $.ajax({
    url: 'api/v1/shifts',
    complete: gotShifts
  });
}

$(initPage);
