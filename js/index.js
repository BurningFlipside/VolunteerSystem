/* global $, FullCalendar, add_notification, getParameterByName */
/* exported unhideFilters */
var calendar;
var start;
var end;
var allEvents = [];
var allDepts = [];
var roles = {};
var validDepts = [];

function getDateRange() {
  return {
    start: start,
    end: end
  };
}

function getDeptName(deptID) {
  let option = $('#departments option[value="'+deptID+'"]');
  if(option.length === 0) {
    return null;
  }
  return option[0].text;
}

function getTimeStr(dateStr) {
  let date = new Date(dateStr);
  return date.toLocaleDateString('en-US')+' '+date.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
}

function getRoleName(roleID) {
  if(roles[`${roleID}`] !== undefined) {
    return roles[`${roleID}`].display_name;
  }
  return roleID;
}

function eventNameHelper(info) {
  if(info.view.type === 'listWeek' || info.view.type === 'list') {
    let deptName = info.event.extendedProps.department;
    if(deptName === undefined) {
      deptName = getDeptName(info.event.extendedProps.departmentID);
    }
    return {html: '<a href="'+info.event.url+'">'+deptName+': '+info.event.extendedProps.name+'</a>'};
  }
}

function eventRenderHelper(info) {
  var evnt = info.event;
  var shift = evnt.extendedProps;
  if(window.matchMedia('(hover: none)').matches === false) {
    var content = 'Department: '+getDeptName(shift.departmentID)+'<br/>Role: '+getRoleName(shift.roleID)+'<br/>Start: '+getTimeStr(shift.startTime)+'<br/>End: '+getTimeStr(shift.endTime);
    if(shift.overlap) {
      content += '<br/><b>You have a shift that overlaps this one!</b>';
    }
    if(shift.available) {
      $(info.el).popover({
        animation:true,
        delay: 300,
        title: shift.name,
        html: true,
        content: content,
        trigger: 'hover'
      });
    } else {
      if(shift.whyClass === 'TAKEN' && shift.volunteer !== undefined) {
        $(info.el).popover({
          animation:true,
          delay: 300,
          title: 'Shift Taken',
          content: 'Shift is taken by '+shift.volunteer,
          trigger: 'hover'
        });
      } else {
        $(info.el).popover({
          animation:true,
          delay: 300,
          title: 'Shift Unavailable',
          content: shift.why,
          trigger: 'hover'
        });
      }
    }
  }
}

function renderResource(info) {
  var resource = info.resource;
  if(resource.getParent() === null) {
    if(!validDepts.includes(resource.id)) {
      calendar.dispatch({type: 'SET_RESOURCE_ENTITY_EXPANDED', id: resource.id, isExpanded: false});
    }
    return;
  }
  var role = roles[resource.id];
  if(!validDepts.includes(role.departmentID)) {
    //console.log(resource);
  } else {
    $(info.el).popover({
      animation:true,
      delay: 300,
      title: role.display_name,
      content: role.description,
      trigger: 'hover',
      placement: 'bottom'
    });
  }
}

function eventShouldBeShown(shift, _validDepts, validShifts, role) {
  if(shift.enabled === false) {
    return false;
  }
  if(role !== null && shift.roleID !== role) {
    return false;
  }
  if(_validDepts.includes(shift.departmentID)) {
    if(shift.whyClass === 'MINE' && validShifts.includes('mine')) {
      return true;
    } else if(shift.available && validShifts.includes('unfilled') && !shift.overlap) {
      return true;
    } else if(shift.overlap && validShifts.includes('overlap') && shift.whyClass !== 'TAKEN') {
      return true;
    } else if(shift.why && validShifts.includes('unavailable') && shift.whyClass !== 'MINE' && shift.whyClass !== 'TAKEN') {
      return true;
    } else if(validShifts.includes('filled') && shift.whyClass === 'TAKEN') {
      return true;
    }
    return false;
  }
  return false;
}

