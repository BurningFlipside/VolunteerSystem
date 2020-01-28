function gotParticipant(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var textarea = $('#emails');
  var current = textarea.val();
  if(current === '') {
    textarea.val(data.email);
  }
  else {
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
  console.log(data);
  let participants = {};
  for(var i = 0; i < data.length; i++) {
    if(data[i].participant !== undefined && participants[data[i].participant] === undefined) {
      participants[data[i].participant] = $.ajax({
        url: '../api/v1/participants/'+data[i].participant,
        complete: gotParticipant
      });
    }
  }
}

function getShifts() {
  //Create filter
  var filter = 'status eq filled';
  var event = $('#event').val();
  if(event !== null) {
    filter += ' and eventID eq '+event;
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
    url: '../api/v1/shifts?$filter='+filter,
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

function eventChanged(e) {
  $.ajax({
    url: '../api/v1/events/'+$('#event').val(),
    complete: gotEvent
  });
}

function deptChanged(e) {
  $("#role").select2("destroy");
  $("#role").select2({
    ajax: {
      url: '../api/v1/departments/'+e.target.value+'/roles',
      processResults: function(data) {
        var res = [];
        data.sort((a,b) => {
          return a.display_name.localeCompare(b.display_name);
        });
        for(var i = 0; i < data.length; i++) {
          res.push({id: data[i].short_name, text: data[i].display_name});
        }
        return {results: res};
      } 
    }
  });
  getShifts();
}

function roleChanged(e) {
  getShifts();
}

function startTimeChanged(e) {
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
        for(var i = 0; i < data.length; i++) {
          res.push({id: data[i]['_id']['$oid'], text: data[i].name});
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
        for(var i = 0; i < data.length; i++) {
          if(data[i].isAdmin) {
            res.push({id: data[i].departmentID, text: data[i].departmentName});
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
