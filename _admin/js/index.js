function gotDepartments(jqXHR) {
  if(jqXHR.responseJSON !== undefined) {
    $('#deptCount').html(jqXHR.responseJSON['@odata.count']);
  }
}

function gotRoles(jqXHR) {
  if(jqXHR.responseJSON !== undefined) {
    $('#roleCount').html(jqXHR.responseJSON['@odata.count']);
  }
}

function gotShifts(jqXHR) {
  var ctx = document.getElementById('shiftsFilled').getContext('2d');
  if(jqXHR.status !== 200) {
    ctx.fillText('Unable to obtain shift data', 10, 50);
    console.log(jqXHR);
  }
  else {
    var data = jqXHR.responseJSON;
    if(data.length === 0) {
      ctx.fillText('Event has no shifts!', 10, 50);
    }
  }
}

function showEventDetails(e) {
  var eventID = e.target.value;
  $.ajax({
    url: '../api/v1/events/'+eventID+'/shifts',
    complete: gotShifts
  });
}

function gotEvents(jqXHR) {
  if(jqXHR.responseJSON !== undefined) {
    var resp = jqXHR.responseJSON;
    $('#eventCount').html(resp['@odata.count']);
    var events = $('#events');
    events.change(showEventDetails);
    for(var i = 0; i < resp.value.length; i++) {
      events.append('<option value="'+resp.value[i]['_id']['$id']+'">'+resp.value[i].name+'</option>');
    }
    showEventDetails({target: events[0]});
  }
}

function initIndex() {
  $.ajax({
    url: '../api/v1/departments?$count=true',
    complete: gotDepartments
  });
  $.ajax({
    url: '../api/v1/roles?$count=true',
    complete: gotRoles
  });
  $.ajax({
    url: '../api/v1/events?$count=true',
    complete: gotEvents
  });
}

$(initIndex);
