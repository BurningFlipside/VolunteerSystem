function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var data = jqXHR.responseJSON;
  var tbody = $('#shiftTable tbody');
  var participants = this;
  tbody.empty();
  console.log(data);
  for(var i = 0; i < data.length; i++) {
    if(data[i].participant !== undefined) {
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
    console.log(part);
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
  $.ajax({
    url: '../api/v1/events/'+$('#event').val()+'/shifts',
    complete: gotShifts,
    context: participants
  });
}

function getVols() {
  $.ajax({
    url: '../api/v1/participants',
    complete: gotVols
  });
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
