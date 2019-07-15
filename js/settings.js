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
}

$(initPage);
