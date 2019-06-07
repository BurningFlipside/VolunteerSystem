var departments = {};
var events;

function doneCreatingShift(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to save shift!');
    console.log(jqXHR);
    return;
  }
  $('#newShift').modal('hide');
  location.reload();
}

function createShift(e) {
  var shift = e.data;
  $.ajax({
    url: '../api/v1/departments/'+shift.departmentID+'/shifts',
    contentType: 'application/json',
    data: JSON.stringify(shift),
    type: 'POST',
    dataType: 'json',
    complete: doneCreatingShift
  });
}

function createCopies(e) {
  var shift = e.data;
  var copies = shift.copies;
  delete shift.copies;
  var promises = [];
  for(var i = 0; i < copies; i++) {
    promises.push($.ajax({
      url: '../api/v1/departments/'+shift.departmentID+'/shifts',
      contentType: 'application/json',
      data: JSON.stringify(shift),
      type: 'POST',
      dataType: 'json'
    }));
  }
  Promise.all(promises).then((values) => {
    $('#newShift').modal('hide');
    location.reload();
  }).catch(e => {
    console.log(e); 
    alert('One of more shift failed to save!'); 
    location.reload();
  });
}

function gotDepartmentRoles(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to obtain roles');
    console.log(jqXHR);
    return;
  }
  var options = this;
  var inputs = options.inputs;
  var array = jqXHR.responseJSON;
  for(var i = 0; i < inputs.length; i++) {
    if(inputs[i].id === 'roleID') {
      inputs[i].options = [];
      for(var j = 0; j < array.length; j++) {
        inputs[i].options.push({value: array[j].short_name, text: array[j].display_name});
      }
    }
  }
  flipDialog.dialog(options);
}

function addNewShift(elem) {
  var href = elem.getAttribute("href");
  href = href.substring(1);
  var eventOptions = [];
  for(var i = 0; i < events.length; i++) {
    var eventOption = {value: events[i]['_id']['$id'], text: events[i].name};
    eventOptions.push(eventOption);
    if(i === 0) {
      min = events[i].startTime;
      max = events[i].endTime;
    }
  }
  var dialogOptions = {
    title: 'New Shift',
    inputs: [
      {type: 'hidden', id: 'departmentID', value: href},
      {label: 'Department', type: 'text', readonly: true, id: 'department', value: departments[href].departmentName},
      {label: 'Event', type: 'select', id: 'eventID', options: eventOptions, onChange: setBoundaryTimes},
      {label: 'Role', type: 'select', id: 'roleID'},
      {label: 'Start Time', type: 'datetime-local', id: 'startTime', min: min, max: max, onChange: setMinEndTime, required: true},
      {label: 'End Time', type: 'datetime-local', id: 'endTime', min: min, max: max, required: true},
      {label: 'Enabled', type: 'checkbox', id: 'enabled'},
      {label: 'Shift Name', type: 'text', id: 'name'},
      {label: 'Entry/Late Stay Window', type: 'select', id: 'earlyLate', options: [
        {value: -2, text: 'Late Stay (Monday Evening)'},
        {value: -1, text: 'Regular Entry (Thursday Morning)', selected: true},
        {value: 0, text: 'Wednesday Afternoon (Theme Camp/Art) Early Entry'},
        {value: 1, text: 'Wednesday Morning Infrastructure Setup'},
        {value: 2, text: 'Tuesday Morning Infrastructure Setup'}
      ]}
    ],
    buttons: [
      {input: {type: 'number', id: 'copies', text: 'Copies'}, text: 'Create Copies', callback: createCopies}, 
      {text: 'Create Shift', callback: createShift}
    ]
  };
  $.ajax({
    url: '../api/v1/departments/'+href+'/roles',
    complete: gotDepartmentRoles,
    context: dialogOptions
  });
  return false;
}

function shiftDeleted(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to delete shift!');
    return;
  }
  location.reload();
}

function deleteShift(e) {
  bootbox.confirm({
    message: "Are you sure you want to delete this shift?",
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
        $.ajax({
          url: '../api/v1/shifts/'+e.data['_id']['$id'],
          method: 'DELETE',
          complete: shiftDeleted
        });
      }
    }
  });
}

function shiftEditDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to save shift');
    return;
  }
  location.reload();
}

function saveShift(e) {
  var shift = e.data;
  $.ajax({
    url: '../api/v1/shifts/'+shift['_id']['$id'],
    method: 'PATCH',
    contentType: 'application/json',
    data: JSON.stringify(shift),
    complete: shiftEditDone
  });
}

