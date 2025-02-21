function gotEvents(events) {
  let availableEvents = events.filter((event) => {
    return event.available && event.hasShifts;
  });
  availableEvents.sort(function(a, b) {
    let aDate = new Date(a.startTime);
    let bDate = new Date(b.startTime);
    return aDate.getTime() - bDate.getTime();
  });
  const div = document.getElementById('events');
  for(const event of availableEvents) {
    let buttonDiv = document.createElement('div');
    buttonDiv.className = 'card';
    buttonDiv.style.cursor = 'pointer';
    buttonDiv.dataset['eventID'] = event['_id']['$oid'];

    let cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    let row = document.createElement('div');
    row.className = 'row';

    let buttonTextDiv = document.createElement('div');
    buttonTextDiv.className = 'col-11';
    buttonTextDiv.innerHTML = `${event.name}<br/><i>${new Date(event.startTime)} until ${new Date(event.endTime)}</i>`;

    let buttonIconDiv = document.createElement('div');
    buttonIconDiv.className = 'col-1 align-self-center';
    buttonIconDiv.innerHTML = '<i class="fas fa-chevron-right"></i>';

    row.appendChild(buttonTextDiv);
    row.appendChild(buttonIconDiv);
    cardBody.appendChild(row);
    buttonDiv.appendChild(cardBody);
    div.appendChild(buttonDiv);
    
    buttonDiv.addEventListener('click', gotoEventPage);
  }
}

function gotoEventPage() {
  location.href = `guidedDepartment.php?eventID=${this.dataset.eventID}`;
}

function initPage() {
  fetch('api/v1/events').then((response) => {
    if(!response.ok) {
      if(response.status === 401) {
        // We are logged out, just do nothing the underlying framework will
        // handle the redirect to the login page.
        return;
      }
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(gotEvents).catch((error) => {
    let content = document.getElementById('content');
    content.innerHTML += '<div class="container text-center h3">Unable to load event data.</div>';
    console.error('There has been a problem with your fetch operation:', error);
  });
}

// Wait's for the FVS to respond ready, this waits until they have
// a profile to work with.
function waitForFVSReady() {
  if(!document.body.dataset.profile) {
    console.log('Waiting for profile...');
    document.body.addEventListener('fvs:ready', initPage);
    return;
  }
  //FVS already initialized before this js loaded
  initPage();
}

window.onload = waitForFVSReady;
/* vim: set tabstop=2 shiftwidth=2 expandtab: */
