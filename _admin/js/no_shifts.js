/*global $*/
function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var tbody = $('#shiftTable tbody');
  var participants = this;
  tbody.empty();
  for(let shift of data) {
    if(shift.participant !== undefined && participants[shift.participant] !== undefined) {
      participants[shift.participant].shiftCount++;
    }
  }
  for(var uid in participants) {
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
  var data = jqXHR.responseJSON;
  var participants = {};
  for(let vol of data) {
    vol.shiftCount = 0;
    participants[vol.uid] = vol;
  }
  var event = $('#event').val();
  if(event !== null) {
    $.ajax({
      url: '../api/v1/events/'+event+'/shifts',
      complete: gotShifts,
      context: participants
    });
  }
  else {
    $.ajax({
      url: '../api/v1/shifts',
      complete: gotShifts,
      context: participants
    });
  }
}

function getVols() {
  var certs = $('#certs').val();
  if(certs.includes('none')) {
    $.ajax({
      url: '../api/v1/participants',
      complete: gotVols
    });
  } else {
    var filter = '';
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
  for(let cert of data) {
    let opt = new Option(cert.name, cert.certID, true, true);
    $('#certs').append(opt);
  }
  $('#certs').trigger('change');
}

function initPage() {
  $('#event').select2({
    ajax: {
      url: '../api/v1/events',
      processResults: function(data) {
        var res = [];
        data.sort((a,b) => {
          return a.name.localeCompare(b.name);
        });
        for(let event of data) {
          res.push({id: event['_id']['$oid'], text: event.name});
        }
        return {results: res};
      }
    }
  });
  $.ajax({
    url: '../api/v1/certs',
    complete: gotCerts
  });
  $('#certs').select2();
  $('#event').change(eventChanged);
  $('#certs').change(certChanged);
}

$(initPage);
