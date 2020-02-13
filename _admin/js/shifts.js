var departments = {};
var events;

function doneCreatingShift(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to save shift!');
    console.log(jqXHR);
    return;
  }
  $('#newShift').modal('hide');
  location.reload();
}

function createShift(e) {
  var shift = e.data;
  if((shift.minShifts !== 0 && shift.minShifts !== '' && shift.minShifts !== null) && shift.unbounded) {
    e.data.copies = shift.minShifts;
    createCopies(e);
    return;
  }
  $.ajax({
    url: '../api/v1/departments/'+shift.departmentID+'/shifts',
    contentType: 'application/json',
    data: JSON.stringify(shift),
    type: 'POST',
    dataType: 'json',
    complete: doneCreatingShift
  });
}

function createCopies(e) {
  var shift = e.data;
  var copies = shift.copies;
  delete shift.copies;
  var promises = [];
  for(var i = 0; i < copies; i++) {
    promises.push($.ajax({
      url: '../api/v1/departments/'+shift.departmentID+'/shifts',
      contentType: 'application/json',
      data: JSON.stringify(shift),
      type: 'POST',
      dataType: 'json'
    }));
  }
  Promise.all(promises).then((values) => {
    $('#newShift').modal('hide');
    location.reload();
  }).catch(e => {
    console.log(e); 
    alert('One of more shift failed to save!'); 
    location.reload();
  });
}

function gotDepartmentRoles(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to obtain roles');
    console.log(jqXHR);
    return;
  }
  var options = this;
  var inputs = options.inputs;
  var array = jqXHR.responseJSON;
  for(var i = 0; i < inputs.length; i++) {
    if(inputs[i].id === 'roleID') {
      inputs[i].options = [];
      for(var j = 0; j < array.length; j++) {
        inputs[i].options.push({value: array[j].short_name, text: array[j].display_name});
      }
    }
  }
  flipDialog.dialog(options);
}

function gotGroupDepartmentRoles(jqXHR) {
  var mySelect = $('#groupAddRole');
  var array = jqXHR.responseJSON;
  for(var i = 0; i < array.length; i++) {
    var newOption = new Option(array[i].display_name, array[i].short_name, false, false);
    mySelect.append(newOption);
  }
}

function addNewShift(elem) {
  var href = elem.getAttribute("href");
  href = href.substring(1);
  var eventOptions = [];
  for(var i = 0; i < events.length; i++) {
    var eventOption = {value: events[i]['_id']['$oid'], text: events[i].name};
    eventOptions.push(eventOption);
    if(i === 0) {
      min = events[i].startTime;
      max = events[i].endTime;
    }
  }
  var dialogOptions = {
    title: 'New Shift',
    inputs: [
      {type: 'hidden', id: 'departmentID', value: href},
      {label: 'Department', type: 'text', readonly: true, id: 'department', value: departments[href].departmentName},
      {label: 'Event', type: 'select', id: 'eventID', options: eventOptions, onChange: setBoundaryTimes},
      {label: 'Role', type: 'select', id: 'roleID'},
      {label: 'Start Time', type: 'datetime-local', id: 'startTime', min: min, max: max, onChange: setMinEndTime, required: true},
      {label: 'End Time', type: 'datetime-local', id: 'endTime', min: min, max: max, required: true},
      {label: 'Enabled', type: 'checkbox', id: 'enabled'},
      {label: 'Requires Approval', type: 'checkbox', id: 'approvalNeeded'},
      {label: 'Unbounded', type: 'checkbox', id: 'unbounded', onChange: unboundedChanged},
      {label: 'Minimum Open Shifts', type: 'number', id: 'minShifts', disabled: true}, 
      {label: 'Shift Name', type: 'text', id: 'name'},
      {label: 'Entry/Late Stay Window', type: 'select', id: 'earlyLate', options: [
        {value: -2, text: 'Late Stay (Monday Evening)'},
        {value: -1, text: 'Regular Entry (Thursday Morning)', selected: true},
        {value: 0, text: 'Wednesday Afternoon (Theme Camp/Art) Early Entry'},
        {value: 1, text: 'Wednesday Morning Infrastructure Setup'},
        {value: 2, text: 'Tuesday Morning Infrastructure Setup'}
      ]}
    ],
    buttons: [
      {input: {type: 'number', id: 'copies', text: 'Copies'}, text: 'Create Copies', callback: createCopies}, 
      {text: 'Create Shift', callback: createShift}
    ]
  };
  $.ajax({
    url: '../api/v1/departments/'+href+'/roles',
    complete: gotDepartmentRoles,
    context: dialogOptions
  });
  return false;
}

