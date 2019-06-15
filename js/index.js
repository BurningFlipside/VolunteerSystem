var calendar;
var start;
var end;
var allEvents = [];
var roles = {};
var validDepts = [];

function getDateRange() {
  return {
    start: start,
    end: end
  };
}

function getDeptName(deptID) {
  var option = $('#departments option[value="'+deptID+'"]');
  if(option.length === 0) {
    return null;
  }
  return option[0].text;
}

function getTimeStr(date) {
  var date = new Date(date);
  return date.toLocaleDateString('en-US')+' '+date.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
}

function getRoleName(roleID) {
  if(roles[roleID] !== undefined) {
    return roles[roleID].display_name;
  }
  return roleID;
}

function eventRenderHelper(info) {
  var evnt = info.event;
  var shift = evnt.extendedProps;
  if(window.matchMedia('(hover: none)').matches === false) {
    if(shift.available) {
      $(info.el).popover({
        animation:true,
        delay: 300,
        title: shift.name,
        html: true,
        content: 'Department: '+getDeptName(shift.departmentID)+'<br/>Role: '+getRoleName(shift.roleID)+'<br/>Start: '+getTimeStr(shift.startTime)+'<br/>End: '+getTimeStr(shift.endTime),
        trigger: 'hover'
      });
    }
    else {
      $(info.el).popover({
        animation:true,
        delay: 300,
        title: 'Shift Unavailable',
        content: shift.why,
        trigger: 'hover'
      });
    }
  }
  if(info.view.type === 'listWeek' || info.view.type === 'list') {
    var anchor = $(info.el).find('.fc-list-item-title a')[0];
    anchor.innerHTML = getDeptName(shift.departmentID)+': '+anchor.innerHTML;
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
    console.log(resource);
  }
  else {
  }
}

function eventClick(info) {
  if(!info.event.extendedProps.available) {
    info.jsEvent.preventDefault();
  }
}

function filterEvents() {
  var depts = $('#departments').select2('data');
  validDepts = [];
  for(var i = 0; i < depts.length; i++) {
    validDepts.push(depts[i].id);
  }
  var events = allEvents;
  var newStart = new Date('2100-01-01T01:00:00');
  calendar.renderingPauseDepth = true;
  for(var i = 0; i < events.length; i++) {
    if(!validDepts.includes(events[i].extendedProps.departmentID) && !events[i].classNames.includes('d-none')) {
      events[i].setProp('classNames', 'd-none');
    }
    else if(events[i].classNames.includes('d-none') && validDepts.includes(events[i].extendedProps.departmentID)) {
      var myStart = events[i].start;
      if(myStart < newStart) {
        newStart = myStart;
      }
      events[i].setProp('classNames', '');
    }
    else if(validDepts.includes(events[i].extendedProps.departmentID)) {
      var myStart = events[i].start;
      var myEnd = events[i].end;
      if(myStart < newStart) {
        newStart = myStart;
      }
    }
  }
  if(calendar.view.currentEnd < newStart) {
    calendar.next();
  }
  calendar.renderingPauseDepth = false;
  calendar.render();
}

function deptChanged(e) {
  filterEvents();
}

function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to get shifts!');
    return;
  }
  allEvents = [];
  var shifts = jqXHR.responseJSON;
  start = new Date('2100-01-01T01:00:00');
  end = new Date('2000-01-01T01:00:00');
  for(var i = 0; i < shifts.length; i++) {
    var myStart = new Date(shifts[i]['startTime']);
    var myEnd = new Date(shifts[i]['endTime']);
    if(myStart < start) {
      start = myStart;
    }
    if(myEnd > end) {
      end = myEnd;
    }
    var evnt = {
      id: shifts[i]['_id']['$id'],
      start: myStart,
      end: myEnd
    };
    if(shifts[i]['groupID']) {
      //evnt.groupId = shifts[i]['groupID'];
    }
    if(!shifts[i].available) {
      evnt.backgroundColor = 'lightGray';
      evnt.borderColor = 'lightGray';
    }
    if(shifts[i].name === '') {
      shifts[i].name = getRoleName(shifts[i].roleID);
    }
    evnt.title = shifts[i].name;
    evnt.url = 'signup.php?shiftID='+evnt.id,
    evnt.extendedProps = shifts[i];
    var calEvent = calendar.addEvent(evnt);
    calEvent.setResources([shifts[i].roleID]);
    allEvents.push(calEvent);
  }
  calendar.setOption('validRange.start', myStart);
  calendar.render();
  if(window.innerWidth <= 1024) {
    $('#calendar .fc-center h2').css('font-size', '1.0em');
  }
  $('#departments').change(deptChanged);
}

function eventChanged(e) {
  var eventID = e.target.value;
  $.ajax({
    url: 'api/v1/events/'+eventID+'/shifts',
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
      data.push({id: events[i]['_id']['$id'], text: events[i]['name']});
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
  var groups = {};
  for(var i = 0; i < depts.length; i++) {
    if(!depts[i]['available']) {
      continue;
    }
    if(groups[depts[i]['area']] === undefined) {
      groups[depts[i]['area']] = [];
    }
    groups[depts[i]['area']].push({id: depts[i]['departmentID'], text: depts[i]['departmentName'], selected: true});
    validDepts.push(depts[i]['departmentID']);
  }
  var data = [];
  for(var group in groups) {
    //TODO Get Area's real name...
    data.push({text: group, children: groups[group]});
  }
  var boundRetry = retrySelect2.bind({id: '#departments', data: data});
  if($('#departments').select2 === undefined) {
    setTimeout(boundRetry, 100);
    return;
  }
  boundRetry();
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
  for(var i = 0; i < array.length; i++) {
    var role = array[i];
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
    calendar.addResource(deptsForResources[key], false);
  }
}

function unhideFilters() {
  var div = $('#departments').parent('.d-none');
  if(div.length > 0) {
    div.removeClass('d-none');
    $('[for=departments]').removeClass('d-none');
  }
  else {
    $('#departments').parent(':not(.d-none)').addClass('d-none');
    $('[for=departments]').addClass('d-none');
  }
}

function initPage() {
  $.ajax({
    url: 'api/v1/events',
    complete: gotEvents
  });
  $.ajax({
    url: 'api/v1/departments',
    complete: gotDepartments
  });
  var header = {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridDay,listWeek,resourceTimelineDay'
  };
  var defaultView = 'resourceTimelineDay';
  if(window.innerWidth <= 1024) {
    header.left = 'prev,next';
    header.right = 'timeGridDay,listWeek,resourceTimelineDay';
    defaultView = 'list';
  }
  calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
    schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
    plugins: [ 'dayGrid', 'timeGrid', 'list', 'resourceTimeline' ],
    header: header,
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
    defaultView: defaultView,
    validRange: getDateRange,
    eventRender: eventRenderHelper,
    eventClick: eventClick,
    resourceColumns: [
      {
        labelText: 'Role',
        field: 'title'
      }
    ],
    resources: [],
    resourceRender: renderResource,
    filterResourcesWithEvents: true
  });
}

$(() => {
  $('body').on('fvs:ready', function(e) {
    initPage();
  });
});
