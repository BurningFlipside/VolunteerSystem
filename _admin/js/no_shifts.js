/*global $*/
function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  let data = jqXHR.responseJSON;
  let tbody = $('#shiftTable tbody');
  let participants = this;
  tbody.empty();
  for(let shift of data) {
    if(shift.participant !== undefined && participants[shift.participant] !== undefined) {
      participants[shift.participant].shiftCount++;
    } else {
      console.log(shift);
    }
  }
  for(let uid in participants) {
    let part = participants[`${uid}`];
    if(part.shiftCount > 0) {
      continue;
    }
    let certs = '';
    if(part.certs !== undefined) {
      for(var cert in part.certs) {
        certs+=cert+' ';
      }
    }
    tbody.append('<tr><td>'+uid+'</td><td>'+part.email+'</td><td>'+certs+'</td></tr>');
  }
}

function gotVols(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  let data = jqXHR.responseJSON;
  let participants = {};
  for(let vol of data) {
    vol.shiftCount = 0;
    participants[vol.uid] = vol;
  }
  let event = document.getElementById('event').value;
  if(event !== null) {
    $.ajax({
      url: '../api/v1/events/'+event+'/shifts',
      complete: gotShifts,
      context: participants
    });
  } else {
    $.ajax({
      url: '../api/v1/shifts',
      complete: gotShifts,
      context: participants
    });
  }
}

function getVols() {
  let certSelect = document.getElementById('certs');
  let certs = Array.from(certSelect.selectedOptions).reduce((arr, option)=>{
    if(option.selected) {
      arr.push(option.value);
    }
    return arr;
  }, []);
  if(certs.includes('none')) {
    $.ajax({
      url: '../api/v1/participants',
      complete: gotVols
    });
  } else {
    let filter = '';
    for(let cert of certs) {
      filter += 'certs.'+cert+'.status%20eq%20current';
      filter += ' or ';
    }
    filter = filter.slice(0, -4);
    $.ajax({
      url: '../api/v1/participants?$filter='+filter,
      complete: gotVols
    });
  }
}

function eventChanged() {
  getVols();
}

function certChanged() {
  getVols();
}

function gotCerts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  data.sort((a,b) => {
    return a.name.localeCompare(b.name);
  });
  let certSelect = document.getElementById('certs');
  for(let cert of data) {
    let opt = new Option(cert.name, cert.certID, true, true);
    certSelect.add(opt);
  }
  certSelect.addEventListener('change', certChanged);
  certChanged();
}

function initPage() {
  fetch('../api/v1/events').then((response) => {
    if(response.httpStatusCode === 401) {
      return;
    }
    response.json().then((data) => {
      let eventSelect = document.getElementById('event');
      data.sort((a, b) => {
        let aStart = new Date(a.startTime);
        let bStart = new Date(b.startTime);
        return aStart - bStart;
      });
      eventSelect.add(new Option(''));
      for(let event of data) {
        let opt = new Option(event.name, event['_id']['$oid']);
        eventSelect.add(opt);
      }
      eventSelect.addEventListener('change', eventChanged);
    });
  });
  $.ajax({
    url: '../api/v1/certs',
    complete: gotCerts
  });
  $('#certs').select2();
}

window.onload = initPage;