function addRoleToShift() {
  var roleID = $('#groupAddRole').val();
  var roleText = $('#groupAddRole').find(':selected')[0].text;
  var tbody = $('#groupRoleTable tbody');
  tbody.append('<tr><td>'+roleText+'</td><td><input class="form-control" type="number" min="1" value="1" id="roles.'+roleID+'"</td><td><button type="button" class="btn btn-link" onClick="removeRole(\''+roleID+'\')"><i class="fas fa-minus-circle"></i></button></td></tr>');
  $("#groupAddRole option[value='"+roleID+"']").remove();
}

function removeRole(roleID) {
  var tbody = $('#groupRoleTable tbody');
  var input = tbody.find('[id="roles.'+roleID+'"]');
  var row = input.parents('tr');
  addOptiontoSelect($('#groupAddRole')[0], roleID, row.find('td').first()[0].innerHTML);
  row.remove();
}

function newGroup(data) {
  $.ajax({
    url: '../api/v1/shifts/Actions/NewGroup',
    contentType: 'application/json',
    data: JSON.stringify(data),
    type: 'POST',
    dataType: 'json',
    complete: doneCreatingShift
  });
  $('#groupWizard').modal('hide');
}

function addNewGroup(elem) {
  var href = elem.getAttribute("href");
  href = href.substring(1);
  $('#groupDepartmentID').val(href);
  $('#groupDepartmentName').val(departments[href].departmentName);
  var mySelect = $('#groupEvent')[0];
  for(var i = 0; i < events.length; i++) {
    addOptiontoSelect(mySelect, events[i]['_id']['$oid'], events[i].name);
  }
  if(!browser_supports_input_type('datetime-local')) {
    $('[type="datetime-local"]').flatpickr({enableTime: true});
  }
  groupEventChanged(mySelect);
  $.ajax({
    url: '../api/v1/departments/'+href+'/roles',
    complete: gotGroupDepartmentRoles
  });
  $('#groupWizard').modal('show');
}

function groupEventChanged(elem) {
  var eventID = elem.value;
  for(var i = 0; i < events.length; i++) {
    if(events[i]['_id']['$oid'] === eventID) {
      myevent = events[i];
      break;
    }
  }
  if($('#groupStartTime')[0]._flatpickr !== undefined) {
    var start = $('#groupStartTime')[0]._flatpickr;
    var end = $('#groupEndTime')[0]._flatpickr;
    start.set('minDate', myevent.startTime);
    start.set('maxDate', myevent.endTime);
    end.set('minDate', myevent.startTime);
    end.set('maxDate', myevent.endTime);
    return;
  }
  $('#groupStartTime').attr('min', myevent.startTime);
  $('#groupStartTime').attr('max', myevent.endTime);
  $('#groupEndTime').attr('min', myevent.startTime);
  $('#groupEndTime').attr('max', myevent.endTime);
}

function shiftDeleted(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to delete shift!');
    return;
  }
  location.reload();
}

function deleteShift(e) {
  var msg = "Are you sure you want to delete this shift?";
  if(e.data.shifts !== undefined) {
    msg = "Are you sure you want to delete all "+e.data.shifts.length+" shifts in this set?";
  }
  bootbox.confirm({
    message: msg,
    buttons: {
      confirm: {
        label: 'Yes'
      },
      cancel: {
        label: 'No'
      }
    },
    callback: function(result){
      if(result) {
        if(e.data.shifts !== undefined) {
          var obj = { 'groupID': e.data.groupID };
          $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(obj),
            dataType: 'json',
            url: '../api/v1/shifts/Actions/DeleteGroup',
            method: 'POST',
            complete: shiftDeleted
          });
        }
        else {
          $.ajax({
            url: '../api/v1/shifts/'+e.data['_id']['$oid'],
            method: 'DELETE',
            complete: shiftDeleted
          });
        }
      }
    }
  });
}

function shiftEmptied(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to empty shift!');
    return;
  }
  location.reload();
}

