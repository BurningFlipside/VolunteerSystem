/*global $, Tabulator*/
/* exported tableToCSV, tableToXLSX*/
var tableData = {};

function timeToString(time) {
  if(time % 1 === 0) {
    return time;
  }
  let mins = Math.round((time % 1)*60);
  let hours = Math.floor(time);
  return hours+':'+mins;
}

function gotShifts(shifts) {
  let inviteOnly = document.getElementById('hideInviteOnly').checked;
  if(!inviteOnly) {
    tableData['total'].shifts = shifts.length;
  }
  let groupPending = document.getElementById('groupPending').checked;
  let hideEmptyUnbound = document.getElementById('unbound').checked;
  for(let shift of shifts) {
    if(shift.enabled === false) {
      continue;
    }
    if(hideEmptyUnbound && shift.unbounded === true && (shift.status === undefined || shift.status === 'unfilled')) {
      continue;
    }
    if(inviteOnly) {
      if(shift.whyClass === 'INVITE') {
        continue;
      } else {
        tableData['total'].shifts++;
      }
    }
    tableData[shift.departmentID].shifts++;
    let start = new Date(shift.startTime);
    let end = new Date(shift.endTime);
    let milliseconds = end - start;
    let minutes = milliseconds/(1000*60);
    let hours = (minutes*1.0)/60;
    if(hours < 0) {
      console.log(shift);
    }
    tableData['total'].hours += hours;
    tableData[shift.departmentID].hours += hours;
    if(groupPending && shift.status && shift.status === 'groupPending') {
      tableData['total'].filled++;
      tableData[shift.departmentID].filled++;
      tableData['total'].filledHours += hours;
      tableData[shift.departmentID].filledHours += hours;
    } else if(shift.status && (shift.status === 'filled' || shift.status === 'pending')) {
      tableData['total'].filled++;
      tableData[shift.departmentID].filled++;
      tableData['total'].filledHours += hours;
      tableData[shift.departmentID].filledHours += hours;
    } else {
      tableData['total'].unfilled++;
      tableData[shift.departmentID].unfilled++;
      tableData['total'].unfilledHours += hours;
      tableData[shift.departmentID].unfilledHours += hours;
    }
  }
  let array = [];
  for(let key in tableData) {
    let tmp = tableData[`${key}`];
    tmp.hours = timeToString(tmp.hours);
    tmp.filledHours = timeToString(tmp.filledHours);
    tmp.unfilledHours = timeToString(tmp.unfilledHours);
    tmp.percent = Number.parseFloat((tmp.filled/tmp.shifts)*100).toPrecision(4);
    if(tmp.shifts === 0) {
      tmp.percent = 0;
    }
    array.push(tmp);
  }
  let tables = Tabulator.findTable('#shift_stats');
  if(tables !== false && tables.length !== 0) {
    tables[0].setData(array);
    return;
  }
  let table = new Tabulator('#shift_stats', {
    columns: [
      {title:'Name', field: 'name'},
      {title:'Shift Count', field: 'shifts', sorter: 'number'},
      {title:'Total Hours', field: 'hours', sorter: 'number'},
      {title:'Filled Shift Count', field: 'filled', sorter: 'number'},
      {title:'Filled Shift Hours', field: 'filledHours', sorter: 'number'},
      {title:'Unfilled Shift Count', field: 'unfilled', sorter: 'number'},
      {title:'Unfilled Shift Hours', field: 'unfilledHours', sorter: 'number'},
      {title:'Percentage Filled', field: 'percent', sorter: 'number'}
    ],
    initialSort:[
      {column: 'hours', dir: 'desc'}
    ]
  });
  table.on('tableBuilt', () => {
    table.setData(array);
  });
}

function hideEmptyShifts(ev) {
  let hide = ev.target.checked;
  let table = Tabulator.findTable('#shift_stats')[0];
  if(hide) {
    table.addFilter('shifts', '>', '0');
  } else {
    table.removeFilter('shifts', '>', '0');
  }
}

function hideInviteOnlyShifts() {
  eventChanged({target: document.getElementById('event')});
}

function hideEmptyUnboundShifts() {
  eventChanged({target: document.getElementById('event')});
}