function gotShiftToEdit(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to obtain shift!');
    return;
  }
  var shift = jqXHR.responseJSON;
  var eventOptions = [];
  for(var i = 0; i < events.length; i++) {
    var eventOption = {value: events[i]['_id']['$id'], text: events[i].name};
    if(shift.eventID === events[i]['_id']['$id']) {
      eventOption.selected = true;
    }
    eventOptions.push(eventOption);
  }
  for(var i = 0; i < events.length; i++) {
    if(events[i]['_id']['$id'] === shift.eventID) {
      myevent = events[i];
      break;
    }
  }
  var dialogOptions = {
    title: 'Edit Shift',
    data: shift,
    inputs: [
      {type: 'hidden', id: 'departmentID'},
      {label: 'Department', type: 'text', readonly: true, id: 'department', value: departments[shift.departmentID].departmentName},
      {label: 'Event', type: 'select', id: 'eventID', options: eventOptions, onChange: setBoundaryTimes},
      {label: 'Role', type: 'select', id: 'roleID'},
      {label: 'Start Time', type: 'datetime-local', id: 'startTime', min: myevent.startTime, max: myevent.endTime, onChange: setMinEndTime, required: true},
      {label: 'End Time', type: 'datetime-local', id: 'endTime', min: myevent.startTime, max: myevent.endTime, required: true},
      {label: 'Enabled', type: 'checkbox', id: 'enabled'},
      {label: 'Shift Name', type: 'text', id: 'name'},
      {label: 'Entry/Late Stay Window', type: 'select', id: 'earlyLate', options: [
        {value: -2, text: 'Late Stay (Monday Evening)'},
        {value: -1, text: 'Regular Entry (Thursday Morning)', selected: true},
        {value: 0, text: 'Wednesday Afternoon (Theme Camp/Art) Early Entry'},
        {value: 1, text: 'Wednesday Morning Infrastructure Setup'},
        {value: 2, text: 'Tuesday Morning Infrastructure Setup'}
      ]}
    ],
    buttons: [
      {text: 'Delete Shift', callback: deleteShift},
      {text: 'Save Shift', callback: saveShift}
    ]
  };
  $.ajax({
    url: '../api/v1/departments/'+shift.departmentID+'/roles',
    complete: gotDepartmentRoles,
    context: dialogOptions
  });
}

function editShift(elem) {
  var href = elem.getAttribute("href");
  href = href.substring(1);
  $.ajax({
    url: '../api/v1/shifts/'+href,
    complete: gotShiftToEdit
  });
  return false;
}

function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to obtain shifts');
    console.log(jqXHR);
    return;
  }
  var array = jqXHR.responseJSON;
  for(var i = 0; i < array.length; i++) {
    if(array[i].name !== undefined && array[i].name.length > 0) {
      shiftName = array[i].name;
    }
    else {
      var start = new Date(array[i].startTime);
      var end = new Date(array[i].endTime);
      shiftName = array[i].roleID+': '+start+' to '+end;
    }
    $('#'+array[i].departmentID+'List').append('<a href="#'+array[i]['_id']['$id']+'" class="list-group-item list-group-item-action" onclick="return editShift(this);">'+shiftName+'</a>');
  }
}

function gotEvents(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to obtain events');
    console.log(jqXHR);
    return;
  }
  events = jqXHR.responseJSON;
}

function gotDepartments(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to obtain departments');
    console.log(jqXHR);
    return;
  }
  var array = jqXHR.responseJSON;
  var accordian = $('#accordion');
  for(var i = 0; i < array.length; i++) {
    departments[array[i].departmentID] = array[i];
    accordian.append('<div class="card"><div class="card-header" id="heading'+array[i].departmentID+'"><h2 class="mb-0"><button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse'+array[i].departmentID+'" aria-expanded="true" aria-controls="collapse'+array[i].departmentID+'">'+array[i].departmentName+'</button></h2></div><div id="collapse'+array[i].departmentID+'" class="collapse show" aria-labelledby="heading'+array[i].departmentID+'" data-parent="#accordion"><div class="card-body"><div class="list-group" id="'+array[i].departmentID+'List"><a href="#'+array[i].departmentID+'" class="list-group-item list-group-item-action" onclick="return addNewShift(this);"><i class="fas fa-plus"></i> Add new shift</a></div></div></div></div>');
  }
  $.ajax({
    url: '../api/v1/shifts',
    complete: gotShifts
  });
}

function setMinEndTime(e) {
  $('#endTime').attr('min', e.target.value);
}

function setBoundaryTimes(e) {
  var id = e.target.value;
  for(var i = 0; i < events.length; i++) {
    if(events[i]['_id']['$id'] === id) {
      myevent = events[i];
      break;
    }
  }
  $('#startTime').attr('min', myevent.startTime);
  $('#startTime').attr('max', myevent.endTime);
  $('#endTime').attr('min', myevent.startTime);
  $('#endTime').attr('max', myevent.endTime);
}

function initPage() {
  $.ajax({
    url: '../api/v1/events',
    complete: gotEvents
  });
  $.ajax({
    url: '../api/v1/departments',
    complete: gotDepartments
  });
  $('#startTime').change(setMinEndTime);
  $('#eventID').change(setBoundaryTimes);
}

$(initPage);