function emptyShift(e) {
  bootbox.dialog({
    message: 'Are you sure you want to empty this shift?',
    buttons: {
      yes: {
        label: 'Yes and Inform Participant',
        className: 'btn-primary',
        callback: function() {
          $.ajax({
            url: '../api/v1/shifts/'+e.data['_id']['$oid']+'/Actions/EmptyShift',
            method: 'POST',
            complete: shiftEmptied
          });
        }
      },
      force: {
        label: 'Yes and <b>DO NOT</b> Inform Participant',
        className: 'btn-danger',
        callback: function() {
          $.ajax({
            url: '../api/v1/shifts/'+e.data['_id']['$oid']+'/Actions/ForceShiftEmpty',
            method: 'POST',
            complete: shiftEmptied
          });
        }
      }, 
      cancel: {
        label: 'No',
        className: 'btn-secondary'
      }
    }
  });
}

function shiftEditDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to save shift');
    return;
  }
  location.reload();
}

function removeOwnEvent(element) {
  if(this.shifts) {
    return (element.groupID !== this.groupID);
  }
  return (element['_id']['$oid'] !== this['_id']['$oid']);
}

function filterSinglesAndGroups(element) {
  if(element.groupID === undefined) {
    return true;
  }
  else {
    if(this[element.groupID] === undefined) {
      this[element.groupID] = [];
    }
    this[element.groupID].push(element);
    return false;
  }
}

function keepGroupsOnly(element) {
  return (element.groupID !== undefined);
}

function removeElementsNotInOtherArray(element) {
  return !this.includes(element);
}

function getGroupName(group) {
  if(group[0].name !== undefined && group[0].name !== '') {
    return group[0].name;
  }
  var start = new Date(group[0].startTime);
  var end = new Date(group[0].endTime);
  return 'Shift Set: '+start+' to '+end;
}

function groupDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to group shift');
    return;
  }
  location.reload();
}

function gotShiftstoReplaceGroupIDs(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to get shifts for target set!');
    return;
  }
  var array = jqXHR.responseJSON;
  var promises = [];
  for(var i = 0; i < array.length; i++) {
    var data = array[i];
    data.groupID = this;
    promises.push($.ajax({
      url: '../api/v1/shifts/'+array[i]['_id']['$oid'],
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify(data)
    }));
  }
  Promise.all(promises).then((values) => {
    location.reload();
  }).catch(e => {
    console.log(e);
    alert('One of more shift failed to save!');
    location.reload();
  });
}

function replaceGroupID(newGroupID, oldGroupID) {
  $.ajax({
    url: '../api/v1/shifts?$filter=groupID eq '+oldGroupID,
    complete: gotShiftstoReplaceGroupIDs,
    context: newGroupID
  });
}

function doGroup(e) {
  var data = e.data;
  if(data.shifts !== undefined) {
    var obj = {groupID: data['oldGroupID']};
    $.ajax({
      url: '../api/v1/shifts/'+data['shiftID'],
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify(obj),
      complete: groupDone
    });
  }
  else if(data.group === 'single') {
    //Create a new group...
    var array = [];
    array.push(data.shiftID);
    array.push(data['_id']['$oid']);
    $.ajax({
      url: '../api/v1/shifts/Actions/CreateGroup',
      data: JSON.stringify(array),
      method: 'POST',
      contentType: 'application/json',
      complete: groupDone
    });
    return;
  }
  else {
    if(data.oldGroupID !== undefined) {
      replaceGroupID(data.oldGroupID, data.groupID);
      return;
    }
    delete data.group;
    delete data.shiftID;
    $.ajax({
      url: '../api/v1/shifts/'+data['_id']['$oid'],
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify(data),
      complete: groupDone
    });
  }
}

function groupTypeChange(e) {
  if(e.target.value === 'single') {
    $('#shiftID').removeAttr('disabled');
    $('#groupID').attr('disabled', true);
  }
  else {
    $('#groupID').removeAttr('disabled');
    $('#shiftID').attr('disabled', true);
  }
}

