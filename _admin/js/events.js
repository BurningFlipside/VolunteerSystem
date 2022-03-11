var table;

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
    current = current[propParts[i]] = {};
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
  valueChanged(cell.getValue(), cell.getColumn().getField(), cell.getRow().getData()['_id']['$oid']);
}

function privateEventChange(target) {
  if(target.checked) {
    $('#volList').removeAttr('disabled');
    $('#invites').removeAttr('disabled');
  }
  else {
    $('#volList').attr('disabled', true);
    $('#invites').attr('disabled', true);
  }
}

function gotDepartments(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to get department list!');
    return;
  }
  var array = jqXHR.responseJSON;
  var deptList = $('#deptList');
  for(var i = 0; i < array.length; i++) {
    deptList.append('<div class="col-sm-2"><input class="form-control" type="checkbox" name="dept_'+array[i].departmentID+'" id="dept_'+array[i].departmentID+'"></div><div class="col-sm-10">'+array[i].departmentName+'</div>');
  }
}

function newEvent(e) {
  var obj = {};
  obj.departments = [];
  for(var key in e) {
    if(key.startsWith('dept_')) {
      if(e[key] === true) {
        obj.departments.push(key.substring(5));
      }
    }
    else if(key === 'volList') {
      if(e.private === true) {
        obj.volList = e[key].split('\n');
      }
    }
    else {
      obj[key] = e[key];
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

function delIcon(cell, formatterParams, onRendered) {
  return "<i class='fa fa-trash'></i>";
}

function editIcon(cell, formatterParams, onRendered) {
  return "<i class='fa fa-pencil-alt'></i>";
}

function dateTimeView(cell, formatterParams, onRendered) {
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
    }});
  }
  else {
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

function initPage() {
  table = new Tabulator("#events", {
    ajaxURL: '../api/v1/events',
    columns:[
      {formatter: delIcon, width:40, align:"center", cellClick: delEvent},
      {formatter: editIcon, width:40, align:"center", cellClick: editEvent},
      {title:"ID", field:"_id.$oid", visible: false},
      {title:'Name', field: 'name', editor:"input"},
      {title:'Start Date/Time', field: 'startTime', formatter: dateTimeView},
      {title:'End Date/Time', field: 'endTime', formatter: dateTimeView},
      {title:'Private', field: 'private', editor: 'tickCross', formatter: 'tickCross'},
      {title:'Volunteer List', field: 'volList', editor: 'input'},
      {title:'Department List', field: 'departments', editor: 'input'},
      {title:'Tickets Needed', field: 'tickets', formatter: 'tickCross'},
      {title:'Alias', field: 'alias', editor: 'input'}
    ],
    cellEdited: dataChanged
  });
  $.ajax({
    url: '../api/v1/departments',
    complete: gotDepartments
  });
}

$(initPage);
