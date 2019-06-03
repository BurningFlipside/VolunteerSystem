var deptId;
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
  var propParts = field.split('.');
  var obj = {};
  var current = obj;
  for(var i = 0; i < propParts.length-1; i++) {
    current = current[propParts[i]] = {};
  }
  current[propParts[propParts.length-1]] = value;
  $.ajax({
    url: '../api/v1/departments/'+deptId+'/roles/'+id,
    method: 'PATCH',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    dataType: 'json',
    complete: editDone
  });
}

function dataChanged(cell) {
  valueChanged(cell.getValue(), cell.getColumn().getField(), cell.getRow().getData()['short_name']);
}

function gotDept(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to locate department '+deptId);
    console.log(jqXHR);
    return;
  }
  $('#deptName').html(jqXHR.responseJSON.departmentName);
}

function newRole() {
  bootbox.prompt("Please enter the new role's short name", function(result){
    var obj = {short_name: result};
    $.ajax({
      url: '../api/v1/departments/'+deptId+'/roles',
      method: 'POST',
      data: JSON.stringify(obj),
      contentType: 'application/json',
      dataType: 'json',
      complete: addDone
    });
  });
}

function groupedWithEditor(cell, onRendered, success, cancel, editorParams) {
  console.log(cell);
}

function initPage() {
  deptId = getParameterByName('dept');
  if(deptId !== null) {
    $.ajax({
      url: '../api/v1/departments/'+deptId,
      complete: gotDept
    });
    tableURL = '../api/v1/departments/'+deptId+'/roles';
  }
  else {
    $('#deptName').html('All');
    tableURL = '../api/v1/roles';
    $('#newRoleBtn').attr("disabled", true).attr('title', 'Adding a new role is disabled except on the individual department pages');
  }
  table = new Tabulator("#roles", {
    ajaxURL: tableURL,
    columns:[
      {title:"ID", field:"_id.$id", visible: false},
      {title:'Short Name', field: 'short_name'},
      {title:'Name', field: 'display_name', editor: 'input'},
      {title:'Description', field: 'description', editor:"textarea", formatter:"html", width: 250},
      {title:'Public', field: 'publicly_visible', editor: 'tickCross', formatter: 'tickCross'},
      {title:'Groups', field: 'groups_allowed', editor: 'tickCross', formatter: 'tickCross'},
      {title:'Can be grouped with', field: 'grouped_with', editor: groupedWithEditor, formatter:"html"}
    ],
    cellEdited: dataChanged
  });
}

$(initPage);