function tableToCSV() {
  let table = Tabulator.findTable('#shift_stats')[0];
  table.download('csv', 'shift_stats.csv');
}

function tableToXLSX() {
  let eventDropDown = document.getElementById('event');
  let eventName = eventDropDown.options[eventDropDown.selectedIndex].text;
  let table = Tabulator.findTable('#shift_stats')[0];
  table.download('xlsx', 'shift_stats.xlsx', {sheetName: eventName});
}

function eventChanged(e) {
  for(let dept in tableData) {
    tableData[`${dept}`].shifts = 0;
    tableData[`${dept}`].hours = 0;
    tableData[`${dept}`].unfilled = 0;
    tableData[`${dept}`].unfilledHours = 0;
    tableData[`${dept}`].filled = 0;
    tableData[`${dept}`].filledHours = 0;
  }
  fetch('../api/v1/events/'+e.target.value+'/shifts').then((response) => {
    response.json().then((events) => {
      gotShifts(events);
    });
  })
}

function processEvents(events) {
  let eventSelect = document.getElementById('event');
  let filter = document.getElementById('showOld').checked;
  eventSelect.options.length = 0;
  for(let event of events) {
    if(!filter && event['available']) {
      let option = new Option(event['name'], event['_id']['$oid'], eventSelect.options.length === 0);
      eventSelect.add(option);
    } else if(filter) {
      let option = new Option(event['name'], event['_id']['$oid'], eventSelect.options.length === 0);
      eventSelect.add(option);
    }
  }
  if(processEvents.dropDown === undefined) {
    let options = {searchable: true};
    processEvents.dropDown = NiceSelect.bind(eventSelect, options);
  } else {
    processEvents.dropDown.update();
  }
}

function processDepartments(depts) {
  tableData = {
    'total': {name: 'Total', shifts: 0, hours: 0, unfilled: 0, unfilledHours: 0, filled: 0, filledHours: 0}
  };
  for(let dept of depts) {
    tableData[dept['departmentID']] = {name: dept['departmentName'], shifts: 0, hours: 0, unfilled: 0, unfilledHours: 0, filled: 0, filledHours: 0};
  }
}

function gotInitialData(results) {
  let eventResult = results.shift();
  let deptResult = results.shift();
  processEvents(eventResult.value);
  processDepartments(deptResult.value);
  eventChanged({target: document.getElementById('event')});
}

function checkXLSX() {
  if(window.XLSX === undefined) {
    setTimeout(checkXLSX, 100);
    return;
  }
  let header = document.getElementsByClassName('page-header');
  if(header !== false && header.length > 0) {
    let button = document.createElement('button');
    button.className = 'btn btn-link';
    button.innerHTML = '<i class="fas fa-file-excel"></i>';
    button.title = 'Export to Excel';
    button.onclick = tableToXLSX;
    header[0].appendChild(button);
  }
}

function refreshEvents(jqXHR) {
  if(jqXHR.status === 200) {
    processEvents(jqXHR.responseJSON);
  }
}

function showOldEvents() {
  $.ajax({
    url: '../api/v1/events',
    complete: refreshEvents
  });
}

function initPage() {
  if(NiceSelect === undefined) {
    window.setTimeout(initPage, 100);
    return;
  }
  let promises = [];
  promises.push(fetch('../api/v1/events').then((response) => {
    if(response.httpStatus === 401) {
      return [];
    }
    return response.json();
  }));
  promises.push(fetch('../api/v1/departments').then((response) => {
    if(response.httpStatus === 401) {
      return [];
    }
    return response.json();
  }));
  Promise.allSettled(promises).then(gotInitialData);
  setTimeout(checkXLSX, 1);
  document.getElementById('hideEmpty').addEventListener('change', hideEmptyShifts);
  document.getElementById('hideInviteOnly').addEventListener('change', hideInviteOnlyShifts);
  document.getElementById('showOld').addEventListener('change', showOldEvents);
  document.getElementById('groupPending').addEventListener('change', hideInviteOnlyShifts);
  document.getElementById('unbound').addEventListener('change', hideEmptyUnboundShifts);
}

window.onload = initPage;
