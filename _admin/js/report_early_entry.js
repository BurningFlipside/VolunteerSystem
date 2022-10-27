/*global $*/
/* exported generateCSV*/
function eeValueToString(ee) {
  switch(ee) {
    case '-2':
      return 'Late Stay (Monday Evening)';
    case '0':
      return 'Wednesday Afternoon (Theme Camp/Art) Early Entry';
    case '1':
      return 'Wednesday Morning Infrastructure Setup';
    case '2':
      return 'Tuesday Morning Infrastructure Setup';
  }
}

function gotReport(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var tbody = $('#eeTable tbody');
  tbody.empty();
  for(let vol of data) {
    let eeTxt = eeValueToString(vol.earlyLate);
    tbody.append('<tr><td>'+vol.name+'</td><td>'+vol.email+'</td><td>'+vol.dept+'</td><td>'+vol.role+'</td><td>'+eeTxt+'</td><td>'+vol.ticket+'</td></tr>');
  }
}

function getShifts() {
  let obj = {};
  let ee = $('#earlyLate').val();
  if(ee !== '*') {
    obj.earlyLate = ee;
  }
  let dept = $('#dept').val();
  if(dept !== undefined) {
    obj.department = dept;
  }
  let includePending = $('#showPending')[0].checked;
  if(includePending === true) {
    obj.includePending = includePending;
  }
  $.ajax({
    url: '../api/v1/events/'+$('#event').val()+'/Actions/GetEEShiftReport',
    method: 'POST',
    data: JSON.stringify(obj),
    dataType: 'json',
    contentType: 'application/json',
    complete: gotReport
  });
}

function gotEvent(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  //var data = jqXHR.responseJSON;
  getShifts();
}

function eventChanged() {
  $.ajax({
    url: '../api/v1/events/'+$('#event').val(),
    complete: gotEvent
  });
}

function eeChanged() {
  if($('#event').val() !== null) {
    getShifts();
  }
}

function pendingChanged() {
  if($('#event').val() !== null) {
    getShifts();
  }
}

function departmentChanged() {
  if($('#event').val() !== null) {
    getShifts();
  }
}

function generateCSV() {
  if($('#event').val() === null) {
    alert('Select an event first!');
  }
  let append = '';
  if($('#showPending')[0].checked) {
    append += 'includePending=true&';
  }
  let dept = $('#dept').val();
  if(dept !== undefined) {
    append += 'department='+dept+'&'
  }
  window.location = '../api/v1/events/'+$('#event').val()+'/Actions/GetEEShiftReport?'+append+'$format=csv';
}

function initPage() {
  $('#event').select2({
    ajax: {
      url: '../api/v1/events',
      processResults: function(data) {
        var res = [];
        data.sort((a,b) => {
          return a.name.localeCompare(b.name);
        });
        for(let event of data) {
          res.push({id: event['_id']['$oid'], text: event.name});
        }
        return {results: res};
      }
    }
  });
  $('#dept').select2({
    ajax: {
      url: '../api/v1/departments',
      processResults: function(data) {
        var res = [];
        data.sort((a,b) => {
          return a.departmentName.localeCompare(b.departmentName);
        });
        for(let dept of data) {
          res.push({id: dept.departmentID, text: dept.departmentName});
        }
        return {results: res};
      }
    }
  });
  $('#event').change(eventChanged);
  $('#earlyLate').change(eeChanged);
  $('#showPending').change(pendingChanged);
  $('#dept').change(departmentChanged)
}

$(initPage);
