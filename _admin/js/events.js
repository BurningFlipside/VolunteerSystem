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
  alert('Unable to add department!');
  console.log(jqXHR);
}

function valueChanged(value, field, id) {
  console.log('../api/v1/departments/'+id);
  var propParts = field.split('.');
  var obj = {};
  var current = obj;
  for(var i = 0; i < propParts.length-1; i++) {
    current = current[propParts[i]] = {};
  }
  current[propParts[propParts.length-1]] = value;
  $.ajax({
    url: '../api/v1/departments/'+id,
    method: 'PATCH',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    dataType: 'json',
    complete: editDone
  });
}

function dataChanged(cell) {
  valueChanged(cell.getValue(), cell.getColumn().getField(), cell.getRow().getData()['departmentID']);
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
  console.log(e);
}

function showEventWizard() {
  $('#eventWizard').modal('show');
}

function editIcon(cell, formatterParams, onRendered) {
  return "<i class='fa fa-pencil'></i>";
}

function editEvent(e, cell) {
  var data = cell.getRow().getData();
  console.log(data);
}

function initPage() {
  table = new Tabulator("#events", {
    ajaxURL: '../api/v1/events',
    columns:[
      {formatter: editIcon, width:40, align:"center", cellClick: editEvent},
      {title:"ID", field:"_id.$id", visible: false},
      {title:'Name', field: 'name', editor:"input"},
      {title:'Start Date/Time', field: 'startTime', formatter:"datetime"},
      {title:'End Date/Time', field: 'endTime', formatter:"datetime"},
      {title:'Private', field: 'private', editor: 'tickCross', formatter: 'tickCross'},
      {title:'Volunteer List', field: 'volList'},
      {title:'Department List', field: 'departments'}
    ],
    cellEdited: dataChanged
  });
  $.ajax({
    url: '../api/v1/departments',
    complete: gotDepartments
  });
}

$(initPage);
