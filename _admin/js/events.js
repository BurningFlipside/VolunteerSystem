/* global $, bootbox, Tabulator, browser_supports_input_type */
/* exported newEvent, privateEventChange, showEventWizard, makeFlipsideEvents, createFlipsideEvents */
function editDone(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to edit value!');
  }
  console.log(jqXHR);
}

function addDone(jqXHR) {
  if(jqXHR.status === 200) {
    location.reload();
    return;
  }
  alert('Unable to add event!');
  console.log(jqXHR);
}

function valueChanged(value, field, id) {
  var propParts = field.split('.');
  var obj = {};
  var current = obj;
  for(var i = 0; i < propParts.length-1; i++) {
    current = current[`${propParts[i]}`] = {}; // eslint-disable-line security/detect-object-injection
  }
  current[propParts[propParts.length-1]] = value;
  $.ajax({
    url: '../api/v1/events/'+id,
    method: 'PATCH',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    dataType: 'json',
    complete: editDone
  });
}

function dataChanged(cell) {
  console.log(cell);
  valueChanged(cell.getValue(), cell.getColumn().getField(), cell.getRow().getData()['_id']['$oid']);
}

function privateEventChange(target) {
  if(target.checked) {
    $('#volList').removeAttr('disabled');
    $('#invites').removeAttr('disabled');
  } else {
    $('#volList').attr('disabled', true);
    $('#invites').attr('disabled', true);
  }
}

function newEvent(e) {
  var obj = {};
  obj.departments = [];
  for(var key in e) {
    if(key.startsWith('dept_')) {
      if(e[`${key}`] === true) {
        obj.departments.push(key.substring(5));
      }
    } else if(key === 'volList') {
      if(e.private === true) {
        obj.volList = e[`${key}`].split('\n');
      }
    } else {
      obj[`${key}`] = e[`${key}`];
    }
  }
  $.ajax({
    url: '../api/v1/events',
    method: 'POST',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    dataType: 'json',
    complete: addDone
  });
}

function showEventWizard() {
  if(!browser_supports_input_type('datetime-local')) {
    $('[type="datetime-local"]').flatpickr({enableTime: true});
  }
  $('#eventWizard').modal('show');
}

function makeFlipsideEvents() {
  // Get the flipside event to make sure we don't already have it
  fetch('../api/v1/events?$filter=alias eq "flipside"').then((response) => {
    if(!response.ok) {
      alert('Unable to check for existing Flipside event!');
      return;

    }
    response.json().then((data) => {
      if (data.length > 0) {
        let startDate = new Date(data[0].startTime);
        if(startDate.getYear() === (new Date()).getYear()) {
          alert('Flipside event already exists for this year!');
          return;
        }
      }
      showFlipsideEventsDialog();
    });
  });
}

function createFlipsideEvents() {
  let startDateStr = document.getElementById('flipsideStartDate').value;
  // Forse the date to be in CDT timezone sinse that is the timezone of the event.
  let startDate = new Date(startDateStr+"T09:00:00-05:00");
  let dayOfWeek = startDate.getDay();
  // We want the Tuesday of the week to include pre/post flipside shifts, so adjust the date if it's not already Tuesday
  if(dayOfWeek !== 2) {
    let diff = (2 - dayOfWeek) % 7;
    startDate.setDate(startDate.getDate() + diff);
  }
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const formattedDate = startDate.toLocaleDateString('en-CA', options);
  fetch('../api/v1/events/Actions/CreateFlipsideEvents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({startDate: formattedDate})
  }).then((response) => {
    if(!response.ok) {
      alert('Unable to create Flipside events!');
      console.log(response);
      return;
    }
    location.reload();
  });
}

function showFlipsideEventsDialog() {
  const myModal = new bootstrap.Modal('#flipsideEventModal');
  myModal.show();
}

function delIcon() {
  return "<i class='fa fa-trash'></i>";
}

function editIcon() {
  return "<i class='fa fa-pencil-alt'></i>";
}

function dateTimeView(cell) {
  var d = new Date(cell.getValue());
  return d.toString();
}

function deleteDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to delete event!');
    return;
  }
  location.reload();
}

function getShiftsBeforeDelete(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to determine if event has shifts!');
    return;
  }
  if(jqXHR.responseJSON.length === 0) {
    var data = this;
    bootbox.confirm({
      message: 'Are you sure you want to delete the event "'+this.name+'"?', 
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
            url: '../api/v1/events/'+data['_id']['$oid'],
            method: 'DELETE',
            complete: deleteDone
          });
        }
      }
    });
  } else {
    bootbox.alert('This event has one or more shifts. All shifts must be deleted first!');
  }
}

function delEvent(e, cell) {
  var data = cell.getRow().getData();
  $.ajax({
    url: '../api/v1/events/'+data['_id']['$oid']+'/shifts',
    context: data,
    complete: getShiftsBeforeDelete
  });
}

function editEvent(e, cell) {
  var data = cell.getRow().getData();
  console.log(data);
}

function hideOldEvents(data) {
  let endTime = new Date(data.endTime);
  return endTime >= Date.now();
}

function hideOldChanged(e) {
  let table = Tabulator.findTable('#events')[0];
  if(!e.target.checked) {
    table.clearFilter();
    return;
  }
  table.addFilter(hideOldEvents);
}

function initPage() {
  let table = new Tabulator('#events', {
    ajaxURL: '../api/v1/events',
    columns:[
      {formatter: delIcon, width:40, hozAlign: 'center', cellClick: delEvent},
      {formatter: editIcon, width:40, hozAlign: 'center', cellClick: editEvent},
      {title: 'ID', field: '_id.$oid', visible: false},
      {title: 'Name', field: 'name', editor: 'input'},
      {title: 'Start Date/Time', field: 'startTime', formatter: dateTimeView},
      {title: 'End Date/Time', field: 'endTime', formatter: dateTimeView},
      {title: 'Private', field: 'private', editor: 'tickCross', formatter: 'tickCross'},
      {title: 'Volunteer List', field: 'volList', editor: 'input'},
      {title: 'Department List', field: 'departments', editor: 'input'},
      {title: 'Tickets Needed', field: 'tickets', formatter: 'tickCross'},
      {title: 'Alias', field: 'alias', editor: 'input'}
    ]
  });
  table.on('cellEdited', dataChanged);
  table.on('tableBuilt', () => {
    table.setData();
    table.setFilter(hideOldEvents);
  });
  fetch('../api/v1/departments').then((response) => {
    if(response.httpStatusCode === 401) {
      return;
    }
    response.json().then((data) => {
      let departmentList = document.getElementById('deptList');
      for(let dept of data) {
        departmentList.innerHTML += '<div class="col-sm-2"><input class="form-control" type="checkbox" name="dept_'+dept.departmentID+'" id="dept_'+dept.departmentID+'"></div><div class="col-sm-10">'+dept.departmentName+'</div>';
      }
    });
  });
  document.getElementById('hideOld').addEventListener('change', hideOldChanged);
}

window.onload = initPage;
