function gotUser(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  $('#burnerName').val(data.burnerName);
  $('#myCampName').val(data.campName);
  $('#firstName').val(data.firstName);
  $('#lastName').val(data.lastName);
  $('#myPaperName').val(data.paperName);
  $('#myWebName').val(data.webName);
  $('#myShirtSize').val(data.shirtSize);
  webNameChange();
  paperNameChange();
}

function gotMyCerts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  for(var key in data) {
    var icon = $('#'+key);
    var upload = $('#'+key+'_Upload');
    switch(data[key].status) {
      case 'pending':
        icon.html('<i class="fas fa-exclamation-triangle text-warning" title="Your certification is pending review"></i>');
        break;
    }
    console.log(data[key]);
  }
}

function getMyCerts() {
  $.ajax({
    url: 'api/v1/participants/me/certs',
    complete: gotMyCerts
  });
}

function gotCerts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var html = $('#certs');
  for(var i = 0; i < data.length; i++) {
    var title = $('<div class="col-sm-3"/>');
    var icon = $('<div class="col-sm-3" id="'+data[i].certID+'"><i class="fas fa-times text-danger"></i></div>');
    var upload = $('<div class="col-sm-6"></div>');
    var input = $('<input type="file" class="form-control-file" id="'+data[i].certID+'_Upload" title="Upload an image of your certificate" accept="image/*, application/pdf"/>');
    title.html(data[i].name);
    upload.append(input);
    html.append(title);
    html.append(icon);
    html.append(upload);
    input.change(certUpload);
  }
  getMyCerts();
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
  var val = $('#myWebName').val();
  var name = getName(val);
  $('#webDisplay').html(name); 
}

function paperNameChange() {
  var val = $('#myPaperName').val();
  var name = getName(val);
  $('#paperDisplay').html(name);
}

function getName(type) {
  var first = $('#firstName').val();
  var last = $('#lastName').val();
  var burner = $('#burnerName').val();
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

function initPage() {
  $.ajax({
    url: 'api/v1/participants/me',
    complete: gotUser
  });
  $.ajax({
    url: 'api/v1/certs',
    complete: gotCerts
  });
}

$(initPage);
