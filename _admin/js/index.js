/*global $, Chart, addOptiontoSelect*/
/* exported favoriteEvent */
Chart.pluginService.register({
  beforeDraw: function (chart) {
    if (chart.config.options.elements.center) {
      //Get ctx from string
      var ctx = chart.chart.ctx;

      //Get options from the center object in options
      var centerConfig = chart.config.options.elements.center;
      var fontStyle = centerConfig.fontStyle || 'Arial';
      var txt = centerConfig.text;
      var color = centerConfig.color || '#000';
      var sidePadding = centerConfig.sidePadding || 20;
      var sidePaddingCalculated = (sidePadding/100) * (chart.innerRadius * 2);
      //Start with a base font of 30px
      ctx.font = '30px ' + fontStyle;

      //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
      var stringWidth = ctx.measureText(txt).width;
      var elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;

      // Find out how much the font can grow in width.
      var widthRatio = elementWidth / stringWidth;
      var newFontSize = Math.floor(30 * widthRatio);
      var elementHeight = (chart.innerRadius * 2);

      // Pick a new font size so it will not be larger than the height of label.
      var fontSizeToUse = Math.min(newFontSize, elementHeight);

      //Set font settings to draw it correctly.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
      var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
      ctx.font = fontSizeToUse+'px ' + fontStyle;
      ctx.fillStyle = color;

      //Draw text in center
      ctx.fillText(txt, centerX, centerY);
    }
  }
});

function gotDepartments(jqXHR) {
  if(jqXHR.responseJSON !== undefined) {
    $('#deptCount').html(jqXHR.responseJSON['@odata.count']);
    var array = jqXHR.responseJSON.value;
    array = array.sort((a,b) => {
      return a.departmentName.localeCompare(b.departmentName);
    });
    $('#deptName').html('Unable to locate department!');
    var departments = $('#departments');
    departments.change(showDepartmentDetails);
    var deptCount = 0;
    for(let dept of array) {
      if(dept.isAdmin) {
        $('#deptName').html(dept.departmentName);
        addOptiontoSelect(departments[0], dept.departmentID, dept.departmentName);
        deptCount++;
      }
    }
    if(deptCount === 0) {
      alert('Unable to determine which department is assosiated to your account. Please contact your AF to fix your access.');
    }
    if(chart === null) {
      var eventID = $('#events').val();
      var deptID = $('#departments').val();
      var url = '../api/v1/events/'+eventID+'/shifts?$filter=departmentID eq '+deptID;
      $.ajax({
        url: url,
        complete: gotShifts
      });
    }
  }
}

function gotRoles(jqXHR) {
  if(jqXHR.responseJSON !== undefined) {
    var roles = jqXHR.responseJSON;
    var count = 0;
    for(let role of roles) {
      if(role.isAdmin) {
        count++;
      }
    }
    $('#roleCount').html(count);
  }
}

function chartClick(e) {
  var slice = this.getElementAtEvent(e)[0];
  var index = slice._index;
  var eventId = $('#events').val();
  var deptId = $('#departments').val();
  if(deptId === '*') {
    location.href = 'shifts.php?event='+eventId+'&filled='+index+'&hideEmpty=true';
  }
  else {
    location.href = 'shifts.php?event='+eventId+'&department='+deptId+'&filled='+index+'&hideEmpty=true';
  }
}

function makeShiftTimeLine(shifts) {
  let canvas = document.getElementById('shiftsFilledTimeLine');
  let ctx = canvas.getContext('2d');
  let dates = {};
  for(let shift of shifts) {
    if(shift.signupTime === undefined || shift.signupTime === '') {
      continue;
    }
    let datetime = new Date(shift.signupTime);
    let year = datetime.getFullYear();
    let month = datetime.getMonth();
    let day = datetime.getDate();
    let id = year+'-'+month+'-'+day;
    if(dates[`${id}`] === undefined) {
      dates[`${id}`] = {filled: 0, pending: 0};
    }
    if(shift.status === 'filled') {
      dates[`${id}`].filled++;
    }
    else if(shift.status === 'pending') {
      dates[`${id}`].pending++;
    }
  }
  let dateIds = Object.keys(dates);
  dateIds.sort();
  let lastFilled = 0;
  let lastPending = 0;
  let filled = [];
  let pending = [];
  for(let id of dateIds) {
    dates[`${id}`].filled += lastFilled;
    lastFilled = dates[`${id}`].filled;
    filled.push(dates[`${id}`].filled);
    dates[`${id}`].pending += lastPending;
    lastPending = dates[`${id}`].pending;
    pending.push(dates[`${id}`].pending);
  }
  let data = {
    datasets: [{
      label: 'Filled',
      backgroundColor: '#66c2a5',
      data: filled
    },
    {
      label: 'Pending',
      backgroundColor: '#f46d43',
      data: pending
    }],
    labels: dateIds
  };
  let options = {
    tooltips: {
      mode: 'index'
    },
    scales: {
      yAxes: [{
        stacked: true
      }]
    }
  };
  new Chart(ctx, {type: 'line',
    data: data,
    options: options
  });
}

