/* global $, bootbox */
/* exported linkTicket, saveData */
function gotUser(data) {
  console.log(data);
  const burnerName = document.getElementById('burnerName');
  if(burnerName) {
    burnerName.value = data.burnerName;
  }
  const campName = document.getElementById('myCampName');
  if(campName) {
    campName.value = data.campName;
  }
  const firstName = document.getElementById('firstName');
  if(firstName) {
    firstName.value = data.firstName;
  }
  const lastName = document.getElementById('lastName');
  if(lastName) {
    lastName.value = data.lastName;
  }
  const paperName = document.getElementById('myPaperName');
  if(paperName) {
    paperName.value = data.paperName;
  }
  const webName = document.getElementById('myWebName');
  if(webName) {
    webName.value = data.webName;
  }
  const shirtSize = document.getElementById('myShirtSize');
  if(shirtSize) {
    shirtSize.value = data.shirtSize;
  }
  webNameChange();
  paperNameChange();
}

function gotMyCerts(data) {
  for(const key in data) {
    const icon = document.getElementById(key);
    const upload = document.getElementById(`${key}_Upload`);
    const status = data[key].status;
    if(!icon || !upload) {
      continue;
    }
    switch(status) {
      case 'pending':
        icon.innerHTML = '<i class="fas fa-exclamation-triangle text-warning" title="Your certification is pending review"></i>';
        break;
      case 'current':
        icon.innerHTML = '<i class="fas fa-check text-success" title="Your certification is current"></i>';
        upload.remove();
        break;
    }
  }
}

function getMyCerts() {
  fetch('api/v1/participants/me/certs').then((response) => {
    if(response.status === 401) {
      return;
    }
    if(response.ok) {
      return response.json();
    }
    throw new Error('Unable to fetch user certs');
  }).then(gotMyCerts).catch((error) => {
    console.error('Unable to fetch user certs', error);
  });
}

function gotCerts(data) {
  const certDiv = document.getElementById('certs');
  if(!certDiv) {
    return;
  }
  for(let cert of data) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'col-sm-3';
    titleDiv.innerHTML = cert.name;
    certDiv.appendChild(titleDiv);
    const iconDiv = document.createElement('div');
    iconDiv.className = 'col-sm-3';
    iconDiv.id = cert.certID;
    iconDiv.innerHTML = '<i class="fas fa-times text-danger"></i>';
    certDiv.appendChild(iconDiv);
    const uploadDiv = document.createElement('div');
    uploadDiv.className = 'col-sm-6';
    const input = document.createElement('input');
    input.type = 'file';
    input.className = 'form-control-file';
    input.id = `${cert.certID}_Upload`;
    input.title = 'Upload an image of your certificate';
    input.accept = 'image/*, application/pdf';
    input.addEventListener('change', certUpload);
    uploadDiv.appendChild(input);
    certDiv.appendChild(uploadDiv);
  }
  getMyCerts();
}

function gotTicketStatus(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  if(data.ticket === true) {
    $('#ticketStatus').html('<div class="alert alert-success" role="alert">You have a ticket linked to this profile!</div>');
  }
}

function uploadedCert(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to upload certification!');
    return;
  }
  getMyCerts();
}

function certUpload(e) {
  var file = e.target.files[0];
  if(file.size >= 10485760) {
    bootbox.alert('File is greater than 10MB, please reduce the file size.');
    e.target.value = '';
    return;
  }
  var id = e.target.id.split('_')[0];
  var fd = new FormData();
  fd.append('file', file);
  $.ajax({
    url: 'api/v1/participants/me/certs/'+id,
    method: 'POST',
    contentType: false,
    processData: false,
    data: fd,
    complete: uploadedCert
  });
}

function webNameChange() {
  const webName = document.getElementById('myWebName');
  if(webName) {
    const value = webName.value;
    const name = getName(value);
    const webDisplay = document.getElementById('webDisplay');
    if(webDisplay) {
      webDisplay.innerHTML = name;
    }
  }
}

function paperNameChange() {
  const paperName = document.getElementById('myPaperName');
  if(paperName) {
    const value = paperName.value;
    const name = getName(value);
    const paperDisplay = document.getElementById('paperDisplay');
    if(paperDisplay) {
      paperDisplay.innerHTML = name;
    }
  }
}

function getName(type) {
  const firstElem = document.getElementById('firstName');
  const lastElem = document.getElementById('lastName');
  const burnerElem = document.getElementById('burnerName');
  if(!firstElem || !lastElem || !burnerElem) {
    return '';
  }
  const first = firstElem.value;
  const last = lastElem.value;
  const burner = burnerElem.value;
  switch(type) {
    case 'anonymous':
      return '<i>Anonymous</i>';
    case 'full':
      return first+' "'+burner+'" '+last;
    case 'burnerLast':
      return burner+' '+last;
    case 'firstBurner':
      return first+' '+burner;
    case 'burner':
      return burner;
  }
}

function saveDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Error saving participant data');
    return;
  }
  alert('Success');
  location.reload();
}

function saveData() {
  var data = {};
  data.burnerName = $('#burnerName').val();
  data.campName = $('#myCampName').val();
  data.firstName = $('#firstName').val();
  data.lastName = $('#lastName').val();
  data.paperName = $('#myPaperName').val();
  data.webName = $('#myWebName').val();
  data.shirtSize = $('#myShirtSize').val();
  $.ajax({
    url: 'api/v1/participants/me',
    method: 'PATCH',
    data: JSON.stringify(data),
    contentType: 'application/json',
    complete: saveDone
  });
  return false;
}

function linkTicket() {
  var data = {};
  data.ticketCode = $('#ticketCode').val();
  $.ajax({
    url: 'api/v1/participants/me',
    method: 'PATCH',
    data: JSON.stringify(data),
    contentType: 'application/json',
    complete: saveDone
  });
  return false;
}

function initPage() {
  fetch('api/v1/participants/me').then((response) => {
    if(response.status === 401) {
      return;
    }
    if(response.ok) {
      return response.json();
    }
    throw new Error('Unable to fetch user data');
  }).then(gotUser).catch((error) => {
    console.error('Unable to fetch user data', error);
  });
  fetch('api/v1/certs').then((response) => {
    if(response.status === 401) {
      return;
    }
    if(response.ok) {
      return response.json();
    }
    throw new Error('Unable to fetch certs');
  }).then(gotCerts).catch((error) => {
    console.error('Unable to fetch certs', error);
  });
  $.ajax({
    url: 'api/v1/participants/me/ticketStatus',
    complete: gotTicketStatus
  });
}

window.addEventListener('load', initPage);
