/*global $, bootbox*/
/*exported generateCSV*/

function generateCSV() {
  let csv = [];
  let rows = document.getElementsByTagName('tr');
  for(let row of rows) {
    let cols = row.querySelectorAll('td,th');
    let csvRow = [];
    for(let col of cols) {
      csvRow.push(col.innerHTML);
    }
    csv.push(csvRow.join(","));
  }
  csv = csv.join('\n');
  let csvFile = new Blob([csv], {type: 'text/csv'});
  let link = document.createElement('a');
  link.download = 'report_no_ticket.csv';
  link.href = window.URL.createObjectURL(csvFile);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function gotTicketStatuses(participants, results) {
  let ticketStatusData = results.pop();
  if(ticketStatusData.status !== 'fulfilled') {
    console.log(ticketStatusData);
    alert('Unable to get ticket status data!');
    return;
  }
  let participantData = results.pop();
  if(participantData.status !== 'fulfilled') {
    console.log(participantData);
    alert('Unable to get participant data!');
    return;
  }
  participantData = participantData.value;
  ticketStatusData = ticketStatusData.value;
  let showRegistered = $('#showRegistered')[0].checked;
  let table = $('#volTable');
  for(let uid in participants) {
    let participant = participants[`${uid}`];
    //All promises are settled now...
    let ticketStatus = ticketStatusData[`${uid}`];
    if(ticketStatus !== undefined && ticketStatus.ticket === true) {
      continue;
    }
    if(ticketStatus !== undefined && ticketStatus.request === true && showRegistered === false) {
      continue;
    }
    let name = '<i>'+uid+'</i>';
    let email = '';
    let details = participantData.find(obj => {return obj.uid === uid});
    if(details !== undefined) {
      if(details.burnerName !== undefined && details.burnerName.length > 0 && details.burnerName !== details.firstName) {
        name = details.firstName+' "'+details.burnerName+'" '+details.lastName;
      } else {
        name = details.firstName+' '+details.lastName;
      }
      email = details.email;
    }
    table.append('<tr><td>'+name+'</td><td>'+email+'</td><td>'+participant.departments.join()+'</td><td>'+participant.count+'</td></tr>');
  }
}

function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  let dialog = bootbox.dialog({ 
    message: '<div class="text-center"><i class="fa fa-spin fa-spinner"></i> Loading...</div>', 
    closeButton: false 
  });
  let participants = {};
  let promises = [];
  let data = jqXHR.responseJSON;
  for(let shift of data) {
    if(shift.participant === undefined || shift.participant === '') {
      continue;
    }
    if(participants[shift.participant] === undefined) {
      participants[shift.participant] = {count: 0, departments: []};
      promises.push(participants[shift.participant].ticketStatus);
    }
    participants[shift.participant].count++;
    if(!participants[shift.participant].departments.includes(shift.departmentID)) {
      participants[shift.participant].departments.push(shift.departmentID);
    }
  }
  let partArray = Object.keys(participants);
  promises.push($.ajax({
    url: '../api/v1/participants/?$filter=uid in ('+partArray.join(',')+')&$select=uid,email,firstName,lastName,burnerName'
  }));
  let obj = {uids: partArray};
  promises.push($.ajax({
    url: '../api/v1/participants/Actions/BulkTicketStatus',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(obj)
  }));
  Promise.allSettled(promises).then((results) => {gotTicketStatuses(participants, results)}).finally(() => {dialog.modal('hide')});
}

function eventChanged() {
  $.ajax({
    url: '../api/v1/events/'+$('#event').val()+'/shifts',
    complete: gotShifts
  });
}

function initPage() {
  $('#event').select2({
    ajax: {
      url: '../api/v1/events?$filter=tickets eq true',
      processResults: function(data) {
        let res = [];
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
  $('#event').change(eventChanged);
}

$(initPage);