var chart = null;

function gotShifts(jqXHR) {
  var canvas = document.getElementById('shiftsFilled');
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if(chart !== null) {
    chart.destroy();
  }
  if(jqXHR.status !== 200) {
    ctx.fillText('Unable to obtain shift data', 10, 50);
    console.log(jqXHR);
  }
  else {
    var data = jqXHR.responseJSON;
    if(data.length === 0) {
      ctx.fillText('Event has no shifts!', 10, 50);
    }
    else {
      var filled = 0;
      var pending = 0;
      var unfilled = data.length;
      for(let shift of data) {
        if(shift.status && shift.status === 'filled') {
          filled++;
          unfilled--;
        } else if(shift.status && shift.status === 'pending') {
          pending++;
          unfilled--;
        }
      }
      var percent = (filled/unfilled)*100;
      var text = Number.parseFloat(percent).toPrecision(4)+'%';
      if(percent !== 0 && percent < 1) {
        text = '<1%';
      }
      var options = {
        elements: {
          center: {
            text: text
          }
        },
        onClick: chartClick
      };
      let chartData = {
        datasets: [{
          data: [unfilled, filled, pending],
          backgroundColor: ['#d53e4f', '#66c2a5', '#f46d43']
        }],
        labels: ['Unfilled', 'Filled', 'Pending']
      };
      chart = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: options
      });
    }
    makeShiftTimeLine(jqXHR.responseJSON);
  }
}

function showEventDetails(e) {
  var favorite = localStorage.getItem('adminEvent');
  var eventID = e.target.value;
  if($('#departments').val() !== null) {
    $.ajax({
      url: '../api/v1/events/'+eventID+'/shifts',
      complete: gotShifts
    });
  }
  if(favorite === eventID) {
    $('#eventStar').removeClass('far').addClass('fas');
  }
  else {
    $('#eventStar').removeClass('fas').addClass('far');
  }
}

function showDepartmentDetails(e) {
  var eventID = $('#events').val();
  var deptID = e.target.value;
  var url = '../api/v1/events/'+eventID+'/shifts?$filter=departmentID eq '+deptID;
  if(deptID === '*') {
    url = '../api/v1/events/'+eventID+'/shifts';
  }
  $.ajax({
    url: url,
    complete: gotShifts
  });
}

function gotEvents(jqXHR) {
  if(jqXHR.responseJSON !== undefined) {
    var resp = jqXHR.responseJSON;
    $('#eventCount').html(resp['@odata.count']);
    resp.value.sort(function(a, b) {
      var aDate = new Date(a.startTime);
      var bDate = new Date(b.startTime);
      return aDate.getTime() - bDate.getTime();
    });
    var events = $('#events');
    events.change(showEventDetails);
    for(let event of resp.value) {
      if(event.why === 'Event is in the past') {
        continue;
      }
      events.append('<option value="'+event['_id']['$oid']+'">'+event.name+'</option>');
    }
    let eventID = localStorage.getItem('adminEvent');
    if(eventID !== null) {
      events.val(eventID);
    }
    showEventDetails({target: events[0]});
  }
}

function gotVols(jqXHR) {
  if(jqXHR.responseJSON !== undefined) {
    var resp = jqXHR.responseJSON;
    $('#volCount').html(resp['@odata.count']);
  }
}

function favoriteEvent() {
  localStorage.setItem('adminEvent', $('#events').val());
  $('#eventStar').removeClass('far').addClass('fas');
}

function initIndex() {
  $.ajax({
    url: '../api/v1/departments?$count=true',
    complete: gotDepartments
  });
  $.ajax({
    url: '../api/v1/roles',
    complete: gotRoles
  });
  $.ajax({
    url: '../api/v1/events?$count=true',
    complete: gotEvents
  });
  $.ajax({
    url: '../api/v1/participants?$count=true',
    complete: gotVols
  });
}

$(initIndex);
