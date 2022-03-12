/*global $*/
function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var participants = {};
  var unfilled = 0;
  for(let shift of data) {
    if(shift.participant !== undefined && shift.participant !== '') {
      if(participants[shift.participant] === undefined) {
        participants[shift.participant] = 1;
      } else {
        participants[shift.participant]++;
      }
    } else {
      unfilled++;
    }
  }
  var promises = [];
  var sizes = {
    'WS': 0,
    'WM': 0,
    'MS': 0,
    'WL': 0,
    'MM': 0,
    'WXL': 0,
    'WXXL': 0,
    'ML': 0,
    'WXXXL': 0,
    'MXL': 0,
    'MXXL': 0,
    'MXXXL': 0
  };
  for(var participant in participants) {
    if(participants[`${participant}`] >= $('#minShifts').val()) {
      promises.push($.ajax({url: '../api/v1/participants/'+participant}));
    }
  }
  unfilled = unfilled / $('#minShifts').val();
  Promise.all(promises).then((data) => {
    for(let participant of data) {
      sizes[participant.shirtSize]++;
    }
    $('#filledWS').html(sizes.WS);
    $('#filledWM').html(sizes.WM);
    $('#filledMS').html(sizes.MS);
    $('#filledWL').html(sizes.WL);
    $('#filledMM').html(sizes.MM);
    $('#filledWXL').html(sizes.WXL);
    $('#filledWXXL').html(sizes.WXXL);
    $('#filledML').html(sizes.ML);
    $('#filledWXXXL').html(sizes.WXXXL);
    $('#filledMXL').html(sizes.MXL);
    $('#filledMXXL').html(sizes.MXXL);
    $('#filledMXXXL').html(sizes.MXXXL);
    var un = Math.round(unfilled * .05);
    $('#unfilledWS').html(un);
    $('#totalWS').html(un + sizes.WS);
    $('#unfilledMS').html(un);
    $('#totalMS').html(un + sizes.MS);
    $('#unfilledWXXL').html(un);
    $('#totalWXXL').html(un + sizes.WXXL);
    $('#unfilledMXXL').html(un);
    $('#totalMXXL').html(un + sizes.MXXL); 
    un = Math.round(unfilled * .125);
    $('#unfilledWM').html(un);
    $('#totalWM').html(un + sizes.WM);
    $('#unfilledMM').html(un);
    $('#totalMM').html(un + sizes.MM);
    $('#unfilledWXL').html(un);
    $('#totalWXL').html(un + sizes.WXL);
    $('#unfilledMXL').html(un);
    $('#totalMXL').html(un + sizes.MXL);
    un = Math.round(unfilled * .15);
    $('#unfilledWL').html(un);
    $('#totalWL').html(un + sizes.WL);
    $('#unfilledML').html(un);
    $('#totalML').html(un + sizes.ML);
    $('#unfilledWXXXL').html(0);
    $('#totalWXXXL').html(sizes.WXXXL);
    $('#unfilledMXXXL').html(0);
    $('#totalMXXXL').html(sizes.MXXXL);
  });
}

function minShiftsChanged(e) {
  rolesChanged(e);
}

function rolesChanged() {
  var selectedRoles = $('#roles').select2('data');
  var filter = '$filter=';
  for(let role of selectedRoles) {
    filter+='roleID eq '+role.id;
    filter+=' or ';
  }
  //Remove last or...
  filter = filter.slice(0, -4);
  $.ajax({
    url: '../api/v1/events/'+$('#event').val()+'/shifts?'+filter,
    complete: gotShifts
  });
}

function gotRoles(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
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
  $('#department').change(departmentSelected);
  $('#roles').change(rolesChanged);
  $('#minShifts').change(minShiftsChanged);
}

$(initPage);
