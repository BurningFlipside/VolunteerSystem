var table;

function eventChanged(e) {
  var eventID = e.target.value;
  table.setFilter(function(data) {
    let ret = false;
    for(let i = 0; i < data.shifts.length; i++) {
      if(data.shifts[i].eventID === eventID) {
        ret = true;
        break;
      }
    }
    return ret;
  });
}

function deptChanged(e) {
  var deptID = e.target.value;
  table.setFilter(function(data) {
    let ret = false;
    for(let i = 0; i < data.shifts.length; i++) {
      if(data.shifts[i].departmentID === deptID) {
        ret = true;
        break;
      }
    }
    return ret;
  });
}

function processEvents(data) {
  var events = {};
  var eventSelect = $('#eventFilter');
  for(var i = 0; i < data.length; i++) {
    if(data[i].why === 'Event is in the past') {
      continue;
    }
    if(data[i].eeLists === undefined) {
      continue;
    }
    events[data[i]['_id']['$oid']] = data[i];
    eventSelect.append($('<option/>', {value: data[i]['_id']['$oid'], text: data[i].name}));
  }
  let ids = Object.keys(events);
  if(ids.length === 1) {
    eventSelect.val(ids[0]);
  }
  eventSelect.data('events', events);
  eventSelect.change(eventChanged);
  return events;
}

