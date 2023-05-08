function gotInitialData(results) {
  let shiftResult = results.shift();
  let roleResult = results.shift();
  let availableShifts = shiftResult.value.filter((value) => {
    if(value.whyClass === 'MINE') {
      return true;
    }
    if(value.status === 'pending' || value.status == "filled" || value.status == "groupPending") {
      return false;
    }
    return true;
  });
  availableShifts.sort(function(a, b) {
    var aDate = new Date(a.startTime);
    var bDate = new Date(b.startTime);
    return aDate.getTime() - bDate.getTime();
  });
  let roles = {};
  for(let role of roleResult.value) {
    roles[role.short_name] = role;
  }
  let div = $('#shifts');
  let day = -1;
  let dayDiv = null;
  let lastShift = null;
  for(let shift of availableShifts) {
    if(lastShift != null && shift.groupID !== undefined && shift.groupID === lastShift.groupID) {
      //Skip this it's another copy of the same shift...
      continue;
    }
    lastShift = shift;
    let startTime = new Date(shift.startTime);
    let end = new Date(shift.endTime);
    if(day != startTime.getDate()) {
      day = startTime.getDate();
      if(dayDiv !== null) {
        div.append(dayDiv);
      }
      dayDiv = $('<div><div class="row"><div class="col-10"><h2>'+startTime.toLocaleString('en-us', {  weekday: 'long' })+' '+startTime.toLocaleDateString()+'</h2></div></div></div>')
    }
    let shiftName = shift.name;
    if(shift.name === undefined || shift.name.length === 0) {
      shiftName = roles[shift.roleID].display_name+': '+startTime+' to '+end;
    }
    let style ='cursor: pointer;';
    let nextChevron = '<i class="fas fa-chevron-right"></i>';
    let link = true;
    if(shift.whyClass === 'MINE') {
      shiftName += ' - You have already signed up for this shift!';
      nextChevron = '';
      style = 'background-color: SpringGreen;';
      link = false;
    } else if(shift.overlap) { 
      shiftName += ' - You have a shift which conflicts with this one!';
      style = 'background-color: gold; cursor: pointer;';
    } else if(!shift.available) {
      shiftName += ' - This shift requires an invite. Contact the lead!';
      style = 'background-color: lightGray;';
      nextChevron = '';
      link = false;
    }
    let shiftTime = startTime.toTimeString()+' until ';
    if(end.getDate() != startTime.getDate()) {
      //Need the date since this shift goes past midnight
      shiftTime += end.toLocaleString();
    } else {
      shiftTime += end.toTimeString();
    }
    let buttonDiv = $('<div class="card" style="'+style+'" data-shiftID="'+shift['_id']['$oid']+'"><div class="card-body"><div class="row"><div class="col-8 col-lg-11">'+shiftName+'<br/><i>'+shiftTime+'</i></div><div class="col-4 col-lg-1 align-self-center">'+nextChevron+'</div></div></div></div>');
    dayDiv.append(buttonDiv);
    if(link) {
      buttonDiv.on('click', gotoSignupPage);
    }
  }
  if(dayDiv !== null) {
    div.append(dayDiv);
  }
}

function gotoSignupPage(ev) {
  location.href = 'signup.php?shiftID='+ev.currentTarget.dataset.shiftid;
}

function initPage() {
  let eventID = getParameterByName('eventID');
  if(eventID === null) {
    //User isn't following the wizard...
    location.href = 'guidedEvent.php';
    return;
  }
  let departmentID = getParameterByName('department');
  if(departmentID === null) {
    //User isn't following the wizard...
    location.href = 'guidedDepartment.php?eventID='+eventID;
    return;
  }
  let promises = [
    $.ajax({url: 'api/v1/events/'+eventID+'/shifts?$filter=departmentID eq '+departmentID}),
    $.ajax({url: 'api/v1/roles?$filter=departmentID eq '+departmentID})];
  Promise.allSettled(promises).then(gotInitialData);
  let onlyDept = getParameterByName('onlyDept');
  if(onlyDept) {
    $('#back').html('<i class="fas fa-chevron-left"></i>Select a different event').on('click', () => {
      location.href = 'guidedEvent.php';
    });
  }
}

$(() => {
  $('body').on('fvs:ready', function() {
    initPage();
  });
});
/* vim: set tabstop=2 shiftwidth=2 expandtab: */