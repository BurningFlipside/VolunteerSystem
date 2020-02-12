function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var tbody = $('#shiftTable tbody');
  var nameObj = tbody.data('names');
  var depts = $('#depts').val();
  tbody.empty();
  for(var i = 0; i < data.length; i++) {
    if(!depts.includes(data[i].departmentID)) {
      continue;
    }
    let dept = data[i].departmentID;
    let role = data[i].roleID;
    let startDate = new Date(data[i].startTime);
    let endDate = new Date(data[i].endTime);
    let date = startDate.toDateString();
    if(nameObj !== null) {
      if(nameObj.depts[data[i].departmentID] !== undefined) {
        dept = nameObj.depts[data[i].departmentID].departmentName;
      }
      if(nameObj.roles[data[i].roleID] !== undefined) {
        role = nameObj.roles[data[i].roleID].display_name;
      }
    }
    if(startDate.getDate() !== endDate.getDate()) {
      date = startDate.toDateString()+' - '+endDate.toDateString();
    }
    tbody.append('<tr class="dept-'+data[i].departmentID+'"><td>'+dept+'</td><td>'+role+'</td><td>'+date+'</td><td>'+startDate.toLocaleTimeString()+'</td><td>'+endDate.toLocaleTimeString()+'</td></tr>');
  }
}

function getShifts() {
  var extra = "";
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
  for(let i = 0; i < depts.length; i++) {
    $('.dept-'+depts[i]).show();
  }
}

function processDepartments(depts) {
  let deptObj = {};
  let groups = {};
  let data = [];
  for(let i = 0; i < depts.length; i++) {
    deptObj[depts[i].departmentID] = depts[i];
    if(groups[depts[i]['area']] === undefined) {
      groups[depts[i]['area']] = [];
    }
    var tmp = {id: depts[i]['departmentID'], text: depts[i]['departmentName'], selected: true};
    groups[depts[i]['area']].push(tmp);
  }
  for(var group in groups) {
    data.push({text: group, children: groups[group]});
  }
  $('#depts').select2({data: data});
  $('#depts').change(deptChanged);
  return deptObj;
}

function processRoles(roles) {
  let roleObj = {};
  for(let i = 0; i < roles.length; i++) {
    roleObj[roles[i].short_name] = roles[i];
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

function eventChanged(e) {
  $.ajax({
    url: '../api/v1/events/'+$('#event').val(),
    complete: gotEvent
  });
}

function startTimeChanged(e) {
  if($('#event').val() !== null) {
    getShifts();
  }
}

function generateCSV() {
  if($('#event').val() === null) {
    alert('Select an event first!');
  }
  var extra = "";
  var start = $('#startTime').val();
  if(start !== '') {
    extra = ' and startTime eq '+start;
  }
  window.location = '../api/v1/events/'+$('#event').val()+'/shifts?$format=csv&$filter=enabled eq true and status ne filled'+extra;
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
        for(var i = 0; i < data.length; i++) {
          res.push({id: data[i]['_id']['$oid'], text: data[i].name});
        }
        return {results: res};
      }
    }
  });
  $('#event').change(eventChanged);
  $('#startTime').change(startTimeChanged);
}

$(initPage);
