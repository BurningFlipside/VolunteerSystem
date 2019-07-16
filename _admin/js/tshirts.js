function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var participants = {};
  var unfilled = 0;
  for(var i = 0; i < data.length; i++) {
    if(data[i].participant !== undefined) {
      if(participants[data[i].participant] === undefined) {
        participants[data[i].participant] = 1;
      }
      else {
        participants[data[i].participant]++;
      }
    }
    else {
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
    if(participants[participant] >= $('#minShifts').val()) {
      promises.push($.ajax({url: '../api/v1/participants/'+participant}));
    }
  }
  unfilled = unfilled / $('#minShifts').val();
  Promise.all(promises).then((data) => {
    for(var i = 0; i < data.length; i++) {
      sizes[data[i].shirtSize]++;
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

function rolesChanged(e) {
  var selectedRoles = $('#roles').select2('data');
  var filter = '$filter=';
  for(var i = 0; i < selectedRoles.length; i++) {
    filter+='roleID eq '+selectedRoles[i].id;
    if(i < selectedRoles.length-1) {
      filter+=' or ';
    }
  }
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
  $('#department').change(departmentSelected);
  $('#roles').change(rolesChanged);
  $('#minShifts').change(minShiftsChanged);
}

$(initPage);
