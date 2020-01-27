var deptId;
var table;

function gotDept(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to locate department '+deptId);
    console.log(jqXHR);
    return;
  }
  $('#deptName').html(jqXHR.responseJSON.departmentName);
}

function gotDeptList(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    return;
  }
  var array = jqXHR.responseJSON;
  array = array.sort(function(a, b) {
    return a.departmentName.localeCompare(b.departmentName);
  });
  var sel = $('#deptFilter');
  for(var i = 0; i < array.length; i++) {
    if(array[i].isAdmin) {
      addOptiontoSelect(sel[0], array[i].departmentID, array[i].departmentName);
    }
  }
}

function deptFilterChanged(e) {
  var value = e.target.value;
  if(value === '*') {
    table.setData('../api/v1/shifts?$filter=status%20eq%20pending and needEEApproval ne true');
    deptId = null;
  }
  else {
    table.setData('../api/v1/departments/'+value+'/shifts?$filter=status%20eq%20pending and needEEApproval ne true');
    deptId = value;
  }
}

function upIcon(cell, formatterParams, onRendered) {
  return "<i class='fa fa-thumbs-up'></i>";
}

function downIcon(cell, formatterParams, onRendered) {
  return "<i class='fa fa-thumbs-down'></i>";
}

function dateTimeView(cell, formatterParams, onRendered) {
  var d = new Date(cell.getValue());
  return d.toString();
}

function getShiftIDFromCell(cell) {
  var row = cell.getRow();
  var rowData = row.getData();
  return rowData._id['$oid'];
}

function finishApprove(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to approve or disapprove the shift');
    console.log(jqXHR);
    return;
  }
  location.reload();
}

function approve(e, cell) {
  var id = getShiftIDFromCell(cell);
  $.ajax({
    url: '../api/v1/shifts/'+id+'/Actions/Approve',
    method: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    complete: finishApprove
  });
}

function disapprove(e, cell) {
  var id = getShiftIDFromCell(cell);
  $.ajax({
    url: '../api/v1/shifts/'+id+'/Actions/Disapprove',
    method: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    complete: finishApprove
  });
}

function initPage() {
  deptId = getParameterByName('dept');
  if(deptId !== null) {
    $.ajax({
      url: '../api/v1/departments/'+deptId,
      complete: gotDept
    });
    tableURL = '../api/v1/departments/'+deptId+'/shifts?$filter=status%20eq%20pending and needEEApproval ne true';
    $('#grouped_with').select2({width: '100%'});
  }
  else {
    $('#deptName').html('All');
    tableURL = '../api/v1/shifts?$filter=status%20eq%20pending and needEEApproval ne true';
    $.ajax({
      url: '../api/v1/departments',
      complete: gotDeptList
    });
    $('#deptFilter').change(deptFilterChanged);
  }
  table = new Tabulator("#pendingShifts", {
    ajaxURL: tableURL,
    columns:[
      {formatter: upIcon, width:40, align:"center", cellClick: approve},
      {formatter: downIcon, width:40, align:"center", cellClick: disapprove},
      {title:"ID", field:"_id.$oid", visible: false},
      {title:'Department', field: 'departmentID'},
      {title:'Role', field: 'roleID'},
      {title:'Name', field: 'name'},
      {title:'Start Date/Time', field: 'startTime', formatter: dateTimeView},
      {title:'End Date/Time', field: 'endTime', formatter: dateTimeView},
      {title:'Volunteer', field: 'participant'}
    ]
  });
}

$(initPage);