function processDepts(data) {
  var depts = {};
  var deptSelect = $('#deptFilter');
  data.sort(function(a, b) {
    return a.departmentName.localeCompare(b.departmentName);
  });
  for(var i = 0; i < data.length; i++) {
    depts[data[i].departmentID] = data[i];
    deptSelect.append($('<option/>', {value: data[i].departmentID, text: data[i].departmentName}));
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

function processRoles(data) {
  var obj = {};
  for(var i = 0; i < data.length; i++) {
    obj[data[i].short_name] = data[i];
  }
  return obj;
}

function shiftLinkDisplay(cell) {
  return '<i class="far fa-window-maximize"></i>';
}

function showShifts(e, cell) {
  var data = cell.getRow().getData();
  var backend = $('body').data('backend');
  var msg = '<table class="table"><thead><tr><th>Department</th><th>Role</th><th>Start Time</th><th>End Time</th></tr></thead><tbody>';
  var eventFilter = $('#eventFilter').val();
  for(var i = 0; i < data.shifts.length; i++) {
    let name = data.shifts[i].department;
    if(name === undefined) {
      name = data.shifts[i].departmentID;
      if(backend.depts[data.shifts[i].departmentID] !== undefined) {
        name = backend.depts[data.shifts[i].departmentID].departmentName;
      }
    }
    let roleName = data.shifts[i].roleID;
    if(backend.roles[roleName] !== undefined) {
      roleName = backend.roles[roleName].display_name;
    }
    let start = new Date(data.shifts[i].startTime);
    let end = new Date(data.shifts[i].endTime);
    if(eventFilter === '*' || eventFilter === data.shifts[i].eventID) {
      msg += '<tr><td>'+name+'</td><td>'+roleName+'</td><td>'+start+'</td><td>'+end+'</td></tr>';
    }
  }
  msg += '</tbody></table>'; 
  bootbox.alert({
    title: 'Shifts for '+data.name,
    message: msg,
    size: 'xl'
  });
  console.log(data);
}

function approveDone(jqXHR) {
  console.log(jqXHR);
}

function reallyApprove(obj) {
  $.ajax({
    url: '../api/v1/events/'+obj.event+'/Actions/ApproveEE',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    method: 'POST',
    complete: approveDone
  });
}

function gotTicketStatusForConfirm(jqXHR) {
  let data = this;
  if(jqXHR.status !== 200) {
    bootbox.confirm({
      message: "There was an error obtaining the current ticket status! Are you sure you want to approve early entry (It might not migrate tot the ticket system)?",
      buttons: {
        confirm: {
          label: 'Yes'
        },
        cancel: {
          label: 'No'
        }
      },
      callback: function(result){
        if(result) {
          reallyApprove(data);
        }
      }
    });
  }
  else if(jqXHR.responseJSON.ticket !== true) {
    bootbox.confirm({
      message: "We could not find a ticket for this user! Are you sure you want to approve early entry (It might not migrate tot the ticket system)?",
      buttons: {
        confirm: {
          label: 'Yes'
        },
        cancel: {
          label: 'No'
        }
      },
      callback: function(result){
        if(result) {
          reallyApprove(data);
        }
      }
    });
  }
  else {
    reallyApprove(data);
  }
}

function approve(type, uid, ee) {
  var obj = {};
  obj.event = $('#eventFilter').val();
  if(obj.event === null) {
    alert('More than one event has early entry/late stay! Please select and event first!');
    return;
  }
  obj.approvalType = type;
  obj.uid = uid;
  obj.eeList = ee;
  $.ajax({
    url: '../api/v1/participants/'+uid+'/ticketStatus',
    context: obj,
    complete: gotTicketStatusForConfirm
  });
}

function dispprove(type, uid, ee) {
  var obj = {};
  obj.event = $('#eventFilter').val();
  if(obj.event === null) {
    alert('More than one event has early entry/late stay! Please select and event first!');
    return;
  }
  obj.approvalType = type;
  obj.uid = uid;
  obj.eeList = ee;
  $.ajax({
    url: '../api/v1/events/'+obj.event+'/Actions/DisapproveEE',
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

function gotTicketStatus(jqXHR) {
  let id = encodeURI(this.data.id);
  let elem = $(document.getElementById('ticket_'+id));
  if(jqXHR.status !== 200) {
    elem.replaceWith('<i class="text-danger">Error</i>');
    return;
  }
  var data = jqXHR.responseJSON;
  if(data.ticket) {
    elem.replaceWith('<p class="text-success">Yes</p>');
    return;
  }
  if(data.requestRecieved) {
    elem.replaceWith('<i class="text-info">Pending</i>');
    return;
  }
  if(data.request) {
    elem.replaceWith('<i class="text-warning">Requested</i>');
    return;
  }
  elem.replaceWith('<p class="text-danger">No</p>');
}

function hasTicketDisplay(cell) {
  var data = cell.getRow().getData();
  var context = {data: data, table: cell.getTable()};
  $.ajax({
    url: '../api/v1/participants/'+data.id+'/ticketStatus',
    context: context,
    complete: gotTicketStatus
  });
  return '<div id="ticket_'+encodeURI(data.id)+'" class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
}

function gotInitialData(results) {
  var eventResult = results.shift();
  var deptResult = results.shift();
  var roleResult = results.shift();
  var participantResults = results.shift();
  var shiftResults = results.shift();
  var obj = {};
  obj.events = processEvents(eventResult.value);
  obj.depts = processDepts(deptResult.value);
  obj.vols = processParticipants(participantResults.value);
  obj.roles = processRoles(roleResult.value);
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
              if(parseInt(eeType, 10) > bestEE) {
                bestEE = parseInt(eeType, 10);
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
  table = new Tabulator('#ee', {
    columns: [
      {title: 'Name', field: 'name'},
      {title: 'Early Entry Type', field: 'eeType'},
      {title: 'Shifts', formatter: shiftLinkDisplay, cellClick: showShifts},
      {title: 'AAR', formatter: aarApprovalDisplay},
      {title: 'AF', formatter: afApprovalDisplay},
      {title: 'Lead', formatter: leadApprovalDisplay},
      {title: 'Has Ticket', formatter: hasTicketDisplay}
    ]
  });
  table.setData(rows);
  $('body').data('backend', obj);
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
    $('#eventFilter').hide();
    $('[for=eventFilter]').hide();
    promises.push($.ajax({
      url: '../api/v1/events/?filter=_id eq '+eventId,
    }));
  }
  if(deptId === null) {
    promises.push($.ajax({
      url: '../api/v1/departments',
    }));
    promises.push($.ajax({
      url: '../api/v1/roles',
    }));
  }
  else {
    promises.push($.ajax({
      url: '../api/v1/departments$filter=departmentID eq '+deptId,
    }));
    promises.push($.ajax({
      url: '../api/v1/departments/'+deptId+'/roles',
    }));
  }
  promises.push($.ajax({
    url: '../api/v1/participants'
  }));
  promises.push($.ajax({
    url: '../api/v1/shifts?$filter=needEEApproval eq true&futureOnly=true'
  }));
  Promise.allSettled(promises).then(gotInitialData);
}

$(initPage);