function gotShiftsToGroup(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to get similar shifts!');
    return;
  }
  var array = jqXHR.responseJSON;
  var array = array.filter(removeOwnEvent, this);
  var groups =  {};
  var singles = array.filter(filterSinglesAndGroups, groups);
  var groupCount = Object.keys(groups).length;
  if(groupCount === 0 && singles.length === 0) {
    bootbox.alert("No shifts for this department have the same start and end times as the indicated shift!");
    return;
  }
  var groupOptions = {label: 'Existing Set', type: 'radio', id: 'group', value: 'group', onChange: groupTypeChange};
  var groupSelect = {label: 'Sets', type: 'select', id: 'groupID'};
  if(groupCount === 0) {
    groupOptions.disabled = true;
    groupSelect.disabled = true;
  }
  else {
    groupOptions.checked = true;
    groupSelect.options = [];
    for(var groupID in groups) {
      var groupName = getGroupName(groups[groupID]);
      groupSelect.options.push({value: groupID, text: groupName});
    }
  }
  var singleOptions = {label: 'Other Shift', type: 'radio', id: 'group', value: 'single', onChange: groupTypeChange};
  var singleSelect = {label: 'Shifts', type: 'select', id: 'shiftID'};
  if(singles.length === 0) {
    singleOptions.disabled = true;
    singleSelect.disabled = true;
  }
  else {
    if(groupCount === 0) {
      singleOptions.checked = true;
    }
    else {
      singleSelect.disabled = true;
    }
    singleSelect.options = [];
    for(var i = 0; i < singles.length; i++) {
      if(singles[i].name !== undefined && singles[i].name.length > 0) {
        shiftName = singles[i].name+': '+singles[i].roleID;
      }
      else {
        var start = new Date(singles[i].startTime);
        var end = new Date(singles[i].endTime);
        shiftName = singles[i].roleID+': '+start+' to '+end;
      }
      singleSelect.options.push({value: singles[i]['_id']['$oid'], text: shiftName});
    }
  }
  if(this.shifts !== undefined) {
    this.oldGroupID = this.groupID;
    delete this.groupID;
  }
  var dialogOptions = {
    title: 'Add to Shift Set',
    data: this,
    inputs: [
      groupOptions,
      groupSelect,
      singleOptions,
      singleSelect
    ],
    buttons: [
      {text: 'Add to Shift Set', callback: doGroup}
    ]
  };
  flipDialog.dialog(dialogOptions);
}

function groupShift(e) {
  $.ajax({
    url: '../api/v1/shifts?$filter=departmentID eq '+e.data.departmentID+' and startTime eq '+e.data.startTime+' and endTime eq '+e.data.endTime,
    complete: gotShiftsToGroup,
    context: e.data
  });
}

function saveShift(e) {
  var shift = e.data;
  $.ajax({
    url: '../api/v1/shifts/'+shift['_id']['$oid'],
    method: 'PATCH',
    contentType: 'application/json',
    data: JSON.stringify(shift),
    complete: shiftEditDone
  });
}

function isEquivalent(a, b) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);
    
    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
      return false;
    }

    for (var i = 0; i < aProps.length; i++) {
      var propName = aProps[i];
    
      // If values of same property are not equal,
      // objects are not equivalent
      if (a[propName] !== b[propName]) {
        return false;
      }
    }
    
    // If we made it this far, objects
    // are considered equivalent
    return true;
}

function saveGroup(e) {
  var shifts = e.data.shifts;
  var roles = {};
  for(var i = 0; i < shifts.length; i++) {
    shifts[i].department = e.data.department;
    shifts[i].departmentID = e.data.departmentID;
    shifts[i].earlyLate = e.data.earlyLate;
    shifts[i].enabled = e.data.enabled;
    shifts[i].approvalNeeded = e.data.approvalNeeded;
    shifts[i].endTime = e.data.endTime;
    shifts[i].name = e.data.name;
    shifts[i].startTime = e.data.startTime;
    shifts[i].eventID = e.data.eventID;
    shifts[i].unbounded = e.data.unbounded;
    shifts[i].minShifts = e.data.minShifts;
    if(roles[shifts[i].roleID] === undefined) {
      roles[shifts[i].roleID] = 0;
    }
    roles[shifts[i].roleID]++;
  }
  delete e.data.department;
  delete e.data.departmentID;
  delete e.data.earlyLate;
  delete e.data.enabled;
  delete e.data.approvalNeeded;
  delete e.data.endTime;
  delete e.data.groupID;
  delete e.data.name;
  delete e.data.startTime;
  delete e.data.eventID;
  delete e.data.shifts;
  delete e.data.unbounded;
  delete e.data.minShifts;
  for(var role in e.data) {
    e.data[role] = e.data[role]*1;
  }
  if(!isEquivalent(e.data, roles)) {
    //TODO Create more copies of the role...
    for(var role in roles) {
      e.data[role] = e.data[role] - roles[role];
      if(e.data[role] === 0) {
        delete e.data[role];
      }
      if(e.data[role] > 0) {
        while(e.data[role] > 0) {
          var newShift = Object.assign({}, shifts[0]);
          newShift.roleID = role;
          shifts.push(newShift);
          e.data[role]--;
        }
      }
      else{
        while(e.data[role] < 0) {
          for(var i = 0; i < shifts.length; i++) {
            if(shifts[i].roleID === role) {
              shifts[i].DELETE = true;
              e.data[role]++;
              break;
            }
          }
        }
      }
    }
  }
  var promises = [];
  for(var i = 0; i < shifts.length; i++) {
    if(shifts[i]['_id'] !== undefined && shifts[i].DELETE !== true) {
      promises.push($.ajax({
        url: '../api/v1/shifts/'+shifts[i]['_id']['$oid'],
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify(shifts[i])
      }));
    }
    else if(shifts[i].DELETE === true) {
      promises.push($.ajax({
        url: '../api/v1/shifts/'+shifts[i]['_id']['$oid'],
        method: 'DELETE',
        contentType: 'application/json'
      }));
    }
    else {
      promises.push($.ajax({
        url: '../api/v1/shifts/',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(shifts[i])
      }));
    }
  }
  Promise.all(promises).then((values) => {
    location.reload();
  }).catch(e => {
    console.log(e);
    alert('One of more shift failed to save!');
    location.reload();
  });
}

