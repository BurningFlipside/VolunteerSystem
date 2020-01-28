function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var tbody = $('#shiftTable tbody');
  tbody.empty();
  console.log(data);
  for(var i = 0; i < data.length; i++) {
    if(data[i].participant === undefined) {
      tbody.append('<tr><td>'+data[i].departmentID+'</td><td>'+data[i].roleID+'</td></tr>');
    }
  }
}

function getShifts() {
  var extra = "";
  var start = $('#startTime').val();
  if(start !== '') {
    extra = ' and startTime eq '+start;
  }
  $.ajax({
    url: '../api/v1/events/'+$('#event').val()+'/shifts?$filter=enabled eq true and status ne filled'+extra,
    complete: gotShifts
  });
}

function gotEvent(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  $('#startTime').attr('min', data.startTime);
  getShifts();
}

function eventChanged(e) {
  $.ajax({
    url: '../api/v1/events/'+$('#event').val(),
    complete: gotEvent
  });
}

function startTimeChanged(e) {
  if($('#event').val() !== null) {
    getShifts();
  }
}

function generateCSV() {
  if($('#event').val() === null) {
    alert('Select an event first!');
  }
  var extra = "";
  var start = $('#startTime').val();
  if(start !== '') {
    extra = ' and startTime eq '+start;
  }
  window.location = '../api/v1/events/'+$('#event').val()+'/shifts?$format=csv&$filter=enabled eq true and status ne filled'+extra;
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
        for(var i = 0; i < data.length; i++) {
          res.push({id: data[i]['_id']['$oid'], text: data[i].name});
        }
        return {results: res};
      }
    }
  });
  $('#event').change(eventChanged);
  $('#startTime').change(startTimeChanged);
}

$(initPage);
