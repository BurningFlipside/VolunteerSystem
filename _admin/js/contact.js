/* global $*/
function gotParticipant(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var textarea = $('#emails');
  var current = textarea.val();
  if(current === '') {
    textarea.val(data.email);
  } else {
    textarea.val(current+', '+data.email);
  }
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var start = $('#startTime').val();
  var end = $('#endTime').val();
  if(start !== '' || end !== '') {
    start = new Date(start);
    end = new Date(end);
    data = data.filter(function(elem) {
      let elemStart = new Date(elem.startTime);
      let elemEnd = new Date(elem.endTime);
      if(isValidDate(start) && start > elemEnd) {
        return false;
      }
      if(isValidDate(end) && end < elemStart) {
        return false;
      }
      return true;
    });
  }
  var textarea = $('#emails');
  textarea.val('');
  let participants = {};
  for(let shift of data) {
    if(shift.participant !== undefined && participants[shift.participant] === undefined) {
      participants[shift.participant] = $.ajax({
        url: '../api/v1/participants/'+encodeURIComponent(shift.participant),
        complete: gotParticipant
      });
    }
  }
}

function getShifts() {
  //Create filter
  var filter = 'status in (filled,pending)';
  let uri = '../api/v1/shifts?$filter=';
  var event = $('#event').val();
  if(event !== null) {
    uri = '../api/v1/events/'+event+'/shifts?$filter=';
  }
  var dept = $('#dept').val();
  if(dept !== null) {
    filter += ' and departmentID eq '+dept;
  }
  var role = $('#role').val();
  if(role !== null) {
    filter += ' and roleID eq '+role;
  }
  $.ajax({
    url: uri+filter,
    complete: gotShifts
  });
}

function gotEvent(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  $('#startTime').attr('min', data.startTime);
  $('#startTime').attr('max', data.endTime);
  $('#endTime').attr('min', data.startTime);
  $('#endTime').attr('max', data.endTime);
  getShifts();
}

function eventChanged() {
  $.ajax({
    url: '../api/v1/events/'+$('#event').val(),
    complete: gotEvent
  });
}

function deptChanged(e) {
  $('#role').select2('destroy');
  $('#role').select2({
    ajax: {
      url: '../api/v1/departments/'+e.target.value+'/roles',
      processResults: function(data) {
        var res = [];
        data.sort((a,b) => {
          return a.display_name.localeCompare(b.display_name);
        });
        for(let role of data) {
          res.push({id: role.short_name, text: role.display_name});
        }
        return {results: res};
      } 
    }
  });
  getShifts();
}

function roleChanged() {
  getShifts();
}

function startTimeChanged() {
  if($('#event').val() !== null) {
    getShifts();
  }
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
          if(dept.isAdmin) {
            res.push({id: dept.departmentID, text: dept.departmentName});
          }
        }
        return {results: res};
      }
    }
  });
  $('#role').select2();
  $('#event').change(eventChanged);
  $('#dept').change(deptChanged);
  $('#role').change(roleChanged);
  $('#startTime').change(startTimeChanged);
  $('#endTime').change(startTimeChanged);
}

$(initPage);