function getDepartmentName(departmentID) {
  if(departments[departmentID] !== undefined) {
    return departments[departmentID].departmentName
  }
  else {
    return departmentID;
  }
}

function retryEvents() {
  if(events === undefined) {
    setTimeout(retryEvents, 100);
    return;
  }
  var eventdd = $('#eventID');
  for(var i = 0; i < events.length; i++) {
    eventdd.append($('<option value="'+events[i]['_id']['$oid']+'">'+events[i].name+'</option>'));
  }
}

function gotShiftToEdit(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to obtain shift!');
    return;
  }
  var shift = jqXHR.responseJSON;
  var eventOptions = [];
  if(events === undefined) {
    setTimeout(retryEvents, 100);
    myevent = {};
    myevent.startTime = new Date();
    myevent.endTime = new Date(8640000000000000);
  }
  else {
    for(var i = 0; i < events.length; i++) {
      var eventOption = {value: events[i]['_id']['$oid'], text: events[i].name};
      if(shift.eventID === events[i]['_id']['$oid']) {
        eventOption.selected = true;
        myevent = events[i];
      }
      eventOptions.push(eventOption);
    }
  }
  var groupable = true;
  if(shift.groupID !== undefined && shift.groupID.length > 0) {
    groupable = false;
  }
  var dialogOptions = {
    title: 'Edit Shift',
    data: shift,
    inputs: [
      {type: 'hidden', id: 'departmentID'},
      {label: 'Department', type: 'text', readonly: true, id: 'department', value: getDepartmentName(shift.departmentID)},
      {label: 'Event', type: 'select', id: 'eventID', options: eventOptions, onChange: setBoundaryTimes},
      {label: 'Role', type: 'select', id: 'roleID'},
      {label: 'Start Time', type: 'datetime-local', id: 'startTime', min: myevent.startTime, max: myevent.endTime, onChange: setMinEndTime, required: true},
      {label: 'End Time', type: 'datetime-local', id: 'endTime', min: myevent.startTime, max: myevent.endTime, required: true},
      {label: 'Enabled', type: 'checkbox', id: 'enabled'},
      {label: 'Requires Approval', type: 'checkbox', id: 'approvalNeeded'},
      {label: 'Unbounded', type: 'checkbox', id: 'unbounded', onChange: unboundedChanged},
      {label: 'Minimum Open Shifts', type: 'number', id: 'minShifts', disabled: !shift.unbounded},
      {label: 'Shift Name', type: 'text', id: 'name'},
      {label: 'Entry/Late Stay Window', type: 'select', id: 'earlyLate', options: [
        {value: -2, text: 'Late Stay (Monday Evening)'},
        {value: -1, text: 'Regular Entry (Thursday Morning)', selected: true},
        {value: 0, text: 'Wednesday Afternoon (Theme Camp/Art) Early Entry'},
        {value: 1, text: 'Wednesday Morning Infrastructure Setup'},
        {value: 2, text: 'Tuesday Morning Infrastructure Setup'}
      ]}
    ],
    buttons: [
      {text: 'Delete Shift', callback: deleteShift},
      {text: 'Add to Shift Set', callback: groupShift, disabled: !groupable},
      {text: 'Save Shift', callback: saveShift}
    ]
  };
  if(shift.status === 'filled' || shift.status === 'pending') {
    dialogOptions.alerts = [
      {type: 'warning', text: 'Shift is already filled!'}
    ];
    dialogOptions.inputs.push({label: 'Participant', type: 'text', id: 'participant', value: shift.participant, disabled: true});
    dialogOptions.buttons.push({text: 'Empty Shift', callback: emptyShift});
  }
  $.ajax({
    url: '../api/v1/departments/'+shift.departmentID+'/roles',
    complete: gotDepartmentRoles,
    context: dialogOptions
  });
}

