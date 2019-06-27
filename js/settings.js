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

function initPage() {
  $.ajax({
    url: 'api/v1/participants/me',
    complete: gotUser
  });
}

$(initPage);
