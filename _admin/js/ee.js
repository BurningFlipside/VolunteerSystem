function eventChanged(e) {
  console.log(e);
}

function deptChanged(e) {
  console.log(e);
}

function processEvents(data) {
  var events = {};
  var eventSelect = $('#eventFilter');
  for(var i = 0; i < data.length; i++) {
    events[data[i]['_id']['$oid']] = data[i];
    eventSelect.append($('<option/>', {value: data[i]['_id']['$oid'], text: data[i].name}));
  }
  eventSelect.data('events', events);
  eventSelect.change(eventChanged);
  return events;
}

function processDepts(data) {
  var depts = {};
  var deptSelect = $('#deptFilter');
  for(var i = 0; i < data.length; i++) {
    depts[data[i].departmentID] = data[i];
    deptSelect.append($('<option/>', {value: data[i].departmentId, text: data[i].departmentName}));
  }
  deptSelect.data('depts', depts);
  deptSelect.change(deptChanged);
  return depts;
}

function processParticipants(data) {
  var vols = {};
  for(var i = 0; i < data.length; i++) {
    vols[data[i].uid] = data[i];
  }
  return vols;
}

function shiftLinkDisplay(cell) {
  return '<i class="far fa-window-maximize"></i>';
}

function showShifts(e, cell) {
  var data = cell.getRow().getData();
  var msg = '<table class="table"><thead><tr><th>Department</th><th>Role</th><th>Start Time</th><th>End Time</th></tr></thead><tbody>';
  for(var i = 0; i < data.shifts.length; i++) {
    msg += '<tr><td>'+data.shifts[i].department+'</td><td>'+data.shifts[i].roleID+'</td><td>'+data.shifts[i].startTime+'</td><td>'+data.shifts[i].endTime+'</td></tr>';
  }
  msg += '</tbody></table>'; 
  bootbox.alert({
    title: 'Shifts for '+data.name,
    message: msg
  });
  console.log(data);
}

function approveDone(jqXHR) {
  console.log(jqXHR);
}

function approve(type, uid, ee) {
  var obj = {};
  obj.approvalType = type;
  obj.uid = uid;
  obj.eeList = ee;
  $.ajax({
    url: '../api/v1/events/Actions/ApproveEE',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    method: 'POST',
    complete: approveDone
  });
}

function aarApprovalDisplay(cell) {
  var data = cell.getRow().getData();
  if(data.AAR === true) {
    return '<p class="text-success">Approved!</p>';
  }
  if($('body').data('aar') === 1) {
    var msg = '<button type="button" class="btn btn-success" onclick="approve(\'aar\',\''+data.id+'\', '+data.eeTypeID+');"><i class="fas fa-thumbs-up"></i></button>';
    msg += '<button type="button" class="btn btn-danger" onclick="disapprove(\'aar\',\''+data.id+'\', '+data.eeTypeID+');"><i class="fas fa-thumbs-down"></i></button>';
    return msg;
  }
  return '<i class="text-secondary">Pending</i>';
}

function afApprovalDisplay(cell) {
  var data = cell.getRow().getData();
  if(data.AF === true) {
    return '<p class="text-success">Approved!</p>';
  }
  if($('body').data('af') === 1) {
    var msg = '<button type="button" class="btn btn-success" onclick="approve(\'af\',\''+data.id+'\', '+data.eeTypeID+');"><i class="fas fa-thumbs-up"></i></button>';
    msg += '<button type="button" class="btn btn-danger" onclick="disapprove(\'af\',\''+data.id+'\', '+data.eeTypeID+');"><i class="fas fa-thumbs-down"></i></button>';
    return msg;
  }
  return '<i class="text-secondary">Pending</i>';
}

