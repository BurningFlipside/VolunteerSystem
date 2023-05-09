/*global $, Tabulator, getParameterByName, addOptiontoSelect*/
var deptId;
var table;

function processDept(dept) {
  $('#deptName').html(dept.departmentName);
  return dept;
}

function processDeptList(array) {
  array = array.sort(function(a, b) {
    return a.departmentName.localeCompare(b.departmentName);
  });
  let obj = {};
  var sel = $('#deptFilter');
  for(let dept of array) {
    if(dept.isAdmin) {
      addOptiontoSelect(sel[0], dept.departmentID, dept.departmentName);
      obj[dept.departmentID] = dept;
    }
  }
  return obj;
}

function processRoles(roles) {
  let obj = {};
  for(let role of roles) {
    obj[role.short_name] = role;
  }
  return obj;
}

function gotDepts(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Failed to get department list!');
    return;
  }
  let data = jqXHR.responseJSON;
  if(Array.isArray(data)) {
    data = data.filter((dept) => {
      return dept.isAdmin;
    });
  } else {
    data = [data];
  }
  let promises = [];
  if(data.length === 1) {
    $('#deptName').html(data[0].departmentName);
    promises.push($.ajax({
      url: '../api/v1/departments/'+data[0].departmentID+'/roles'
    }));
    tableURL = '../api/v1/shifts/PendingShifts?dept='+data[0].departmentID;
    promises.push(Promise.resolve(tableURL));
    $('#grouped_with').select2({width: '100%'});
    $('#deptFilter').hide();
  } else {
    promises.push($.ajax({
      url: '../api/v1/roles'
    }));
    $('#deptName').html('All');
    tableURL = '../api/v1/shifts/PendingShifts';
    promises.push(Promise.resolve(tableURL));
    let sel = $('#deptFilter');
    for(let dept of data) {
      addOptiontoSelect(sel[0], dept.departmentID, dept.departmentName);
    }
    $('#deptFilter').change(deptFilterChanged);
  }
  Promise.allSettled(promises).then(gotInitialData);
}

function gotInitialData(results) {
  //var deptResult = results.shift();
  var roleResult = results.shift();
  let tableURL = results.shift().value;
  var obj = {};
  obj.roles = processRoles(roleResult.value);
  table = new Tabulator('#pendingShifts', {
    ajaxURL: tableURL,
    columns:[
      {formatter: upIcon, width:40, hozAlign: 'center', cellClick: approve},
      {formatter: downIcon, width:40, hozAlign: 'center', cellClick: disapprove},
      {title: 'ID', field: '_id.$oid', visible: false},
      {title: 'Department', field: 'departmentID', formatter: deptName, formatterParams: obj},
      {title: 'Role', field: 'roleID', formatter: roleName, formatterParams: obj.roles},
      {title: 'Name', field: 'name'},
      {title: 'Start Date/Time', field: 'startTime', formatter: dateTimeView},
      {title: 'End Date/Time', field: 'endTime', formatter: dateTimeView},
      {title: 'Volunteer', field: 'participant'}
    ]
  });
}

function deptFilterChanged(e) {
  var value = e.target.value;
  if(value === '*') {
    table.setData('../api/v1/shifts/PendingShifts');
    deptId = null;
  } else {
    table.setData('../api/v1/shifts/PendingShifts?dept='+value);
    deptId = value;
  }
}

function upIcon() {
  return "<i class='fa fa-thumbs-up'></i>";
}

function downIcon() {
  return "<i class='fa fa-thumbs-down'></i>";
}

function dateTimeView(cell) {
  var d = new Date(cell.getValue());
  return d.toString();
}

function deptName(cell, formatterParams) {
  let val = cell.getValue();
  if(formatterParams.dept !== undefined) {
    return formatterParams.dept.departmentName;
  }
  if(formatterParams.depts !== undefined) {
    let dept = formatterParams.depts[`${val}`];
    if(dept !== undefined) {
      return dept.departmentName;
    }
  }
  return val;
}

function roleName(cell, formatterParams) {
  let val = cell.getValue();
  if(formatterParams[`${val}`] !== undefined) {
    return formatterParams[`${val}`].display_name;
  }
  return val;
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
      complete: gotDepts
    });
  } else {
    $.ajax({
      url: '../api/v1/departments',
      complete: gotDepts
    });
  }
}

$(initPage);