function gotGroupToEdit(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to obtain shifts for set!');
    return;
  }
  var shifts = jqXHR.responseJSON;
  var eventOptions = [];
  for(var i = 0; i < events.length; i++) {
    var eventOption = {value: events[i]['_id']['$oid'], text: events[i].name};
    if(shifts[0].eventID === events[i]['_id']['$oid']) {
      eventOption.selected = true;
      myevent = events[i];
    }
    eventOptions.push(eventOption);
  }
  var group = {shifts: shifts};
  var roleText = '';
  var roles = {};
  var taken = false;
  for(var i = 0; i < shifts.length; i++) {
    if(roles[shifts[i].roleID] === undefined) {
      roles[shifts[i].roleID] = 0;
    }
    roles[shifts[i].roleID]++;
    if(shifts[i].status === 'filled' || shifts[i].status === 'pending') {
      taken = true;
    }
  }
  for(var role in roles) {
    roleText+='<div class="input-group"><input type="number" class="form-control" id="'+role+'" name="'+role+'" value="'+roles[role]+'"/><div class="input-group-append"><span class="input-group-text" id="basic-addon2">'+role+'</span></div></div>';
  }
  var dialogOptions = {
    title: 'Edit Shift Set',
    data: group,
    inputs: [
      {type: 'hidden', id: 'departmentID', value: shifts[0].departmentID},
      {type: 'hidden', id: 'groupID', value: shifts[0].groupID},
      {label: 'Department', type: 'text', readonly: true, id: 'department', value: departments[shifts[0].departmentID].departmentName},
      {label: 'Event', type: 'select', id: 'eventID', options: eventOptions, onChange: setBoundaryTimes, value: shifts[0].eventID},
      {label: 'Roles', type: 'html', text: roleText},
      {label: 'Start Time', type: 'datetime-local', id: 'startTime', min: myevent.startTime, max: myevent.endTime, onChange: setMinEndTime, required: true, value: shifts[0].startTime},
      {label: 'End Time', type: 'datetime-local', id: 'endTime', min: myevent.startTime, max: myevent.endTime, required: true, value: shifts[0].endTime},
      {label: 'Enabled', type: 'checkbox', id: 'enabled', checked: shifts[0].enabled},
      {label: 'Requires Approval', type: 'checkbox', id: 'approvalNeeded', checked: shifts[0].approvalNeeded},
      {label: 'Unbounded', type: 'checkbox', id: 'unbounded', onChange: unboundedChanged},
      {label: 'Minimum Open Shifts', type: 'number', id: 'minShifts', disabled: !shifts[0].unbounded},
      {label: 'Shift Name', type: 'text', id: 'name', value: shifts[0].name},
      {label: 'Entry/Late Stay Window', type: 'select', id: 'earlyLate', options: [
        {value: -2, text: 'Late Stay (Monday Evening)', selected: (shifts[0].earlyLate === '-2')},
        {value: -1, text: 'Regular Entry (Thursday Morning)', selected: (shifts[0].earlyLate === '-1')},
        {value: 0, text: 'Wednesday Afternoon (Theme Camp/Art) Early Entry', selected: (shifts[0].earlyLate === '0')},
        {value: 1, text: 'Wednesday Morning Infrastructure Setup', selected: (shifts[0].earlyLate === '1')},
        {value: 2, text: 'Tuesday Morning Infrastructure Setup', selected: (shifts[0].earlyLate === '2')}
      ]}
    ],
    buttons: [
      {text: 'Delete Shift Set', callback: deleteShift},
      {text: 'Add Shift/Merge Set', callback: groupShift},
      {text: 'Save Shift Set', callback: saveGroup}
    ]
  };
  if(taken) {
    dialogOptions.alerts = [
      {type: 'warning', text: 'One or more shift in the set is already filled!'}
    ];
  }
  flipDialog.dialog(dialogOptions);
}

