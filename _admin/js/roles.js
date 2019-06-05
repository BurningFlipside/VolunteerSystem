var deptId;
var table;

function editDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to edit value!');
  }
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
  var url = '../api/v1/departments/'+deptId+'/roles/'+id;
  if(deptId === null) {
    url = '../api/v1/roles/'+id;
  }
  $.ajax({
    url: url,
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
  var rowData = cell.getRow().getData();
  var departmentID = rowData.departmentID;
  var rows = cell.getTable().getRows();
  var editor = document.createElement("select");
  var value = cell.getValue();
  var values = [];
  if(value !== undefined) {
    values = value.split(',');
  }

  editor.setAttribute("multiple", true);
  for(var i = 0; i < rows.length; i++) {
    var data = rows[i].getData();
    if(data.short_name === rowData.short_name) {
      continue;
    }
    if(data.departmentID === departmentID) {
      var opt = document.createElement("option");
      opt.value = data.short_name;
      if(values.includes(data.short_name)) {
        opt.selected = true;
      }
      opt.text = data.display_name;
      editor.add(opt);
    }
  }
  function successFunc(){
    var data = $(editor).select2('data');
    var ret = '';
    for(var i = 0; i < data.length; i++) {
      ret+=data[i].id;
      if(i < data.length-1) {
        ret+=',';
      }
    }
    success(ret);
  }
  onRendered(function(){
    var sel2 = $(editor).select2();
    sel2.select2('open');
    sel2.change(successFunc);
    sel2.on('blur', successFunc);
  });
  return editor;
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