function leadApprovalDisplay(cell) {
  var data = cell.getRow().getData();
  if(data.Lead === true) {
    return '<p class="text-success">Approved!</p>';
  }
  if($('body').data('lead') === 1) {
    var msg = '<button type="button" class="btn btn-success" onclick="approve(\'lead\',\''+data.id+'\', '+data.eeTypeID+');"><i class="fas fa-thumbs-up"></i></button>';
    msg += '<button type="button" class="btn btn-danger" onclick="disapprove(\'lead\',\''+data.id+'\', '+data.eeTypeID+');"><i class="fas fa-thumbs-down"></i></button>';
    return msg;
  }
  return '<i class="text-secondary">Pending</i>';
}

function gotInitialData(results) {
  var eventResult = results.shift();
  var deptResult = results.shift();
  var participantResults = results.shift();
  var shiftResults = results.shift();
  var obj = {};
  obj.events = processEvents(eventResult.value);
  obj.depts = processDepts(deptResult.value);
  obj.vols = processParticipants(participantResults.value);
  for(var i = 0; i < shiftResults.value.length; i++) {
    if(shiftResults.value[i].participant === '') {
      continue;
    }
    if(obj.vols[shiftResults.value[i].participant] === undefined) {
      alert('Could not locate volunteer '+shiftResults.value[i].participant);
      continue;
    }
    if(obj.vols[shiftResults.value[i].participant].shifts === undefined) {
      obj.vols[shiftResults.value[i].participant].shifts = [];
    }
    obj.vols[shiftResults.value[i].participant].shifts.push(shiftResults.value[i]);
  }
  var rows = [];
  for(var uid in obj.vols) {
    var vol = obj.vols[uid];
    if(vol.shifts !== undefined) {
      var row = {id: uid, name: vol.firstName+' "'+vol.burnerName+'" '+vol.lastName, eeType: '', shifts: vol.shifts};
      var bestEE = -1;
      for(var id in obj.events) {
        var event = obj.events[id];
        if(event.eeLists !== undefined) {
          for(var eeType in event.eeLists) {
            var list = event.eeLists[eeType];
            if(list[uid] !== undefined) {
              if(parseInt(eeType) > bestEE) {
                bestEE = parseInt(eeType);
              }
              row.AAR = list[uid].AAR;
              row.AF = list[uid].AF;
              row.Lead = list[uid].Lead;
            }
          }
        }
      }
      switch(bestEE) {
        case 2:
          row.eeType = 'Tuesday';
          break;
        case 1:
          row.eeType = 'Wednesday Morning';
          break;
        case 0:
          row.eeType = 'Wednesday Afternoon';
          break;
      }
      row.eeTypeID = bestEE;
      rows.push(row);
    }
  }
  var table = new Tabulator('#ee', {
    columns: [
      {title: 'Name', field: 'name'},
      {title: 'Early Entry Type', field: 'eeType'},
      {title: 'Shifts', formatter: shiftLinkDisplay, cellClick: showShifts},
      {title: 'AAR', formatter: aarApprovalDisplay},
      {title: 'AF', formatter: afApprovalDisplay},
      {title: 'Lead', formatter: leadApprovalDisplay}
    ]
  });
  table.setData(rows);
}

function initPage() {
  var promises = [];
  var eventId = getParameterByName('event');
  var deptId = getParameterByName('dept');
  if(eventId === null) {
    promises.push($.ajax({
      url: '../api/v1/events',
    }));
  }
  else {
    promises.push($.ajax({
      url: '../api/v1/events/?filter=_id eq '+eventId,
    }));
  }
  if(deptId === null) {
    promises.push($.ajax({
      url: '../api/v1/departments',
    }));
  }
  else {
    promises.push($.ajax({
      url: '../api/v1/departments$filter=departmentID eq '+deptId,
    }));
  }
  promises.push($.ajax({
    url: '../api/v1/participants'
  }));
  promises.push($.ajax({
    url: '../api/v1/shifts?$filter=needEEApproval eq true'
  }));
  Promise.allSettled(promises).then(gotInitialData);
}

$(initPage);