function editShift(elem) {
  var href = elem.getAttribute("href");
  href = href.substring(1);
  $.ajax({
    url: '../api/v1/shifts/'+href,
    complete: gotShiftToEdit
  });
  return false;
}

function editGroup(elem) {
  var href = elem.getAttribute("href");
  href = href.substring(1);
  $.ajax({
    url: '../api/v1/shifts?$filter=groupID eq '+href,
    complete: gotGroupToEdit
  });
  return false;
}

function sortEvents(a, b) {
  return a.startTime.localeCompare(b.startTime);
}

function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to obtain shifts');
    console.log(jqXHR);
    return;
  }
  var array = jqXHR.responseJSON;
  var groups =  {};
  array.sort(function(a, b){
    var aDate = new Date(a.startTime);
    var bDate = new Date(b.startTime);
    return aDate.getTime() - bDate.getTime();
  });
  var singles = array.filter(filterSinglesAndGroups, groups);
  for(var groupID in groups) {
    var group = groups[groupID];
    var groupName = getGroupName(group);
    var filledCount = 0;
    var pendingCount = 0;
    var emptyCount = 0;
    for(var i = 0; i < group.length; i++) {
      if(group[i].status === 'filled') {
        filledCount++;
      }
      else if(group[i].status === 'pending') {
        pendingCount++;
      }
      else {
        emptyCount++;
      }
    }
    var badge = '';
    if(filledCount > 0) {
      badge += '<span class="badge badge-warning">Filled <span class="badge badge-light">'+filledCount+'</span></span>';
    }
    if(pendingCount > 0) {
      badge += '<span class="badge badge-info">Pending <span class="badge badge-light">'+pendingCount+'</span></span>';
    }
    if((filledCount > 0 || pendingCount > 0) && emptyCount != 0) {
      badge += '<span class="badge badge-secondary">Empty <span class="badge badge-light">'+emptyCount+'</span></span>';
    }
    $('#'+group[0].departmentID+'List').append('<a href="#'+groupID+'" class="list-group-item list-group-item-action shift" onclick="return editGroup(this);"><i class="fas fa-object-group"></i> '+groupName+' '+badge+'</a>');
  }
  singles.sort(sortEvents);
  for(var i = 0; i < singles.length; i++) {
    if(singles[i].name !== undefined && singles[i].name.length > 0) {
      shiftName = singles[i].name+': '+singles[i].roleID;
    }
    else {
      var start = new Date(singles[i].startTime);
      var end = new Date(singles[i].endTime);
      shiftName = singles[i].roleID+': '+start+' to '+end;
    }
    var badge = '';
    if(singles[i].status === 'filled') {
      badge = '<span class="badge badge-warning">Filled</span>';
    }
    else if(singles[i].status === 'pending') {
      badge = '<span class="badge badge-info">Pending</span>';
    }
    $('#'+singles[i].departmentID+'List').append('<a href="#'+singles[i]['_id']['$oid']+'" class="list-group-item list-group-item-action shift" onclick="return editShift(this);">'+shiftName+' '+badge+'</a>');
  }
  if(getParameterByName('hideEmpty') !== null) {
    $('.card:not(:has(.shift))').hide();
  }
}

function processEvents(events) {
  events.sort(function(a, b){
    var aDate = new Date(a.startTime);
    var bDate = new Date(b.startTime);
    return aDate.getTime() - bDate.getTime();
  });
  var ef = $('#eventFilter');
  for(var i = 0; i < events.length; i++) {
    var option = $('<option value="'+events[i]['_id']['$oid']+'">'+events[i].name+'</option>');
    ef.append(option);
  }
  var faveEvent = localStorage.getItem('adminEvent');
  if(faveEvent !== null) {
    ef.val(faveEvent);
  }
  return events;
}

