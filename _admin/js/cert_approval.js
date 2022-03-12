/* global $, bootbox, Tabulator*/
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
    alert('Unable to obtain certification types!');
    console.log(jqXHR);
    return;
  }
  var data = jqXHR.responseJSON;
  for(let cert of data) {
    $.ajax({
      url: '../api/v1/participants?$filter=certs.'+cert.certID+'.status%20eq%20pending&$select=firstName,lastName,email,burnerName,uid,certs.'+cert.certID,
      context: cert.certID,
      complete: gotUsersWithPendingCerts
    });
    certs[cert.certID] = cert;
  }
}

function finishedCertOp(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Could not complete certification operation');
    console.log(jqXHR);
    return;
  }
  location.reload();
}

function approveCert(e, cell) {
  var data = cell.getRow().getData();
  var certType = Object.keys(data.certs)[0];
  if(certs[`${certType}`].expires) {
    //TODO Expires dialog...
    alert('TODO');
    return;
  }
  $.ajax({
    url: '../api/v1/participants/'+data.uid+'/certs/'+certType+'/Actions/AcceptCert',
    contentType: 'application/json',
    method: 'POST',
    complete: finishedCertOp
  });
}

function disapproveCert(e, cell) {
  var data = cell.getRow().getData();
  var certType = Object.keys(data.certs)[0];
  bootbox.prompt({ 
    title: 'Why are you rejecting this certification?',
    inputType: 'select',
    inputOptions: [
      {text: 'It is not a valid cerification', value: 'invalid'},
      {text: 'It is already expired', value: 'expired'}
    ],
    callback: function(result){ 
      if(result === null) {
        //User canceled the dialog
        return;
      }
      var obj = {reason: result};
      $.ajax({
        url: '../api/v1/participants/'+data.uid+'/certs/'+certType+'/Actions/RejectCert',
        data: JSON.stringify(obj),
        contentType: 'application/json',
        method: 'POST',
        complete: finishedCertOp
      });
    }
  });
}

function approveIcon() {
  return '<i class="fas fa-thumbs-up"></i>';
}

function disapproveIcon() {
  return '<i class="fas fa-thumbs-down"></i>';
}

function volName(cell) {
  var data = cell.getRow().getData();
  return data.firstName+' "'+data.burnerName+'" '+data.lastName;
}

function certType(cell) {
  var data = cell.getRow().getData();
  var certType = Object.keys(data.certs)[0];
  return certs[`${certType}`].name;
}

function certImage(cell) {
  var data = cell.getRow().getData();
  var certType = Object.keys(data.certs)[0];
  var imagedata = data.certs[`${certType}`].image;
  var imagetype = data.certs[`${certType}`].imageType;
  if(imagetype === 'application/pdf') {
    return '<object width="300" data="data:'+imagetype+';base64, '+imagedata+'"/>';
  }
  return '<img width="300" src="data:'+imagetype+';base64, '+imagedata+'"/>';
}

function fullImage(e, cell) {
  var data = cell.getRow().getData();
  var certType = Object.keys(data.certs)[0];
  var imagedata = data.certs[`${certType}`].image;
  var imagetype = data.certs[`${certType}`].imageType;
  if(imagetype === 'application/pdf') {
    bootbox.alert({size: 'xl', message:'<object data="data:'+imagetype+';base64, '+imagedata+'" style="width: 100%; height: '+screen.height*3/5+'px"/>'});
    return;
  }
  bootbox.alert({size: 'xl', message:'<img src="data:'+imagetype+';base64, '+imagedata+'"/>'});
}

function initPage() {
  table = new Tabulator('#certs', {
    columns: [
      {formatter: approveIcon, width:40, align: 'center', cellClick: approveCert},
      {formatter: disapproveIcon, width:40, align: 'center', cellClick: disapproveCert},
      {title: 'Volunteer Name', formatter: volName},
      {title: 'Volunteer Email', field: 'email', formatter: 'link', formatterParams:{urlPrefix: 'mailto://', target: '_blank'}},
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
