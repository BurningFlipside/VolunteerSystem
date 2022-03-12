/* global $, getParameterByName*/
/* exported save */
function saveDone(jqXHR) {
  if(jqXHR.status === 200) {
    location.reload();
  } else {
    alert('Unable to save data!');
    console.log(jqXHR);
  }
}

function save() {
  $.ajax({
    url: '../api/v1/longText/'+$('#emailTextName').val(),
    type: 'PATCH',
    data: $('#emailSource').val(),
    processData: false,
    contentType: 'text/html',
    complete: saveDone
  });
}

function gotEmailSource(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to obtain Email source!');
  }
  $('#emailSource').val(jqXHR.responseJSON);
}

function emailTextChanged() {
  let value = $('#emailTextName').val();
  $.ajax({
    url: '../api/v1/longText/'+value,
    complete: gotEmailSource
  });
}

function initPage() {
  $('#emailSource').ckeditor({
    allowedContent: true
  });
  var type = getParameterByName('type');
  if(type !== null) {
    $('#emailTextName').val(type);
  }
  emailTextChanged();
}

$(initPage);
