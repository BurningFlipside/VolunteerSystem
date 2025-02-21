/*global Sentry*/
function addDayDiv(time) {
  let div = document.createElement('div');
  let dayRow = document.createElement('div');
  dayRow.className = 'row';
  let dayNameColumn = document.createElement('div');
  dayNameColumn.className = 'col-10';
  dayNameColumn.innerHTML = '<h2>'+time.toLocaleString('en-us', {  weekday: 'long' })+' '+time.toLocaleDateString()+'</h2>';
  dayRow.appendChild(dayNameColumn);
  div.appendChild(dayRow);
  return div;
}

function gotInitialData(results) {
  let shiftResult = results.shift();
  let roleResult = results.shift();
  if(shiftResult.value === undefined) {
    if(shiftResult.reason !== undefined && shiftResult.reason.status === 401) {
      //Not logged in...
      return;
    }
    Sentry.withScope(scope => {
      scope.setExtra('shiftResult', shiftResult);
      scope.setExtra('roleResult', roleResult);
      scope.setLevel('info');
      Sentry.captureMessage('Failed to get shifts on guided shift page');
    });
    alert('Unable to get shifts for the department. Please try again later.');
    console.error(shiftResult);
    return;
  }
  let availableShifts = shiftResult.value.filter((value) => {
    return value.whyClass === 'MINE' || !['pending', 'filled', 'groupPending'].includes(value.status);
  });
  availableShifts.sort(function(a, b) {
    let aDate = new Date(a.startTime);
    let bDate = new Date(b.startTime);
    return aDate.getTime() - bDate.getTime();
  });
  const roles = roleResult.value.reduce((acc, role) => {
    acc[role.short_name] = role;
    return acc;
  }, {});
  const div = document.getElementById('shifts');
  if(!div) {
    console.error('Unable to find shifts div!');
    return;
  }
  let day = -1;
  let dayDiv = null;
  let lastShift = null;
  for(let shift of availableShifts) {
    if(lastShift !== null && shift.groupID !== undefined && shift.groupID === lastShift.groupID) {
      //Skip this it's another copy of the same shift...
      continue;
    }
    lastShift = shift;
    let startTime = new Date(shift.startTime);
    let end = new Date(shift.endTime);
    if(day !== startTime.getDate()) {
      day = startTime.getDate();
      if(dayDiv !== null) {
        div.appendChild(dayDiv);
      }
      dayDiv = addDayDiv(startTime);
    }
    let shiftName = shift.name;
    let role = roles[shift.roleID];
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
    if(end.getDate() !== startTime.getDate()) {
      //Need the date since this shift goes past midnight
      shiftTime += end.toLocaleString();
    } else {
      shiftTime += end.toTimeString();
    }
    let buttonDiv = document.createElement('div');
    buttonDiv.className = 'card';
    buttonDiv.style = style;
    buttonDiv.dataset['shiftID'] = shift['_id']['$oid'];
    let cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    let row = document.createElement('div');
    row.className = 'row';
    let buttonTextDiv = document.createElement('div');
    buttonTextDiv.className = 'col-8 col-lg-11';
    buttonTextDiv.innerHTML = shiftName+'<br/><i>'+shiftTime+'</i>';
    let buttonIconDiv = document.createElement('div');
    buttonIconDiv.className = 'col-4 col-lg-1 align-self-center';
    buttonIconDiv.innerHTML = nextChevron;
    row.appendChild(buttonTextDiv);
    row.appendChild(buttonIconDiv);
    cardBody.appendChild(row);
    buttonDiv.appendChild(cardBody);
    dayDiv.appendChild(buttonDiv);
    if(role !== undefined && role.description !== undefined && role.description.length > 0) {
      buttonDiv.setAttribute('title', role.description);
    }
    dayDiv.append(buttonDiv);
    if(link) {
      buttonDiv.addEventListener('click', gotoSignupPage);
    }
  }
  if(dayDiv !== null) {
    div.appendChild(dayDiv);
  }
}

function gotoSignupPage() {
  location.href = 'signup.php?shiftID='+this.dataset['shiftID'];
}

function getEventID() {
  return new URLSearchParams(window.location.search).get('eventID');
}

function getDepartmentID() {
  return new URLSearchParams(window.location.search).get('department');
}

function initPage() {
  let eventID = getEventID();
  if(!eventID) {
    //User isn't following the wizard...
    location.href = 'guidedEvent.php';
    return;
  }
  let departmentID = getDepartmentID();
  if(!departmentID) {
    //User isn't following the wizard...
    location.href = 'guidedDepartment.php?eventID='+eventID;
    return;
  }
  let promises = [
    $.ajax({url: 'api/v1/events/'+eventID+'/shifts?$filter=departmentID eq '+departmentID}),
    $.ajax({url: 'api/v1/roles?$filter=departmentID eq '+departmentID})];
  Promise.allSettled(promises).then(gotInitialData);
  let onlyDept = new URLSearchParams(window.location.search).get('onlyDept');
  if(onlyDept) {
    const backButton = document.getElementById('back');
    if(backButton) {
      backButton.innerHTML = '<i class="fas fa-chevron-left"></i>Select a different department';
      backButton.addEventListener('click', () => {
        location.href = 'guidedDepartment.php?eventID='+eventID;
      });
    }
  }
}

// Wait's for the FVS to respond ready, this waits until they have
// a profile to work with.
function waitForFVSReady() {
  if(!document.body.dataset.profile) {
    console.log('Waiting for profile...');
    document.body.addEventListener('fvs:ready', initPage);
    return;
  }
  //FVS already initialized before this js loaded
  initPage();
}

window.onload = waitForFVSReady;
/* vim: set tabstop=2 shiftwidth=2 expandtab: */
