function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var table = $('#shiftTable tbody');
  table.empty();
  var data = jqXHR.responseJSON;
  var participants = {};
  for(var i = 0; i < data.length; i++) {
    if(data[i].participant !== undefined && data[i].participant !== '') {
      if(participants[data[i].participant] === undefined) {
        participants[data[i].participant] = 1;
      }
      else {
        participants[data[i].participant]++;
      }
    }
  }
  var min = $('#minShifts').val()*1;
  var max = $('#maxShifts').val()*1;
  if(max === 0) {
    max = 9999;
  }
  for(var uid in participants) {
    if(participants[uid] >= min && participants[uid] <= max) {
      table.append('<tr><td>'+uid+'</td><td>'+participants[uid]+'</td></tr>');
    }
  }
}

function getShifts() {
  var selectedRoles = $('#roles').select2('data');
  var filter = '';
  if(selectedRoles.length > 0) {
    filter = '?$filter=';
    for(var i = 0; i < selectedRoles.length; i++) {
      filter+='roleID eq '+selectedRoles[i].id;
      if(i < selectedRoles.length-1) {
        filter+=' or ';
      }
    }
  }
  $.ajax({
    url: '../api/v1/events/'+$('#event').val()+'/shifts'+filter,
    complete: gotShifts
  });
}

function minShiftsChanged(e) {
  getShifts();
}

function maxShiftsChanged(e) {
  getShifts();
}

function rolesChanged(e) {
  getShifts();
}

function gotRoles(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  $('#roles').empty();
  for(var i = 0; i < data.length; i++) {
    var newOption = new Option(data[i].display_name, data[i].short_name, true, true);
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

function eventSelected(e) {
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
        for(var i = 0; i < data.length; i++) {
          res.push({id: data[i]['_id']['$oid'], text: data[i].name});
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
        for(var i = 0; i < data.length; i++) {
          if(data[i].isAdmin) {
            res.push({id: data[i].departmentID, text: data[i].departmentName});
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