function filterEvents() {
  var depts = $('#departments').select2('data');
  var shifts = $('#shiftTypes').select2('data');
  var validShifts = [];
  let role = getParameterByName('role');
  validDepts = [];
  for(let dept of depts) {
    validDepts.push(dept.id);
  }
  for(let shift of shifts) {
    validShifts.push(shift.id);
  }
  var events = allEvents;
  var newStart = new Date('2100-01-01T01:00:00');
  calendar.renderingPauseDepth = true;
  for(let event of events) {
    let valid = eventShouldBeShown(event.extendedProps, validDepts, validShifts, role);
    if(!valid && !event.classNames.includes('d-none')) {
      event.setProp('classNames', 'd-none');
    } else if(event.classNames.includes('d-none') && valid) {
      let myStart = event.start;
      if(myStart < newStart) {
        newStart = myStart;
      }
      event.setProp('classNames', '');
    } else if(valid) {
      let myStart = event.start;
      if(myStart < newStart) {
        newStart = myStart;
      }
    }
  }
  if(calendar.view === null || calendar.view.currentEnd < newStart) {
    calendar.gotoDate(newStart);
  }
  calendar.renderingPauseDepth = false;
  if(calendar.needsRerender) {
    calendar.render();
  }
}

function deptChanged() {
  let departments = $('#departments').select2('data');
  localStorage.setItem('Departments', departments.map(s=>s.id));
  filterEvents();
}

function shiftChanged() {
  let types = $('#shiftTypes').select2('data');
  localStorage.setItem('ShiftTypes', types.map(s=>s.id));
  filterEvents();
}

function retryShifts() {
  gotShifts(this);
}

function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to get shifts!');
    return;
  }
  allEvents = [];
  var events = calendar.getEvents();
  for(let event of events) {
    event.remove();
  }
  if($('#departments').data('select2') === null) {
    var boundRetry = retryShifts.bind(jqXHR);
    setTimeout(boundRetry, 100);
    return;
  }
  var depts = $('#departments').select2('data');
  if(depts.length === 0) {
    $('#departments').find("option[value='"+dept+"']").removeAttr('disabled');
    $('#departments').val(allDepts).trigger('change');
    depts = $('#departments').select2('data');
  }
  var deptHasShifts = {};
  for(let dept of depts) {
    deptHasShifts[dept.id] = false;
  }
  var shifts = jqXHR.responseJSON;
  if(shifts.length === 0) {
    add_notification($('#content'), 'This event does not have any shifts at this time. Check back later or contact your lead!');
  }
  start = new Date('2100-01-01T01:00:00');
  end = new Date('2000-01-01T01:00:00');
  for(let shift of shifts) {
    if(shift.enabled === false) {
      //Skip it!
      continue;
    }
    let myStart = new Date(shift.startTime);
    let myEnd = new Date(shift.endTime);
    if(myStart < start) {
      start = myStart;
    }
    if(myEnd > end) {
      end = myEnd;
    }
    let evnt = {
      id: shift['_id']['$oid'],
      start: myStart,
      end: myEnd
    };
    if(shift.overlap) {
      evnt.backgroundColor = 'gold';
      evnt.borderColor = 'gold';
    }
    if(!shift.available) {
      evnt.backgroundColor = 'lightGray';
      evnt.borderColor = 'lightGray';
      if(shift.whyClass === 'MINE') {
        evnt.backgroundColor = 'SpringGreen';
        evnt.borderColor = 'SpringGreen';
      }
    }
    if((shift.status === 'pending' || shift.status === 'groupPending') && shift.whyClass !== 'MINE') {
      evnt.backgroundColor = 'fireBrick';
      evnt.borderColor = 'lightGray';
    }
    if(shift.status === 'filled' && shift.whyClass !== 'MINE') {
      evnt.backgroundColor = 'fireBrick';
      evnt.borderColor = 'fireBrick';
    }
    if(shift.name === '') {
      shift.name = getRoleName(shift.roleID);
    }
    evnt.title = shift.name;
    evnt.url = 'signup.php?shiftID='+evnt.id;
    evnt.extendedProps = shift;
    let calEvent = calendar.addEvent(evnt);
    calEvent.setResources([shift.roleID]);
    allEvents.push(calEvent);
    deptHasShifts[shift.departmentID] = true;
  }
  calendar.gotoDate(start);
  try{
    calendar.render();
  } catch(error) {
    console.error(error);
    if(shifts.length > 0) {
      location.href = location.origin + location.pathname + '?event=' + shifts[0].eventID;
    }
  }
  if(window.innerWidth <= 1024) {
    $('#calendar .fc-center h2').css('font-size', '1.0em');
  }
  if(getParameterByName('department') === null) {
    let departmentData = localStorage.getItem('Departments');
    let departmentArray = [];
    if(departmentData !== null && departmentData !== '') {
      departmentArray = departmentData.split(',');
      $('#departments').val(departmentArray);
      addNonStandardViewAlert();
    }
    let deptsToInclude = [];
    for(var dept in deptHasShifts) {
      if(departmentArray.includes(dept)) {
        deptsToInclude.push(dept);
        continue;
      }
      if(deptHasShifts[`${dept}`] === false) {
        $('#departments').find("option[value='"+dept+"']").attr('disabled', true);
        continue;
      }
      deptsToInclude.push(dept);
    }
    $('#departments').val(deptsToInclude).trigger('change');
    $('#departments').change(deptChanged);
  }
  filterEvents();
}

