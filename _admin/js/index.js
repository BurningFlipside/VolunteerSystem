function gotDepartments(jqXHR) {
  if(jqXHR.responseJSON !== undefined) {
    $('#deptCount').html(jqXHR.responseJSON['@odata.count']);
  }
}

function gotRoles(jqXHR) {
  if(jqXHR.responseJSON !== undefined) {
    $('#roleCount').html(jqXHR.responseJSON['@odata.count']);
  }
}

function gotEvents(jqXHR) {
  if(jqXHR.responseJSON !== undefined) {
    $('#eventCount').html(jqXHR.responseJSON['@odata.count']);
  }
}

function initIndex() {
  $.ajax({
    url: '../api/v1/departments?$count=true',
    complete: gotDepartments
  });
  $.ajax({
    url: '../api/v1/roles?$count=true',
    complete: gotRoles
  });
  $.ajax({
    url: '../api/v1/events?$count=true',
    complete: gotEvents
  });
}

$(initIndex);
