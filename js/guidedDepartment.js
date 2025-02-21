function gotInitialData(results) {
  let shiftResult = results.shift();
  if(shiftResult.status !== 'fulfilled') {
    alert('Unable to get shifts for event!');
    return;
  }
  if(shiftResult.value !== undefined && shiftResult.value.status === 401) {
    //Not logged in...
    return;
  }
  let departmentResult = results.shift();
  const departmentMap = shiftResult.value.reduce((map, shift) => {
    if (!map[shift.departmentID]) {
      map[shift.departmentID] = {total: 0, filled: 0};
    }
    map[shift.departmentID].total++;
    if (['pending', 'filled', 'groupPending'].includes(shift.status)) {
      map[shift.departmentID].filled++;
    }
    return map;
  }, {});
  if(Object.keys(departmentMap).length === 1) {
    //There is only one department for this event! Skip this step!
    location.href=`guidedShift.php?eventID=${getEventID()}&onlyDept=true&department=${shiftResult.value[0].departmentID}`;
    return;
  }
  departmentResult.value.sort(function(a, b) {
    return a.departmentName.localeCompare(b.departmentName);
  });
  const div = document.getElementById('departments');
  for(let department of departmentResult.value) {
    if(departmentMap[department.departmentID] !== undefined) {
      const percent = Number.parseFloat((departmentMap[department.departmentID].filled/departmentMap[department.departmentID].total)*100).toFixed(2);
      const buttonDiv = document.createElement('div');
      buttonDiv.className = 'card';
      buttonDiv.style.cursor = 'pointer';
      buttonDiv.style.backgroundColor = '#eee';
      buttonDiv.style.backgroundImage = 'linear-gradient(to right, #3399dd, #3399dd)';
      buttonDiv.style.backgroundSize = `${percent}% 100%`;
      buttonDiv.style.backgroundRepeat = 'no-repeat';
      buttonDiv.dataset['deptID'] = department.departmentID;

      let cardBody = document.createElement('div');
      cardBody.className = 'card-body';

      let row = document.createElement('div');
      row.className = 'row';

      let buttonTextDiv = document.createElement('div');
      buttonTextDiv.className = 'col-8 col-lg-11';
      buttonTextDiv.innerHTML = `<b>${department.departmentName}</b>`;

      let buttonIconDiv = document.createElement('div');
      buttonIconDiv.className = 'col-4 col-lg-1 align-self-center';
      buttonIconDiv.innerHTML = `${percent}%<i class="fas fa-chevron-right"></i>`;

      row.appendChild(buttonTextDiv);
      row.appendChild(buttonIconDiv);
      cardBody.appendChild(row);
      buttonDiv.appendChild(cardBody);
      div.appendChild(buttonDiv);
      buttonDiv.addEventListener('click', gotoDepartmentPage);
    }
  }
}

function getEventID() {
  return new URLSearchParams(window.location.search).get('eventID');
}

function gotoDepartmentPage() {
  location.href='guidedShift.php?eventID='+getEventID()+'&department='+this.dataset['deptID'];
}

function initPage() {
  let eventID = getEventID();
  if(eventID) {
    const promises = [
      fetch(`api/v1/events/${eventID}/shifts`).then(response => {
        if(!response.ok) {
          if(response.status === 401) {
            // We are logged out, just do nothing the underlying framework will
            // handle the redirect to the login page.
            return {status: 401};
          }
          throw new Error('Network response was not ok');
        }
        return response.json();
      }),
      fetch('api/v1/departments').then(response => response.json())
    ];
    Promise.allSettled(promises).then(gotInitialData);
    return;
  }
  //User isn't following the wizard...
  location.href = 'guidedEvent.php';
  return;
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