function eventChanged(e) {
  var extra = '';
  if(calendar !== undefined && calendar.view !== null) {
    let defaultView = calendar.currentData.calendarOptions.initialView;
    let currentView = calendar.view.type;
    if(defaultView !== currentView) {
      extra = '&view='+currentView;
    }
  }
  var eventID = e.target.value;
  if(allEvents.length > 0) {
    //Calendar doesn't reinit well... reload the page
    location.href = location.origin + location.pathname + '?event=' + eventID + extra;
  }
  $.ajax({
    url: 'api/v1/events/'+eventID+'/shifts',
    complete: gotShifts
  });
}

function processEvents(events) {
  let anyHasShift = false;
  let noEventShifts = [];
  var data = [];
  var id = getParameterByName('event');
  events.sort(function(a, b) {
    var aDate = new Date(a.startTime);
    var bDate = new Date(b.startTime);
    return aDate.getTime() - bDate.getTime();
  });
  for(let event of events) {
    if(event.available) {
      let option = {id: event['_id']['$oid'], text: event.name};
      if(id !== null && (id === event['_id']['$oid'] || id === event.alias)) {
        option.selected = true;
      }
      if(event.hasShifts) {
        data.push(option);
        anyHasShift = true;
      } else {
        noEventShifts.push(option);
      }
    }
  }
  if(anyHasShift === false) {
    data = noEventShifts;
  }
  if(data.length === 0) {
    alert('All events are in the past!');
    return;
  }
  var sel2 = $('#event').select2({data: data});
  sel2.change(eventChanged);
  eventChanged({target: sel2[0]});
}

function processDepartments(depts) {
  var id = getParameterByName('department');
  var groups = {};
  for(let dept of depts) {
    if(!dept.available) {
      continue;
    }
    if(groups[dept.area] === undefined) {
      groups[dept.area] = [];
    }
    let tmp = {id: dept.departmentID, text: dept.departmentName, selected: true};
    if(id !== null && id !== tmp.id) {
      tmp.selected = false;
    } else {
      validDepts.push(dept.departmentID);
    }
    groups[dept.area].push(tmp);
    allDepts.push(dept);
  }
  var data = [];
  for(var group in groups) {
    //TODO Get Area's real name...
    data.push({text: group, children: groups[`${group}`]});
  }
  $('#departments').select2({data: data});
  $.ajax({
    url: 'api/v1/roles',
    complete: gotRoles
  });
}

function gotRoles(jqXHR) {
  if(jqXHR.status !== 200) {
    return;
  }
  var array = jqXHR.responseJSON;
  var deptsForResources = {};
  for(let role of array) {
    roles[role.short_name] = role;
    if(deptsForResources[role.departmentID] === undefined) {
      var deptName = getDeptName(role.departmentID);
      if(deptName === null) {
        continue;
      }
      deptsForResources[role.departmentID] = {id: role.departmentID, title: deptName, children: []};
    }
    deptsForResources[role.departmentID].children.push({id: role.short_name, title: role.display_name});
  }
  for(var key in deptsForResources) {
    calendar.addResource(deptsForResources[`${key}`], false);
  }
}

function unhideFilters() {
  var div = $('#departments').parent('.d-none');
  if(div.length > 0) {
    div.removeClass('d-none');
    $('[for=departments]').removeClass('d-none');
  } else {
    $('#departments').parent(':not(.d-none)').addClass('d-none');
    $('[for=departments]').addClass('d-none');
  }
}

