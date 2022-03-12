/*global $*/
/* exported generateCSV, generateXLSX*/
function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var tbody = $('#shiftTable tbody');
  var nameObj = tbody.data('names');
  var depts = $('#depts').val();
  tbody.empty();
  for(let shift of data) {
    if(!depts.includes(shift.departmentID)) {
      continue;
    }
    let dept = shift.departmentID;
    let role = shift.roleID;
    let startDate = new Date(shift.startTime);
    let endDate = new Date(shift.endTime);
    let date = startDate.toDateString();
    if(nameObj !== null) {
      if(nameObj.depts[shift.departmentID] !== undefined) {
        dept = nameObj.depts[shift.departmentID].departmentName;
      }
      if(nameObj.roles[shift.roleID] !== undefined) {
        role = nameObj.roles[shift.roleID].display_name;
      }
    }
    if(startDate.getDate() !== endDate.getDate()) {
      date = startDate.toDateString()+' - '+endDate.toDateString();
    }
    tbody.append('<tr class="dept-'+shift.departmentID+'"><td>'+dept+'</td><td>'+role+'</td><td>'+date+'</td><td>'+startDate.toLocaleTimeString()+'</td><td>'+endDate.toLocaleTimeString()+'</td></tr>');
  }
}

function getShifts() {
  var extra = '';
  var start = $('#startTime').val();
  if(start !== '') {
    extra = ' and startTime eq '+start;
  }
  $.ajax({
    url: '../api/v1/events/'+$('#event').val()+'/shifts?$filter=enabled eq true and status ne filled'+extra,
    complete: gotShifts
  });
}

function gotEvent(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  $('#startTime').attr('min', data.startTime);
  getShifts();
}

function deptChanged(e) {
  var depts = $(e.target).val();
  $('[class|=dept]').hide();
  for(let dept of depts) {
    $('.dept-'+dept).show();
  }
}

function processDepartments(depts) {
  let deptObj = {};
  let groups = {};
  let data = [];
  for(let dept of depts) {
    deptObj[dept.departmentID] = dept;
    if(groups[dept['area']] === undefined) {
      groups[dept['area']] = [];
    }
    let tmp = {id: dept['departmentID'], text: dept['departmentName'], selected: true};
    groups[dept['area']].push(tmp);
  }
  for(var group in groups) {
    data.push({text: group, children: groups[`${group}`]});
  }
  $('#depts').select2({data: data});
  $('#depts').change(deptChanged);
  return deptObj;
}

function processRoles(roles) {
  let roleObj = {};
  for(let role in roles) {
    roleObj[role.short_name] = role;
  }
  return roleObj;
}

function gotInitialData(results) {
  var deptResult = results.shift();
  var roleResult = results.shift();
  var obj = {};
  obj.depts = processDepartments(deptResult.value);
  obj.roles = processRoles(roleResult.value);
  $('#shiftTable tbody').data('names', obj);
}

function eventChanged() {
  $.ajax({
    url: '../api/v1/events/'+$('#event').val(),
    complete: gotEvent
  });
}

function startTimeChanged() {
  if($('#event').val() !== null) {
    getShifts();
  }
}

function getReport(format) {
  if($('#event').val() === null) {
    alert('Select an event first!');
    return;
  }
  var extra = '';
  var start = $('#startTime').val();
  if(start !== '') {
    extra = ' and startTime eq '+start;
  }
  window.location = '../api/v1/events/'+$('#event').val()+'/shifts?$format='+format+'&$filter=enabled eq true and status ne filled'+extra;
}

function generateCSV() {
  getReport('csv');
}

function generateXLSX() {
  getReport('xlsx');
}

function initPage() {
  var promises = [];
  promises.push($.ajax({
    url: '../api/v1/departments'
  }));
  promises.push($.ajax({
    url: '../api/v1/roles'
  }));
  Promise.allSettled(promises).then(gotInitialData);
  $('#event').select2({
    ajax: {
      url: '../api/v1/events',
      processResults: function(data) {
        var res = [];
        data.sort((a,b) => {
          return a.name.localeCompare(b.name);
        });
        for(let event of data) {
          res.push({id: event['_id']['$oid'], text: event.name});
        }
        return {results: res};
      }
    }
  });
  $('#event').change(eventChanged);
  $('#startTime').change(startTimeChanged);
}

$(initPage);
