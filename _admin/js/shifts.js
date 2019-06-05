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

function getShiftFromForm() {
  var shift = {};
  shift.departmentID = $('#departmentID').val();
  shift.eventID = $('#eventID').val();
  shift.roleID = $('#role').val();
  shift.startTime = $('#startTime').val();
  shift.endTime = $('#endTime').val();
  shift.enabled = $('#enabled').prop('checked');
  shift.name = $('#shiftName').val();
  shift.earlyLate = $('#earlyEntryWindow').val();
  return shift;
}

function createShift() {
  var shift = getShiftFromForm();
  $.ajax({
    url: '../api/v1/departments/'+shift.departmentID+'/shifts',
    contentType: 'application/json',
    data: JSON.stringify(shift),
    type: 'POST',
    dataType: 'json',
    complete: doneCreatingShift
  });
}

function createCopies() {
  var copies = $('#copies').val();
  var promises = [];
  var shift = getShiftFromForm();
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
  $('#departmentID').val(this.departmentID);
  $('#department').val(this.departmentName);
  $('#role').find('option').remove();
  var array = jqXHR.responseJSON;
  for(var i = 0; i < array.length; i++) {
    $('#role').append('<option value="'+array[i].short_name+'">'+array[i].display_name+'</option>');
  }
  $('#newShift').modal('show');
}

function addNewShift(elem) {
  var href = elem.getAttribute("href");
  href = href.substring(1);
  $.ajax({
    url: '../api/v1/departments/'+href+'/roles',
    complete: gotDepartmentRoles,
    context: departments[href]
  });
  $('#eventID').find('option').remove();
  for(var i = 0; i < events.length; i++) {
    if(events[i].departments === undefined || events[i].departments.length === 0 || events[i].departments.includes(href)) {
      $('#eventID').append('<option value="'+events[i]['_id']['$id']+'">'+events[i].name+'</option>');
    }
  }
  setBoundaryTimes({target: $('#eventID')[0]});
  //console.log(href);
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
