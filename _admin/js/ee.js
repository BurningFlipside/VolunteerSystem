/* global $, bootbox, Tabulator, getParameterByName*/
/* exported approve, dispprove*/
var table;

function eventChanged(e) {
  var eventID = e.target.value;
  if(table === null) {
    return;
  }
  table.setFilter(function(data) {
    for(let shift of data.shifts) {
      if(shift.eventID === eventID) {
        return true;
      }
    }
    return false;
  });
}

function deptChanged(e) {
  var deptID = e.target.value;
  if(table === null) {
    return;
  }
  table.setFilter(function(data) {
    for(let shift of data.shifts) {
      if(shift.departmentID === deptID) {
        return true;
      }
    }
    return false;
  });
}

function processEvents(data) {
  let events = {};
  let eventSelect = $('#eventFilter');
  for(let event of data) {
    if(event.why === 'Event is in the past' || event.eeLists === undefined) {
      continue;
    }
    events[event['_id']['$oid']] = event;
    eventSelect.append($('<option/>', {value: event['_id']['$oid'], text: event.name}));
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
  for(let dept of data) {
    depts[dept.departmentID] = dept;
    deptSelect.append($('<option/>', {value: dept.departmentID, text: dept.departmentName}));
  }
  deptSelect.data('depts', depts);
  deptSelect.change(deptChanged);
  return depts;
}

function processParticipants(data) {
  var vols = {};
  for(let user of data) {
    vols[user.uid] = user;
  }
  return vols;
}

function processRoles(data) {
  var obj = {};
  for(let role of data) {
    obj[role.short_name] = role;
  }
  return obj;
}

function shiftLinkDisplay() {
  return '<i class="far fa-window-maximize"></i>';
}

function showShifts(e, cell) {
  var data = cell.getRow().getData();
  var backend = $('body').data('backend');
  var msg = '<table class="table"><thead><tr><th>Department</th><th>Role</th><th>Start Time</th><th>End Time</th></tr></thead><tbody>';
  var eventFilter = $('#eventFilter').val();
  for(let shift of data.shifts) {
    let name = shift.department;
    if(name === undefined) {
      name = shift.departmentID;
      if(backend.depts[shift.departmentID] !== undefined) {
        name = backend.depts[shift.departmentID].departmentName;
      }
    }
    let roleName = shift.roleID;
    if(backend.roles[`${roleName}`] !== undefined) {
      roleName = backend.roles[`${roleName}`].display_name;
    }
    let start = new Date(shift.startTime);
    let end = new Date(shift.endTime);
    if(eventFilter === '*' || eventFilter === shift.eventID) {
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
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    Sentry.withScope(scope => {
      scope.setExtra('jqXHR', jqXHR);
      scope.setLevel('info');
      Sentry.captureMessage('EE approval got back '+jqXHR.status);
    });
    switch(jqXHR.status) {
      case 401:
        alert('Unable to approve EE because you are not allowed to approve that type.');
        break;
      case 404:
        alert('Unable to approve EE because the user could not be found.');
        break;
      default:
        alert('Unable to approve EE due to internal error.');
        break;
    }
    return;
  }
  location.reload();
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
      message: 'There was an error obtaining the current ticket status! Are you sure you want to approve early entry (It might not migrate to the ticket system)?',
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
  } else if(jqXHR.responseJSON.ticket !== true) {
    bootbox.confirm({
      message: 'We could not find a ticket for this user! Are you sure you want to approve early entry (It might not migrate tot the ticket system)?',
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
  } else {
    reallyApprove(data);
  }
}

function approve(type, uid, ee) {
  var obj = {};
  obj.event = $('#eventFilter').val();
  if(obj.event === null) {
    alert('More than one event has early entry/late stay! Please select an event first!');
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
    alert('More than one event has early entry/late stay! Please select an event first!');
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
  let overrideAF = false;
  for(let shift of data.shifts) {
    if(shift.departmentID === 'AAR') {
      overrideAF = true;
    }
  }
  if(($('body').data('af') === 1) || overrideAF) {
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
  //Cleanup the uid's in the eelists
  for(let eventID in obj.events) {
    let event = obj.events[`${eventID}`];
    for(let eeType in event.eeLists) {
      let eeList = event.eeLists[parseInt(eeType, 10)];
      for(let uid in eeList) {
        if(uid.indexOf('+') !== -1) {
          //This uid might have had a space in it...
          if(obj.vols[`${uid}`] === undefined) {
            let rep = uid.replace('+', ' ');
            if(obj.vols[`${rep}`] !== undefined) {
              eeList[`${rep}`] = eeList[`${uid}`];
              delete eeList[`${uid}`];
            }
          }
        } else if(obj.vols[`${uid}`] === undefined) {
          console.log(uid);
          let rep = decodeURIComponent(uid);
          if(obj.vols[`${rep}`] !== undefined) {
            console.log(rep);
            eeList[`${rep}`] = eeList[`${uid}`];
            delete eeList[`${uid}`];
          }
        }
      }
    }
  }
  for(let shift of shiftResults.value) {
    if(shift.participant === '' || shift.participant === undefined) {
      continue;
    }
    if(obj.vols[shift.participant] === undefined) {
      alert('Could not locate volunteer '+shift.participant);
      continue;
    }
    if(obj.vols[shift.participant].shifts === undefined) {
      obj.vols[shift.participant].shifts = [];
    }
    obj.vols[shift.participant].shifts.push(shift);
  }
  var rows = [];
  for(var uid in obj.vols) {
    var vol = obj.vols[`${uid}`];
    if(vol.shifts !== undefined) {
      var row = {id: uid, name: vol.firstName+' "'+vol.burnerName+'" '+vol.lastName, eeType: '', shifts: vol.shifts};
      if(vol.burnerName.trim().length === 0 || vol.firstName === vol.burnerName) {
        row.name = vol.firstName+' '+vol.lastName;
      }
      var bestEE = -1;
      let lateStay = false;
      for(var id in obj.events) {
        var event = obj.events[`${id}`];
        if(event.eeLists !== undefined) {
          for(var eeType in event.eeLists) {
            var list = event.eeLists[`${eeType}`];
            if(list[`${uid}`] !== undefined) {
              if(parseInt(eeType, 10) > bestEE) {
                bestEE = parseInt(eeType, 10);
              }
              row.AAR = list[`${uid}`].AAR;
              row.AF = list[`${uid}`].AF;
              row.Lead = list[`${uid}`].Lead;
              if(parseInt(eeType, 10) === -2) {
                lateStay = true;
              }
            }
          }
        }
      }
      if(bestEE === -1 && lateStay) {
        bestEE = -2;
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
        case -2:
          row.eeType = 'Late Stay';
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
  } else {
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
  } else {
    promises.push($.ajax({
      url: '../api/v1/departments?$filter=departmentID eq \''+deptId+'\'',
    }));
    promises.push($.ajax({
      url: '../api/v1/departments/'+deptId+'/roles',
    }));
    $('#deptFilter').hide();
    $('[for=deptFilter]').hide();
  }
  promises.push($.ajax({
    url: '../api/v1/participants'
  }));
  if(deptId === null) {
    promises.push($.ajax({
      url: '../api/v1/shifts?$filter=needEEApproval eq true&futureOnly=true'
    }));
  } else {
    promises.push($.ajax({
      url: '../api/v1/shifts?$filter=needEEApproval eq true and departmentID eq '+deptId+'&futureOnly=true'
    }));
  }
  Promise.allSettled(promises).then(gotInitialData);
}

$(initPage);
