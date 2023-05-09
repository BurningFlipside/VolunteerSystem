function gotEvents(jqXHR) {
  if(jqXHR.status !== 200) {
    if(jqXHR.status === 401) {
      return;
    }
    console.log(jqXHR);
    alert('Unable to get events please contact your lead for assistance!');
    return;
  }
  let events = jqXHR.responseJSON;
  events.sort(function(a, b) {
    var aDate = new Date(a.startTime);
    var bDate = new Date(b.startTime);
    return aDate.getTime() - bDate.getTime();
  });
  let div = $('#events');
  for(let event of events) {
    if(event.available && event.hasShifts) {
      let buttonDiv = $('<div class="card" style="cursor: pointer;" data-eventID="'+event['_id']['$oid']+'"><div class="card-body"><div class="row"><div class="col-11">'+event.name+'<br/><i>'+new Date(event.startTime)+' until '+new Date(event.endTime)+'</i></div><div class="col-1 align-self-center"><i class="fas fa-chevron-right"></i></div></div></div></div>');
      div.append(buttonDiv);
      buttonDiv.on('click', gotoEventPage);
    }
  }
}

function gotoEventPage(ev) {
  location.href = 'guidedDepartment.php?eventID='+ev.currentTarget.dataset.eventid;
}

function initPage() {
  $.ajax({
    url: 'api/v1/events',
    complete: gotEvents
  });
}

$(() => {
  $('body').on('fvs:ready', function() {
    initPage();
  });
});
/* vim: set tabstop=2 shiftwidth=2 expandtab: */