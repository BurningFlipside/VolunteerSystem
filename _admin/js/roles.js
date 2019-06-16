var deptId;
var table;

function roleNameUpdated() {
  var disp_name = $('#display_name').val();
  var id = disp_name.replace(/\w/g, "_");
  id = id.replace(/[\/\\]/g, '_');
  var full_id = deptId+'_'+id;
  $('#short_name').val(full_id);
}

function groupsAllowedUpdated() {
  var allowed = $('#groups_allowed')[0].checked;
  if(allowed) {
    $('#grouped_with').removeAttr('disabled');
  }
  else {
    $('#grouped_with').attr('disabled', true);
  }
}

function publiclyVisibleUpdated() {
  var allowed = $('#publicly_visible')[0].checked;
  var email = $('#onEmailList')[0].checked;
  var inputs = $('#roleReqs input[name!="publicly_visible"]');
  var textareas = $('#roleReqs textarea');
  if(allowed) {
    inputs.attr('disabled', true);
    textareas.attr('disabled', true);
  }
  else {
    inputs.removeAttr('disabled');
    if(email) {
      textareas.removeAttr('disabled');
    }
  }
}

function onEmailListUpdated() {
  var allowed = $('#onEmailList')[0].checked;
  if(allowed) {
    $('[id="requirements.email_list"]').removeAttr('disabled');
  }
  else {
    $('[id="requirements.email_list"]').attr('disabled', true);
  }
}

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

function newRole(role) {
  delete role.onEmailList;
  role.short_name = role.short_name.replace(/\w/g, "_");
  role.short_name = role.short_name.replace(/[\/\\]/g, '_');
  $.ajax({
    url: '../api/v1/departments/'+deptId+'/roles/',
    method: 'POST',
    data: JSON.stringify(role),
    contentType: 'application/json',
    dataType: 'json',
    complete: addDone
  });
}

function showRoleWizard() {
  $('#roleWizard').modal('show');
}

function groupFormatter(cell, formatterParams, onRendered) {
  var value = cell.getValue();
  if(value === undefined) {
    return '';
  }
  if(Array.isArray(value)) {
    return value.join(',');
  }
  return value;
}

function groupedWithEditor(cell, onRendered, success, cancel, editorParams) {
  var rowData = cell.getRow().getData();
  var departmentID = rowData.departmentID;
  var rows = cell.getTable().getRows();
  var editor = document.createElement("select");
  var value = cell.getValue();
  var values = [];
  if(value !== undefined) {
    if(Array.isArray(value)) {
      values = value;
    }
    else {
      values = value.split(',');
    }
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

function gotDeptList(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    return;
  }
  var array = jqXHR.responseJSON;
  var sel = $('#deptFilter');
  for(var i = 0; i < array.length; i++) {
    addOptiontoSelect(sel[0], array[i].departmentID, array[i].departmentName);
  }
}

function deptFilterChanged(e) {
  var value = e.target.value;
  if(value === '*') {
    table.setData('../api/v1/roles');
  }
  else {
    table.setData('../api/v1/departments/'+value+'/roles');
  }
}

function gotRoles(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    return;
  }
  var array = jqXHR.responseJSON;
  for(var i = 0; i < array.length; i++) {
    var newOption = new Option(array[i].display_name, array[i].short_name, false, false);
    $('#grouped_with').append(newOption);
  }
}

function initPage() {
  deptId = getParameterByName('dept');
  if(deptId !== null) {
    $.ajax({
      url: '../api/v1/departments/'+deptId,
      complete: gotDept
    });
    tableURL = '../api/v1/departments/'+deptId+'/roles';
    $('#grouped_with').select2({width: '100%'});
    $.ajax({
      url: tableURL,
      complete: gotRoles
    });
  }
  else {
    $('#deptName').html('All');
    tableURL = '../api/v1/roles';
    $('#newRoleBtn').attr("disabled", true).attr('title', 'Adding a new role is disabled except on the individual department pages');
    $.ajax({
      url: '../api/v1/departments',
      complete: gotDeptList
    });
    $('#deptFilter').change(deptFilterChanged);
  }
  table = new Tabulator("#roles", {
    ajaxURL: tableURL,
    columns:[
      {title:"ID", field:"_id.$id", visible: false},
      {title:'Short Name', field: 'short_name', visible: false},
      {title:'Name', field: 'display_name', editor: 'input'},
      {title:'Description', field: 'description', editor:"textarea", formatter:"html", width: 250},
      {title:'Public', field: 'publicly_visible', editor: 'tickCross', formatter: 'tickCross'},
      {title:'Groups', field: 'groups_allowed', editor: 'tickCross', formatter: 'tickCross'},
      {title:'Can be grouped with', field: 'grouped_with', editor: groupedWithEditor, formatter: groupFormatter},
      {title:'Hours between shifts', field: 'down_time', editor: 'number'},
      {title:'Needs ICS 100', field: 'requirements.ics100', editor: 'tickCross', formatter: 'tickCross'},
      {title:'Needs ICS 200', field: 'requirements.ics200', editor: 'tickCross', formatter: 'tickCross'},
      {title:'Needs Basic Life Support', field: 'requirements.bls', editor: 'tickCross', formatter: 'tickCross'},
      {title:'Restricted To Emails', field: 'requirements.email_list', editor:"textarea", formatter:"html", width: 250}
    ],
    cellEdited: dataChanged
  });
}

$(initPage);

