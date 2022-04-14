/*global $, bootbox*/
function generatePDF(e) {
  var type = e.target.id;
  console.log(type);
  var event = $('#event').val();
  if(event === null) {
    bootbox.alert('Please select event first!');
    return;
  }
  var dept = $('#department').val();
  if(dept === null || dept === '') {
    bootbox.alert('Please select department first!');
    return;
  }
  location.href = '../api/v1/departments/'+dept+'/shifts/Actions/GenerateShiftSchedule?type='+type+'&eventID='+event;
}

function setupEventSelect(events, deptId) {
  let selectEvents = [];
  for(let event of events) {
    if(deptId !== undefined) {
      if(event.departments.length > 0 && !event.departments.includes(deptId)) {
        continue;
      }
      console.log(event);
    }
    selectEvents.push({id: event['_id']['$oid'], text: event.name});
  }
  $('#event').select2({data: selectEvents});
}

function gotDepartments(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to obtain departments!');
    return;
  }
  let events = this;
  let depts = jqXHR.responseJSON;
  depts.sort((a,b) => {
    return a.departmentName.localeCompare(b.departmentName);
  });
  let selectDepts = [];
  for(let dept of depts) {
    if(dept.isAdmin) {
      selectDepts.push({id: dept.departmentID, text: dept.departmentName});
    }
  }
  if(selectDepts.length > 1) {
    selectDepts.unshift({id: '', text: ''});
    setupEventSelect(events);
  } else {
    setupEventSelect(events, selectDepts[0].id);
  }
  $('#department').select2({data: selectDepts});
}

function gotEvents(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to obtain events!');
    return;
  }
  let events = jqXHR.responseJSON;
  events.sort((a, b) => {
    let aStart = new Date(a.startTime);
    let bStart = new Date(b.startTime);
    return bStart - aStart;
  });
  $.ajax({
    url: '../api/v1/departments',
    context: events,
    complete: gotDepartments
  });
}

function initPage() {
  $.ajax({
    url: '../api/v1/events',
    complete: gotEvents
  });
  $('#simplePDF').click(generatePDF);
  $('#gridXLSX').click(generatePDF);
  $('#gridPDF').click(generatePDF);
}

$(initPage);
