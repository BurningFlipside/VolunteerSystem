function initPage() {
  fetch('api/v1/events').then((response) => {
    if(!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(handleEventResponse).catch((error) => {
    let content = document.getElementById('content');
    content.innerHTML += '<div class="container text-center h3">Unable to load event data.</div>';
    console.error('There has been a problem with your fetch operation:', error);
  });
}

function handleEventResponse(data) {
  const availableEvents = data.filter((event) => {
    return event.available;
  });
  let flipside = false;
  for(let event of availableEvents) {
    if(event.alias === 'flipside') {
      flipside = true;
      const eventId = event['_id']['$oid'];
      let flipElem = document.getElementById('flipsideGuided');
      if(flipElem) {
        flipElem.addEventListener('click', () => {
          window.location.href = 'guidedDepartment.php?eventID='+eventId;
        });
      }
      flipElem = document.getElementById('flipsideTimeline');
      if(flipElem) {
        flipElem.addEventListener('click', () => {
          window.location.href = 'timeline.php?eventID='+eventId;
        });
      }
      flipElem = document.getElementById('flipsideManage');
      if(flipElem) {
        flipElem.addEventListener('click', () => {
          window.location.href = 'manage.php?eventID='+eventId;
        });
      }
      break;
    }
  }
  if(flipside) {
    showFlipsideCards();
  }
}

// This function shows the Flipside specific cards
function showFlipsideCards() {
  let flipsideCards = document.querySelectorAll('.flipside');
  console.log(flipsideCards);
  for(let card of flipsideCards) {
    card.style.display = 'flex';
    card.style.cursor = 'pointer';
  }
}

window.onload = initPage;