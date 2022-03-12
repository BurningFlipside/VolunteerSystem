/*global $*/
function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var table = $('#shiftTable tbody');
  table.empty();
  var data = jqXHR.responseJSON;
  var participants = {};
  for(let shift of data) {
    if(shift.participant !== undefined && shift.participant !== '') {
      if(participants[shift.participant] === undefined) {
        participants[shift.participant] = 1;
      } else {
        participants[shift.participant]++;
      }
    }
  }
  var min = $('#minShifts').val()*1;
  var max = $('#maxShifts').val()*1;
  if(max === 0) {
    max = 9999;
  }
  for(var uid in participants) {
    if(participants[`${uid}`] >= min && participants[`${uid}`] <= max) {
      table.append('<tr><td>'+uid+'</td><td>'+participants[`${uid}`]+'</td></tr>');
    }
  }
}

function getShifts() {
  var selectedRoles = $('#roles').select2('data');
  var filter = '';
  if(selectedRoles.length > 0) {
    filter = '?$filter=';
    for(let role of selectedRoles) {
      filter+='roleID eq '+role.id;
      filter+=' or ';
    }
    //Remove last or...
    filter = filter.slice(0, -4);
  }
  $.ajax({
    url: '../api/v1/events/'+$('#event').val()+'/shifts'+filter,
    complete: gotShifts
  });
}

function minShiftsChanged() {
  getShifts();
}

function maxShiftsChanged() {
  getShifts();
}

function rolesChanged() {
  getShifts();
}

function gotRoles(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  $('#roles').empty();
  for(let role of data) {
    var newOption = new Option(role.display_name, role.short_name, true, true);
    $('#roles').append(newOption);
  }
  $('#roles').trigger('change');
}

function departmentSelected(e) {
  var value = e.target.value;
  $.ajax({
    url: '../api/v1/departments/'+value+'/roles',
    complete: gotRoles
  });
}

function eventSelected() {
  getShifts();
}

function initPage() {
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
  $('#department').select2({
    ajax: {
      url: '../api/v1/departments',
      processResults: function(data) {
        var res = [];
        data.sort((a,b) => {
          return a.departmentName.localeCompare(b.departmentName);
        });
        for(let dept of data) {
          if(dept.isAdmin) {
            res.push({id: dept.departmentID, text: dept.departmentName});
          }
        }
        return {results: res};
      }
    }
  });
  $('#roles').select2();
  $('#event').change(eventSelected);
  $('#department').change(departmentSelected);
  $('#roles').change(rolesChanged);
  $('#minShifts').change(minShiftsChanged);
  $('#maxShifts').change(maxShiftsChanged);
}

$(initPage);
