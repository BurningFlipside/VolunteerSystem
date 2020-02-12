var tableData = {};

function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to get events!');
    return;
  }
  var shifts = jqXHR.responseJSON;
  tableData['total'].shifts = shifts.length;
  for(var i = 0; i < shifts.length; i++) {
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
    array.push(tableData[key]);
  }
  console.log(array);
  var table = new Tabulator("#shift_stats", {
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

function retrySelect2() {
  if($(this.id).select2 !== undefined) {
    var sel2 = $(this.id).select2({data: this.data});
    if(this.change !== undefined) {
      sel2.change(eventChanged);
      eventChanged({target: $(this.id)[0]});
    }
    return;
  }
  var boundRetry = retrySelect2.bind(this);
  setTimeout(boundRetry, 100);
}

function gotEvents(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to get events!');
    return;
  }
  var events = jqXHR.responseJSON;
  var data = [];
  for(var i = 0; i < events.length; i++) {
    if(events[i]['available']) {
      data.push({id: events[i]['_id']['$oid'], text: events[i]['name']});
    }
  }
  var boundRetry = retrySelect2.bind({id: '#event', data: data, change: eventChanged});
  if($('#departments').select2 === undefined) {
    setTimeout(boundRetry, 100);
    return;
  }
  boundRetry();
}

function gotDepartments(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to get departments!');
    return;
  }
  var depts = jqXHR.responseJSON;
  tableData = {
    'total': {name: 'Total', shifts: 0, hours: 0, unfilled: 0, unfilledHours: 0, filled: 0, filledHours: 0}
  };
  for(var i = 0; i < depts.length; i++) {
    tableData[depts[i]['departmentID']] = {name: depts[i]['departmentName'], shifts: 0, hours: 0, unfilled: 0, unfilledHours: 0, filled: 0, filledHours: 0};
  }
}

function initPage() {
  $.ajax({
    url: '../api/v1/events',
    complete: gotEvents
  });
  $.ajax({
    url: '../api/v1/departments',
    complete: gotDepartments
  });
}

$(initPage);