function processDepartments(array) {
  array.sort(function(a, b) {
    return a.departmentName.localeCompare(b.departmentName);
  });
  array = array.filter(function(elem) {
    return elem.isAdmin;
  });
  var count = 0;
  var accordian = $('#accordion');
  for(var i = 0; i < array.length; i++) {
    count++;
    departments[array[i].departmentID] = array[i];
    accordian.append('<div class="card"><div class="card-header" id="heading'+array[i].departmentID+'"><h2 class="mb-0"><button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse'+array[i].departmentID+'" aria-expanded="true" aria-controls="collapse'+array[i].departmentID+'">'+array[i].departmentName+'</button></h2></div><div id="collapse'+array[i].departmentID+'" class="collapse show" aria-labelledby="heading'+array[i].departmentID+'" data-parent="#accordion"><div class="card-body"><div class="list-group" id="'+array[i].departmentID+'List"><a href="#'+array[i].departmentID+'" class="list-group-item list-group-item-action" onclick="return addNewShift(this);"><i class="fas fa-plus"></i> Add new shift</a><a href="#'+array[i].departmentID+'" class="list-group-item list-group-item-action" onclick="return addNewGroup(this);"><i class="far fa-plus-square"></i> Add new shift set</a></div></div></div></div>');
  }
  var eventID = getParameterByName('event');
  if(eventID === null) {
    let tmp = $('#eventFilter').val();
    if(tmp !== '') {
      eventID = tmp;
    }
  }
  var filled = getParameterByName('filled');
  var uri = '../api/v1/shifts';
  if(eventID !== null && filled !== null) {
    uri += '?$filter=eventID eq '+eventID+' and status ';
    if(filled === '1') {
      uri += 'eq filled';
    }
    else if(filled === '2') {
      uri += 'eq pending';
    }
    else {
      uri += 'ne filled and status ne pending';
    }
  }
  else if(eventID !== null) {
    uri += '?$filter=eventID eq '+eventID;
  }
  $.ajax({
    url: uri,
    complete: gotShifts
  });
  if(window.location.hash !== '') {
    accordian.find(':not(#collapse'+window.location.hash.substr(1)+')').removeClass('show');
  }
  else if (count > 2) {
    accordian.find('.show').removeClass('show');
  }
}

function gotInitialData(results) {
  var eventResult = results.shift();
  var deptResult = results.shift();
  var obj = {};
  events = obj.events = processEvents(eventResult.value);
  obj.depts = processDepartments(deptResult.value);
}

function setMinEndTime(e) {
  $('#endTime').attr('min', e.target.value);
}

function setBoundaryTimes(e) {
  var id = e.target.value;
  for(var i = 0; i < events.length; i++) {
    if(events[i]['_id']['$oid'] === id) {
      myevent = events[i];
      break;
    }
  }
  $('#startTime').attr('min', myevent.startTime);
  $('#startTime').attr('max', myevent.endTime);
  $('#endTime').attr('min', myevent.startTime);
  $('#endTime').attr('max', myevent.endTime);
  if(document.querySelector("#startTime")._flatpickr !== undefined) {
    fp = document.querySelector("#startTime")._flatpickr;
    fp.set('minDate', myevent.startTime);
    fp.set('maxDate', myevent.endTime);
    fp.clear();
    fp.changeMonth(-12);
    fp.changeMonth(12);
    fp.jumpToDate();
    fp.redraw();
    fp = document.querySelector("#endTime")._flatpickr;
    fp.set('minDate', myevent.startTime);
    fp.set('maxDate', myevent.endTime);
    fp.clear();
    fp.changeMonth(-12);
    fp.changeMonth(12);
    fp.jumpToDate();
    fp.redraw();
  }
}

function unboundedChanged(e) {
  if(e.target.checked) {
    $('#minShifts').removeAttr('disabled');
  }
  else {
    $('#minShifts').attr('disabled', true);
  }
}

function efChanged(e) {
  $('.shift').remove();
  if(e.target.value === '') {
    $.ajax({
      url: '../api/v1/shifts',
      complete: gotShifts
    });
  }
  else {
    $.ajax({
      url: '../api/v1/shifts?$filter=eventID eq '+e.target.value,
      complete: gotShifts
    });
  }
}

function initPage() {
  var promises = [];
  promises.push($.ajax({
    url: '../api/v1/events'
  }));
  promises.push($.ajax({
    url: '../api/v1/departments'
  }));
  Promise.allSettled(promises).then(gotInitialData);
  $('#startTime').change(setMinEndTime);
  $('#eventID').change(setBoundaryTimes);
  var shiftID = getParameterByName('shiftID');
  var groupID = getParameterByName('groupID');
  if(shiftID !== null) {
    $.ajax({
      url: '../api/v1/shifts/'+shiftID,
      complete: gotShiftToEdit
    });
  }
  else if(groupID !== null) {
    $.ajax({
      url: '../api/v1/shifts?$filter=groupID eq '+groupID,
      complete: gotGroupToEdit
    });
  }
  $('#eventFilter').change(efChanged);
}

$(initPage);
