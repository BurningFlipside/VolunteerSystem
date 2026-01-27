/*global $, bootbox, isGoogleConnected*/
function generatePDF(e) {
  let type = e.target.id;
  let event = document.getElementById('event').value;
  if(event === null) {
    bootbox.alert('Please select event first!');
    return;
  }
  let departmentID = document.getElementById('department').value;
  if(departmentID === null || departmentID === '') {
    bootbox.alert('Please select department first!');
    return;
  }
  location.href = '../api/v1/departments/'+departmentID+'/shifts/Actions/GenerateShiftSchedule?type='+type+'&eventID='+event;
}

function departmentChanged(ev) {
  let dept = ev.target.value;
  if(dept === 'AAR') {
    let list = document.getElementById('list');
    let listItem = document.createElement('li');
    listItem.id = 'AAR';
    let link = document.createElement('button');
    link.className = 'btn btn-link';
    link.innerHTML = '<i class="fas fa-file-word"></i>Word';
    link.title = 'Export the actual schedule to Word Doc';
    link.addEventListener('click', () => {
      let eventSelect = document.getElementById('event');
      let event = eventSelect.value;
      location.href = '../api/v1/departments/AAR/shifts/Actions/GenerateShiftSchedule?type=actualSchedule&eventID='+event;
    });
    listItem.innerText = 'Actual Schedule: ';
    listItem.appendChild(link);
    list.appendChild(listItem);
  } else {
    let list = document.getElementById('list');
    let listItem = document.getElementById('AAR');
    if(listItem !== null) {
      list.removeChild(listItem);
    }
  }
}

function getDepartments() {
  fetch('../api/v1/departments').then((response) => {
    response.json().then((data) => {
      data.sort((a,b) => {
        return a.departmentName.localeCompare(b.departmentName);
      });
      let departmentSelect = document.getElementById('department');
      for(let dept of data) {
        if(dept.isAdmin) {
          let option = new Option(dept.departmentName, dept.departmentID);
          departmentSelect.add(option);
        }
      }
      if(departmentSelect.options.length === 2) {
        // Only one department just disable the drop down...
        departmentSelect.options[1].selected = true;
        departmentSelect.setAttribute('disabled', true);
        // TODO limit the event selector the events without departments or that contain this department
        return;
      }
      departmentSelect.addEventListener('change', departmentChanged);
      let options = {searchable: true};
      NiceSelect.bind(departmentSelect, options);
    });
  });
}

function doSimpleGoogleDoc() {
  let event = document.getElementById('event').value;
  if(event === null) {
    bootbox.alert('Please select event first!');
    return;
  }
  let departmentID = document.getElementById('department').value;
  if(departmentID === null || departmentID === '') {
    bootbox.alert('Please select department first!');
    return;
  }
  let obj = {event: event, department: departmentID};
  fetch('../api/v1/google/Actions/SaveShiftSchedule?type=simple', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(obj)
  }).then(response => response.json())
    .then(data => {
      bootbox.alert('Google Doc created! You can find it <a href="https://docs.google.com/document/d/'+data.documentID+'/edit" target="_blank">here</a>.');
    });
}

function addGoogleLinks() {
  let listItem = document.getElementById('simple');
  let link = document.createElement('button');
  link.className = 'btn btn-link';
  link.innerHTML = '<i class="fab fa-google-drive"></i>Google Doc<i class="fas fa-share-square"></i>';
  link.title = 'Export the simple Schedule to Google Docs';
  link.addEventListener('click', () => {
    doSimpleGoogleDoc();
  });
  listItem.appendChild(link);
}

function initPage() {
  fetch('../api/v1/events').then((response) => {
    response.json().then((data) => {
      let eventSelect = document.getElementById('event');
      data.sort((a, b) => {
        let aStart = new Date(a.startTime);
        let bStart = new Date(b.startTime);
        return bStart - aStart;
      });
      for(let event of data) {
        let option = new Option(event.name, event['_id']['$oid'], eventSelect.options.length === 0);
        eventSelect.add(option);
      }
      let options = {searchable: true};
      NiceSelect.bind(eventSelect, options);
      getDepartments();
    });
  });
  document.getElementById('simplePDF').addEventListener('click', generatePDF);
  document.getElementById('simplePDFWithEmail').addEventListener('click', generatePDF);
  document.getElementById('gridXLSX').addEventListener('click', generatePDF);
  document.getElementById('gridPDF').addEventListener('click', generatePDF);
  isGoogleConnected(addGoogleLinks);
}

window.onload = initPage;
