function gotDepartments(jqXHR) {
  if(jqXHR.responseJSON !== undefined) {
    $('#deptCount').html(jqXHR.responseJSON['@odata.count']);
  }
}

function gotShifts(jqXHR) {
  if(jqXHR.responseJSON !== undefined) {
    $('#shiftCount').html(jqXHR.responseJSON['@odata.count']);
  }
}

function initIndex() {
  $.ajax({
    url: '../api/v1/departments?$count=true',
    complete: gotDepartments
  });
  $.ajax({
    url: '../api/v1/shifts?$count=true',
    complete: gotShifts
  });
}

$(initIndex);
