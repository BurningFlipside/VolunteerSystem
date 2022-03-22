/* global $, bootbox*/
function doneShiftCopy(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Shift copy failed!');
    return;
  }
  let str = 'Successfully created '+jqXHR.responseJSON.success+' shifts.';
  if(jqXHR.responseJSON.fail > 0) {
    str+=' Failed on '+jqXHR.responseJSON.fail+' shifts';
  }
  bootbox.alert(str);
}

function doShiftCopy() {
  let srcId = $('#src').val();
  let dstId = $('#dst').val();
  let deptId = $('#department').val();
  $.ajax({
    url: '../api/v1/shifts/Actions/EventClone',
    contentType: 'application/json',
    data: JSON.stringify({src: srcId, dst: dstId, dept: deptId}),
    type: 'POST',
    dataType: 'json',
    complete: doneShiftCopy
  });
}

function getEventLength(e) {
  let start = new Date(e.startTime);
  let end = new Date(e.endTime);
  let timeDiff = end.getTime() - start.getTime();
  return Math.round(timeDiff/(1000*60*60*24));
}

function gotSrcAndDstEvents(results) {
  let src = results.shift().value;
  let dst = results.shift().value;
  let srcLen = getEventLength(src);
  let dstLen = getEventLength(dst);
  if(srcLen !== dstLen) {
    $('#nextStep').append('<div class="alert alert-danger" role="alert">'+src.name+' and '+dst.name+' are differnt lengths so copy will not work!</div>');
  } else {
    let button = $('<button type="button" class="btn btn-primary">Copy Shifts!</button>');
    button.click(doShiftCopy);
    $('#nextStep').append(button);
  }
}


function srcOrDstChanged() {
  $('#nextStep').empty();
  let promises = [];
  promises.push($.ajax({
    url: '../api/v1/events/'+$('#src').val(),
  }));
  promises.push($.ajax({
    url: '../api/v1/events/'+$('#dst').val(),
  }));
  Promise.allSettled(promises).then(gotSrcAndDstEvents);
}

function gotEvents(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to obtain shift list!');
    return;
  }
  let events = jqXHR.responseJSON;
  let eventsWithDeptShifts = this;
  for(let event of events) {
    //Source Events must be in the eventsWithDeptShifts list
    if(eventsWithDeptShifts.includes(event['_id']['$oid'])) {
      $('#src').append($('<option>', {
        value: event['_id']['$oid'],
        text: event.name
      }));
    } else {
      $('#dst').append($('<option>', {
        value: event['_id']['$oid'],
        text: event.name
      }));
    }
  }
  srcOrDstChanged();
}

function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to obtain shift list!');
    return;
  }
  let eventIDs = new Set();
  let shifts = jqXHR.responseJSON;
  for(let shift of shifts) {
    eventIDs.add(shift.eventID);
  }
  if(eventIDs.size === 0) {
    alert('Department has no past events with shifts to copy from!');
    return;
  }
  //Now get all events, past and future
  $.ajax({
    url: '../api/v1/events',
    complete: gotEvents,
    context: Array.from(eventIDs)
  });
}

function deptChanged() {
  let id = $('#department').val();
  //Get events that have shifts for this department
  $.ajax({
    url: '../api/v1/shifts?$filter=departmentID eq '+id,
    complete: gotShifts
  });
}

function gotDepartments(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to obtain department list!');
    return;
  }
  let depts = jqXHR.responseJSON;
  for(let dept of depts) {
    if(dept.isAdmin) {
      $('#department').append($('<option>', {
        value: dept.departmentID,
        text: dept.departmentName
      }));
    }
  }
  deptChanged();
}

function initPage() {
  $.ajax({
    url: '../api/v1/departments',
    complete: gotDepartments
  });
  $('#department').change(deptChanged);
  $('#src').change(srcOrDstChanged);
  $('#dst').change(srcOrDstChanged);
}

$(initPage);
/* vim: set tabstop=2 shiftwidth=2 expandtab: */