function gotInitialData(results) {
  var eventResult = results.shift();
  var deptResult = results.shift();
  var obj = {};
  if(eventResult.status === 'rejected') {
    //User isn't logged in
    return;
  }
  obj.events = processEvents(eventResult.value);
  obj.depts = processDepartments(deptResult.value);
  var sel2 = $('#shiftTypes').select2();
  sel2.change(shiftChanged);
  let myTypes = localStorage.getItem('ShiftTypes');
  if(myTypes !== null) {
    let types = myTypes.split(',');
    sel2.val(types).trigger('change');
    addNonStandardViewAlert();
  }
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

function fakePromiseSettled(promises) {
  let values = Array.from(promises);
  return Promise.all(values.map(function (item) {
    var onFulfill = function (value) {
      return { status: 'fulfilled', value: value };
    };
    var onReject = function (reason) {
      return { status: 'rejected', reason: reason };
    };
    var itemPromise = Promise.resolve(item);
    try {
      return itemPromise.then(onFulfill, onReject);
    } catch (e) {
      return Promise.reject(e);
    }
  }));
}

function viewChanged(arg) {
  if(window.viewCalled === undefined) {
    //I want only the second call of this to do something...
    window.viewCalled = true;
    return [];
  }
  localStorage.setItem('CalendarView', arg.view.type);
}

function clearView() {
  localStorage.removeItem('CalendarView');
  localStorage.removeItem('Departments');
  localStorage.removeItem('ShiftTypes');
  location.reload();
}

function addNonStandardViewAlert() {
  if($('#nonStandardView').length !== 0) {
    return;
  }
  let alertDiv = $('<div/>', {'id': 'nonStandardView', 'class': 'alert alert-info alert-dismissible', role: 'alert'});
  let button = $('<button/>', {type: 'button', 'class': 'close', 'data-dismiss': 'alert'});
  $('<span/>', {'aria-hidden': 'true'}).html('&times;').appendTo(button);
  $('<span/>', {'class': 'sr-only'}).html('Close').appendTo(button);
  button.appendTo(alertDiv);
  alertDiv.append('<strong>Notice:</strong> You are seeing a non-default view of the volunteer system from the last time you viewed the site. To restore the default view click ');
  let link = $('<a/>', {'class': 'alert-link', 'href': '#'});
  link.append('here.').click(clearView);
  alertDiv.append(link);
  $('#content').prepend(alertDiv);
}

function initPage() {
  if(FullCalendar === undefined) {
    setTimeout(initPage, 100);
    return;
  }
  if(Intl.DateTimeFormat().resolvedOptions().timeZone !== 'America/Chicago') {
    $('#content').prepend('<div class="alert alert-primary" role="alert">Note all times are displayed in your local time zone! Make sure you do the appropriate math as Flipside operates in Central Daylight Time!</div>');
  }
  let promises = [];
  promises.push($.ajax({
    url: 'api/v1/events'
  }));
  promises.push($.ajax({
    url: 'api/v1/departments'
  }));
  promises.push(new Promise(waitForSelect2));
  if(Promise.allSettled !== undefined) {
    Promise.allSettled(promises).then(gotInitialData);
  } else {
    //Older browser...
    fakePromiseSettled(promises).then(gotInitialData);
  }
  var header = {
    left: 'prev,next',
    center: 'title',
    right: 'dayGridMonth,timeGridDay,listWeek,resourceTimelineDay'
  };
  var defaultView = 'resourceTimelineDay';
  if(window.innerWidth <= 1024) {
    header.left = 'prev,next';
    header.right = 'timeGridDay,listWeek,resourceTimelineDay';
    defaultView = 'list';
  }
  let myView = getParameterByName('view');
  if(myView === null) {
    myView = localStorage.getItem('CalendarView');
    if(myView !== null) {
      addNonStandardViewAlert();
    }
  }
  if(myView !== null) {
    defaultView = myView;
  }
  calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
    schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
    //plugins: [ 'dayGrid', 'timeGrid', 'list', 'resourceTimeline' ],
    headerToolbar: header,
    buttonText: {
      month: 'Month Grid',
      timeGridWeek: 'Week Grid',
      timeGridDay: 'Day Grid',
      listWeek: 'List',
      resourceTimelineDay: 'Timeline'
    },
    titleFormat: { // will produce something like "Tuesday, September 18, 2018"
      month: 'long',
      year: 'numeric',
      day: 'numeric',
      weekday: 'long'
    },
    initialView: defaultView,
    validRange: getDateRange,
    eventContent: eventNameHelper,
    eventDidMount: eventRenderHelper,
    resourceAreaColumns: [
      {
        labelText: 'Role',
        field: 'title'
      }
    ],
    resources: [],
    resourceLabelDidMount: renderResource,
    filterResourcesWithEvents: true,
    resourceOrder: 'title',
    viewClassNames: viewChanged
  });
}

$(() => {
  $('body').on('fvs:ready', function() {
    initPage();
  });
});
/* vim: set tabstop=2 shiftwidth=2 expandtab: */
