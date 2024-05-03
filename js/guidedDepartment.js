function gotInitialData(results) {
  let shiftResult = results.shift();
  let departmentResult = results.shift();
  if(shiftResult.status !== 'fulfilled') {
    if(shiftResult.reason !== undefined && shiftResult.reason.status === 401) {
      //Not logged in...
      return;
    }
    console.log(shiftResult);
    alert('Unable to get shifts for event!');
    return;
  }
  let departmentMap = {};
  for(let shift of shiftResult.value) {
    if(departmentMap[shift.departmentID] === undefined) {
      departmentMap[shift.departmentID] = {
        total: 0,
        filled: 0
      }
    }
    departmentMap[shift.departmentID].total++;
    if(shift.status === 'pending' || shift.status == "filled" || shift.status == "groupPending") {
      departmentMap[shift.departmentID].filled++;
    }
  }
  if(Object.keys(departmentMap).length === 1) {
    //There is only one department for this event! Skip this step!
    location.href='guidedShift.php?eventID='+getParameterByName('eventID')+'&onlyDept=true&department='+shiftResult.value[0].departmentID;
    return;
  }
  departmentResult.value.sort(function(a, b) {
    return a.departmentName.localeCompare(b.departmentName);
  });
  let div = $('#departments');
  for(let department of departmentResult.value) {
    if(departmentMap[department.departmentID] !== undefined) {
      let percent = Number.parseFloat((departmentMap[department.departmentID].filled/departmentMap[department.departmentID].total)*100).toFixed(2);
      let buttonDiv = $('<div class="card" style="cursor: pointer; background-color: #eee; background-image: linear-gradient(to right, #3399dd, #3399dd); background-size: '+percent+'% 100%; background-repeat: no-repeat;" data-deptID="'+department.departmentID+'"><div class="card-body"><div class="row"><div class="col-8 col-lg-11"><b>'+department.departmentName+'</b></div><div class="col-4 col-lg-1 align-self-center">'+percent+'%<i class="fas fa-chevron-right"></i></div></div></div></div>');
      div.append(buttonDiv);
      buttonDiv.on('click', gotoDepartmentPage);
    }
  }
}

function gotoDepartmentPage(ev) {
  location.href='guidedShift.php?eventID='+getParameterByName('eventID')+'&department='+ev.currentTarget.dataset.deptid;
}

function initPage() {
  let eventID = getParameterByName('eventID');
  if(eventID === null) {
    //User isn't following the wizard...
    location.href = 'guidedEvent.php';
    return;
  }
  let promises = [
    $.ajax({url: 'api/v1/events/'+eventID+'/shifts'}),
    $.ajax({url: 'api/v1/departments'})];
    Promise.allSettled(promises).then(gotInitialData);
}

$(() => {
  $('body').on('fvs:ready', function() {
    initPage();
  });
});
/* vim: set tabstop=2 shiftwidth=2 expandtab: */