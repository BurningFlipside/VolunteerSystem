function getCertName(certType, certs) {
  for(let cert of certs) {
    if(cert.certID === certType) {
      return cert.name;
    }
  }
  return certType;
}

function getExtension(imageType) {
  switch(imageType) {
    case 'application/pdf':
      return '.pdf';
    default:
      alert('Unknown mime type '+imageType);
      return '.bin';
  }
}

function gotCerts(jqXHR) {
  if(jqXHR.status !== 200) {

  }
  let data = jqXHR.responseJSON;
  let participant = this;
  let certDiv = $('#certs');
  for(let certType in participant.certs) {
    let label = $('<label class="col-sm-2 col-form-label">'+getCertName(certType, data)+':</label>');
    let link = $('<a href="#">Download</a>');
    link.click((e) => {
      let certData = participant.certs[`${certType}`];
      let blobData = atob(certData.image);
      const byteNumbers = new Array(blobData.length);
      for(let i = 0; i < blobData.length; i++) {
        byteNumbers[i] = blobData.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      let blob = new Blob([byteArray], {type: certData.imageType});
      let fakelink = document.createElement('a');
      fakelink.download = certType+getExtension(certData.imageType);
      fakelink.href = window.URL.createObjectURL(blob);
      fakelink.style.display = 'none';
      document.body.appendChild(fakelink);
      fakelink.click();
      fakelink.remove();
    });
    let linkDiv = $('<div class="col-sm-10">');
    linkDiv.append(link);
    certDiv.after('<div class="w-100"></div>');
    certDiv.after(linkDiv);
    certDiv.after(label);
  }
}

function gotParticipant(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Could not find participant!');
    return;
  }
  let data = jqXHR.responseJSON;
  $('#firstName').val(data.firstName);
  $('#lastName').val(data.lastName);
  $('#burnerName').val(data.burnerName);
  $('#campName').val(data.campName);
  if(data.certs !== undefined) {
    $.ajax({
      url: '../api/v1/certs',
      complete: gotCerts,
      context: data
    });
  }
}

function showEventName(cell, events) {
  return events[cell.getValue()].name;
}

function getDepartmentName(cell) {
  let value = cell.getValue();
  if(value === undefined) {
    let data = cell.getRow().getData();
    return data.departmentID;
  }
  return value;
}

function getShiftName(cell) {
  return cell.getValue();
}

function gotEvents(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  let events = {};
  for(event of jqXHR.responseJSON) {
    events[event['_id']['$oid']] = event;
  }
  let table = new Tabulator('#shifts', {
    ajaxURL: '../api/v1/shifts?$filter=participant eq '+getParameterByName('id'),
    columns:[
      {title: 'ID', field: '_id.$oid', visible: false},
      {title: 'Event', field: 'eventID', formatter: showEventName, formatterParams: events},
      {title: 'Department', field: 'department', formatter: getDepartmentName},
      {title: 'Shift Name', field: 'name', formatter: getShiftName}
    ]
  });
}

function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Could not find participant shifts!');
    return;
  }
  let data = jqXHR.responseJSON;
  if(data.length === 0) {
    $('#shifts').replaceWith('<h2 class="col-sm-10">User has no shifts!</h2>');
    return;
  }
  
  console.log(data);
}

function initPage() {
  let id = getParameterByName('id');
  if(id === null) {
    alert('No user id specified!');
    return;
  }
  $.ajax({
    url: '../api/v1/participants/'+id,
    complete: gotParticipant
  });
  $.ajax({
    url: '../api/v1/events',
    complete: gotEvents
  });
}

$(initPage)