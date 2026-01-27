function initPage() {
  const dtOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  let shiftDiv = document.getElementById('shifts');
  fetch('api/v1/participants/me/shifts').then((response) => {
    if(!response.ok) {
      return;
    }
    response.json().then((data) => {
      let shifts = data.filter((shift) => {
        let end = new Date(shift.endTime);
        let now = new Date();
        return end > now;
      });
      if(shifts.length === 0) {
        shiftDiv.innerHTML = 'You are not signed up for any current shifts.';
        return;
      }
      let eventMap = new Map();
      for(let shift of shifts) {
        if(!eventMap.has(shift.eventID)) {
          eventMap.set(shift.eventID, []);
        }
        eventMap.get(shift.eventID).push(shift);
      }
      let promises = [];
      eventMap.forEach((value, key) => {
        promises.push(fetch('api/v1/events/'+key).then((eventResponse) => {
          return eventResponse.json().then((event) => {
            let row = document.createElement('div');
            row.classList.add('row');
            let col = document.createElement('div');
            col.classList.add('col');
            col.classList.add('align-self-start');
            let eventDiv = document.createElement('div');
            eventDiv.classList.add('text-start');
            eventDiv.innerText = event.name;
            let eventList = document.createElement('ul');
            eventList.id = key;
            console.log(eventList);
            eventDiv.appendChild(eventList);
            col.appendChild(eventDiv);
            row.appendChild(col);
            shiftDiv.appendChild(row);
          });
        }));
      });
      Promise.all(promises).then(() => {
        for(let shift of shifts) {
          let eventList = document.getElementById(shift.eventID);
          console.log(eventList);
          let shiftItem = document.createElement('li');
          let link = document.createElement('a');
          link.innerText = shift.name;
          link.href = 'signup.php?shiftID='+shift['_id']['$oid'];
          shiftItem.appendChild(link);
          let start = new Date(shift.startTime);
          let end = new Date(shift.endTime);
          let startStr = start.toLocaleDateString(undefined, dtOptions) + ' ' + start.toLocaleTimeString();
          let endStr = end.toLocaleDateString(undefined, dtOptions) + ' ' + end.toLocaleTimeString();
          if(end.getFullYear() === start.getFullYear() && end.getMonth() === start.getMonth() && end.getDate() === start.getDate()) {
            // This is the same day, no need to repeat the date
            endStr = end.toLocaleTimeString();
          }
          let text = document.createTextNode(' - '+startStr+' to '+endStr);
          shiftItem.appendChild(text);
          eventList.appendChild(shiftItem);
        }
      });
    });
  });
}

window.onload = initPage;