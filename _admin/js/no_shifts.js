function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var tbody = $('#shiftTable tbody');
  var participants = this;
  tbody.empty();
  for(var i = 0; i < data.length; i++) {
    if(data[i].participant !== undefined && participants[data[i].participant] !== undefined) {
      participants[data[i].participant].shiftCount++;
    }
  }
  for(var uid in participants) {
    var part = participants[uid];
    if(part.shiftCount > 0) {
      continue;
    }
    let certs = '';
    if(part.certs !== undefined) {
      for(var cert in part.certs) {
        certs+=cert+' ';
      }
    }
    tbody.append('<tr><td>'+uid+'</td><td>'+certs+'</td></tr>');
  }
}

function gotVols(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var participants = {};
  for(var i = 0; i < data.length; i++) {
    data[i].shiftCount = 0;
    participants[data[i].uid] = data[i];
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
  }
  else {
    var filter = '';
    for(var i = 0; i < certs.length; i++) {
      if(certs[i] === 'none') {
        certs.splice(i, 1);
        break;
      }
    }
    for(var i = 0; i < certs.length; i++) {
      filter += 'certs.'+certs[i]+'.status%20eq%20current';
      if(i < certs.length - 1) {
        filter += ' or '
      }
    }
    $.ajax({
      url: '../api/v1/participants?$filter='+filter,
      complete: gotVols
    });
  }
}

function eventChanged(e) {
  getVols();
}

function certChanged(e) {
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
  for(var i = 0; i < data.length; i++) {
    var opt = new Option(data[i].name, data[i].certID, true, true);
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
        for(var i = 0; i < data.length; i++) {
          res.push({id: data[i]['_id']['$oid'], text: data[i].name});
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
