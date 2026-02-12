/*global $*/
function gotShifts(data) {
  console.log(data);
  let participants = {};
  let unfilled = 0;
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
  let promises = [];
  let sizes = {
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
  let minShifts = document.getElementById('minShifts').value;
  for(let participant in participants) {
    if(participants[`${participant}`] >= minShifts) {
      promises.push($.ajax({url: '../api/v1/participants/'+encodeURIComponent(participant)}));
    }
  }
  unfilled = unfilled / minShifts;
  Promise.allSettled(promises).then((resData) => {
    for(let participant of resData) {
      if(participant.status === 'fulfilled') {
        sizes[participant.value.shirtSize]++;
      }
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
  const element = document.getElementById('roles');
  const selectedOptions = Array.from(element.selectedOptions);
  const selectedRoles = selectedOptions.map(option => option.value);
  var filter = '$filter=';
  for(let role of selectedRoles) {
    filter+='roleID eq '+role;
    filter+=' or ';
  }
  //Remove last or...
  filter = filter.slice(0, -4);
  filter += ')';
  //BUGBUG I currently don't handle () in mongodb queries so this needs to get all the shifts then filter for the event on the client
  fetch('../api/v1/shifts?'+filter).then((response) => {
    response.json().then((data) => {
      console.log(data);
      let eventID = document.getElementById('event').value;
      data = data.filter((shift) => {
        return shift.eventID === eventID;
      });
      gotShifts(data);
    });
  });
}

function departmentSelected(e) {
  let departmentID = e.target.value;
  fetch('../api/v1/departments/'+departmentID+'/roles').then((response) => {
    response.json().then((data) => {
      let roleSelect = document.getElementById('roles');
      roleSelect.options.length = 0;
      for(let role of data) {
        let option = new Option(role.display_name, role.short_name, true, true);
        roleSelect.add(option);
      }
      rolesChanged();
    });
  });
}

function eventChanged(e) {
  let eventID = e.target.value;
  let departmentSelect = document.getElementById('department');
  if(departmentSelect.value !== '') {
    rolesChanged();
  }
}

function initPage() {
  fetch('../api/v1/events').then((response) => {
    if(response.httpStatusCode === 401) {
      return;
    }
    response.json().then((data) => {
      data = data.filter((event) => {
        return event.available;
      });
      data.sort((a,b) => {
        return a.name.localeCompare(b.name);
      });
      let eventSelect = document.getElementById('event');
      eventSelect.add(new Option(''));
      for(let event of data) {
        let option = new Option(event.name, event['_id']['$oid'], eventSelect.options.length === 0);
        eventSelect.add(option);
      }
      eventSelect.addEventListener('change', eventChanged);
    });
  });
  fetch('../api/v1/departments').then((response) => {
    if(response.httpStatusCode === 401) {
      return;
    }
    response.json().then((data) => {
      data = data.filter((dept) => {
        return dept.isAdmin;
      });
      data.sort((a,b) => {
        return a.departmentName.localeCompare(b.departmentName);
      });
      let deptSelect = document.getElementById('department');
      deptSelect.add(new Option(''));
      for(let dept of data) {
        let option = new Option(dept.departmentName, dept.departmentID, deptSelect.options.length === 0);
        deptSelect.add(option);
      }
      deptSelect.addEventListener('change', departmentSelected);
    });
  });
  document.getElementById('roles').addEventListener('change', rolesChanged);
  document.getElementById('minShifts').addEventListener('change', minShiftsChanged);
}

window.onload = initPage;
