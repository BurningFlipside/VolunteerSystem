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
  for(let vol in data) {
    let eeTxt = eeValueToString(vol.earlyLate);
    tbody.append('<tr><td>'+vol.name+'</td><td>'+vol.email+'</td><td>'+vol.dept+'</td><td>'+vol.role+'</td><td>'+eeTxt+'</td><td><i>Pending</i></td></tr>');
  }
}

function getShifts() {
  let obj = {};
  var ee = $('#earlyLate').val();
  if(ee !== '*') {
    obj.earlyLate = ee;
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

function generateCSV() {
  if($('#event').val() === null) {
    alert('Select an event first!');
  }
  window.location = '../api/v1/events/'+$('#event').val()+'/Actions/GetEEShiftReport?$format=csv';
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
  $('#event').change(eventChanged);
  $('#earlyLate').change(eeChanged);
}

$(initPage);
