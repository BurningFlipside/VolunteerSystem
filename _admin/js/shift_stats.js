var tableData = {};
var table;

function timeToString(time) {
  if(time % 1 === 0) {
    return time;
  }
  let mins = Math.round((time % 1)*60);
  let hours = Math.floor(time);
  return hours+':'+mins;
}

function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to get events!');
    return;
  }
  var shifts = jqXHR.responseJSON;
  let inviteOnly = ($('#hideInviteOnly').prop("checked") === true);
  if(!inviteOnly) {
    tableData['total'].shifts = shifts.length;
  }
  for(var i = 0; i < shifts.length; i++) {
    if(inviteOnly) {
      if(shifts[i].whyClass === 'INVITE') {
        continue;
      } else {
        tableData['total'].shifts++;
      }
    }
    tableData[shifts[i].departmentID].shifts++;
    var start = new Date(shifts[i].startTime);
    var end = new Date(shifts[i].endTime);
    var milliseconds = end - start;
    var minutes = milliseconds/(1000*60);
    var hours = (minutes*1.0)/60;
    tableData['total'].hours += hours;
    tableData[shifts[i].departmentID].hours += hours;
    if(shifts[i].status && shifts[i].status === 'filled') {
      tableData['total'].filled++;
      tableData[shifts[i].departmentID].filled++;
      tableData['total'].filledHours += hours;
      tableData[shifts[i].departmentID].filledHours += hours;
    }
    else {
      tableData['total'].unfilled++;
      tableData[shifts[i].departmentID].unfilled++;
      tableData['total'].unfilledHours += hours;
      tableData[shifts[i].departmentID].unfilledHours += hours;
    }
  }
  var array = [];
  for(var key in tableData) {
    let tmp = tableData[key];
    tmp.hours = timeToString(tmp.hours);
    tmp.filledHours = timeToString(tmp.filledHours);
    tmp.unfilledHours = timeToString(tmp.unfilledHours);
    array.push(tmp);
  }
  table = new Tabulator("#shift_stats", {
    columns: [
      {title:'Name', field: 'name'},
      {title:'Shift Count', field: 'shifts', sorter:"number"},
      {title:'Total Hours', field: 'hours', sorter:"number"},
      {title:'Filled Shift Count', field: 'filled', sorter:"number"},
      {title:'Filled Shift Hours', field: 'filledHours', sorter:"number"},
      {title:'Unfilled Shift Count', field: 'unfilled', sorter:"number"},
      {title:'Unfilled Shift Hours', field: 'unfilledHours', sorter:"number"}
    ],
    initialSort:[
      {column:"hours", dir:"desc"}
    ]
  });
  table.setData(array);
}

function hideEmptyShifts() {
  let hide = ($('#hideEmpty').prop("checked") === true);
  if(hide) {
    table.addFilter('shifts', '>', '0');
  } else {
    table.removeFilter('shifts', '>', '0');
  }
}

function hideInviteOnlyShifts() {
  let hide = ($('#hideEmpty').prop("checked") === true);
  eventChanged({target: $('#event')[0]});
}

function tableToCSV() {
  let csv = ['Name, Shift Count, Total Hours, Filled Shift Count, Filled Shift Hours, Unfilled Shift Count, Unfilled Shift Hours'];
  for(var dept in tableData) {
    csv.push(dept+', '+tableData[dept].shifts+', '+tableData[dept].hours+', '+tableData[dept].filled+', '+tableData[dept].filledHours+', '+tableData[dept].unfilled+', '+tableData[dept].unfilledHours);
  }
  csv = csv.join('\n');
  let csvFile = new Blob([csv], {type: 'text/csv'});
  let link = document.createElement('a');
  link.download = 'shift_stats.csv';
  link.href = window.URL.createObjectURL(csvFile);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function tableToXLSX() {
  table.download("xlsx", "shift_stats.xlsx", {sheetName: $('#event option:selected')[0].text});
}

function eventChanged(e) {
  for(var dept in tableData) {
    tableData[dept].shifts = 0;
    tableData[dept].hours = 0;
    tableData[dept].unfilled = 0;
    tableData[dept].unfilledHours = 0;
    tableData[dept].filled = 0;
    tableData[dept].filledHours = 0;
  }
  $.ajax({
    url: '../api/v1/events/'+e.target.value+'/shifts',
    complete: gotShifts
  });
}

function processEvents(events) {
  var data = [];
  for(var i = 0; i < events.length; i++) {
    if(events[i]['available']) {
      data.push({id: events[i]['_id']['$oid'], text: events[i]['name']});
    }
  }
  var sel2 = $('#event').select2({data: data});
  sel2.change(eventChanged);
}

function processDepartments(depts) {
  tableData = {
    'total': {name: 'Total', shifts: 0, hours: 0, unfilled: 0, unfilledHours: 0, filled: 0, filledHours: 0}
  };
  for(var i = 0; i < depts.length; i++) {
    tableData[depts[i]['departmentID']] = {name: depts[i]['departmentName'], shifts: 0, hours: 0, unfilled: 0, unfilledHours: 0, filled: 0, filledHours: 0};
  }
}

function gotInitialData(results) {
  var eventResult = results.shift();
  var deptResult = results.shift();
  var obj = {};
  obj.events = processEvents(eventResult.value);
  obj.depts = processDepartments(deptResult.value);
  eventChanged({target: $('#event')[0]});
}

function retrySelect2() {
  if($('#departments').select2 !== undefined) {
    this.resolve(true);
  }
  if(this.count > 10) {
    this.reject(false);
  }
  this.count++;
  var boundRetry = retrySelect2.bind(this);
  setTimeout(boundRetry, 100);
}

function waitForSelect2(resolve, reject) {
  if($('#departments').select2 !== undefined) {
    resolve(true);
  }
  var boundRetry = retrySelect2.bind({resolve: resolve, reject: reject, count: 0});
  setTimeout(boundRetry, 100);
}

function checkXLSX() {
  if(window.XLSX === undefined) {
    setTimeout(checkXLSX, 100);
    return;
  }
  $('.page-header').append('<button type="button" class="btn btn-link" onclick="tableToXLSX();"><i class="fas fa-file-excel"></i></button>');
}

function initPage() {
  let promises = [];
  promises.push($.ajax({
    url: '../api/v1/events'
  }));
  promises.push($.ajax({
    url: '../api/v1/departments'
  }));
  promises.push(new Promise(waitForSelect2));
  Promise.allSettled(promises).then(gotInitialData);
  setTimeout(checkXLSX, 1);
  $('#hideEmpty').change(hideEmptyShifts);
  $('#hideInviteOnly').change(hideInviteOnlyShifts);
}

$(initPage);
