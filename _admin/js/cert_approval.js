var table;
var certs = {};

function gotUsersWithPendingCerts(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to obtain users for cert type '+this+'!');
    console.log(jqXHR);
    return;
  }
  var data = jqXHR.responseJSON;
  table.addData(data);
}

function gotCertTypes(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to obtain certiciation types!');
    console.log(jqXHR);
    return;
  }
  var data = jqXHR.responseJSON;
  for(var i = 0; i < data.length; i++) {
    $.ajax({
      url: '../api/v1/participants?$filter=certs.'+data[i].certID+'.status%20eq%20pending&$select=firstName,lastName,email,burnerName,certs.'+data[i].certID,
      context: data[i].certID,
      complete: gotUsersWithPendingCerts
    });
    certs[data[i].certID] = data[i];
  }
}

function approveCert(e) {
  console.log(e);
}

function disapproveCert(e) {
  console.log(e);
}

function approveIcon(cell, formatterParams, onRendered) {
  return '<i class="fas fa-thumbs-up"></i>';
}

function disapproveIcon() {
  return '<i class="fas fa-thumbs-down"></i>';
}

function volName(cell, formatterParams, onRendered) {
  var data = cell.getRow().getData();
  return data.firstName+' "'+data.burnerName+'" '+data.lastName;
}

function certType(cell, formatterParams, onRendered) {
  var data = cell.getRow().getData();
  var certType = Object.keys(data.certs)[0];
  return certs[certType].name;
}

function certImage(cell) {
  var data = cell.getRow().getData();
  var certType = Object.keys(data.certs)[0];
  var imagedata = data.certs[certType].image;
  return '<img width="300" src="data:image/png;base64, '+imagedata+'"/>';
}

function fullImage(e, cell) {
  var data = cell.getRow().getData();
  var certType = Object.keys(data.certs)[0];
  var imagedata = data.certs[certType].image;
  bootbox.alert({size: 'xl', message:'<img src="data:image/png;base64, '+imagedata+'"/>'});
}

function initPage() {
  table = new Tabulator("#certs", {
    columns: [
      {formatter: approveIcon, width:40, align:"center", cellClick: approveCert},
      {formatter: disapproveIcon, width:40, align:"center", cellClick: disapproveCert},
      {title: 'Volunteer Name', formatter: volName},
      {title: 'Volunteer Email', field: 'email', formatter:"link", formatterParams:{urlPrefix:"mailto://", target:"_blank"}},
      {title: 'Cert Type', formatter: certType},
      {title: 'Cert Image', formatter: certImage, width: 300, cellClick: fullImage}
    ]
  });
  $.ajax({
    url: '../api/v1/certs',
    complete: gotCertTypes
  });
}

$(initPage);
