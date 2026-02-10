/*global $, bootbox, flipDialog, getParameterByName, browser_supports_input_type, addOptiontoSelect*/
/* exported addNewGroup, addNewShift, addRoleToShift, editGroup, editShift, newGroup, removeRole */
var departments = {};
var events;
var roles;

function getRoleName(roleID) {
  if(roles === undefined) {
    return roleID;
  }
  if(roles[`${roleID}`] === undefined) {
    return roleID;
  }
  return roles[`${roleID}`].display_name;
}

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

function createCopies(event) {
  var shift = event.data;
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
  Promise.all(promises).then(() => {
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
  if(array.length === 0) {
    alert('Department has no roles. Please create at least one role before attempting to create a shift!');
    return;
  }
  for(let input of inputs) {
    if(input.id === 'roleID') {
      input.options = [];
      for(let role of array) {
        if(role.retired) {
          continue;
        }
        input.options.push({value: role.short_name, text: role.display_name});
      }
    }
  }
  flipDialog.dialog(options);
}

function gotGroupDepartmentRoles(jqXHR) {
  var mySelect = $('#groupAddRole');
  var array = jqXHR.responseJSON;
  if(array.length === 0) {
    alert('Department has no roles. Please create at least one role before attempting to create a shift!');
    return;
  }
  for(let role of array) {
    var newOption = new Option(role.display_name, role.short_name, false, false);
    mySelect.append(newOption);
  }
  $('#groupWizard').modal('show');
}

function addNewShift(elem) {
  var href = elem.getAttribute('href');
  href = href.substring(1);
  var eventOptions = [];
  let min = '2000-01-01T01:00:00-05:00';
  let max = '2100-01-01T01:00:00-05:00';
  for(let event of events) {
    let eventOption = {value: event['_id']['$oid'], text: event.name};
    eventOptions.push(eventOption);
    if(min !== '2000-01-01T01:00:00-05:00') {
      min = event.startTime;
      max = event.endTime;
    }
  }
  var dialogOptions = {
    title: 'New Shift',
    inputs: [
      {type: 'hidden', id: 'departmentID', value: href},
      {label: 'Department', type: 'text', readonly: true, id: 'department', value: departments[`${href}`].departmentName},
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
  var href = elem.getAttribute('href');
  href = href.substring(1);
  $('#groupDepartmentID').val(href);
  $('#groupDepartmentName').val(departments[`${href}`].departmentName);
  var mySelect = $('#groupEvent')[0];
  for(let event of events) {
    addOptiontoSelect(mySelect, event['_id']['$oid'], event.name);
  }
  if(!browser_supports_input_type('datetime-local')) {
    $('[type="datetime-local"]').flatpickr({enableTime: true});
  }
  groupEventChanged(mySelect);
  $.ajax({
    url: '../api/v1/departments/'+href+'/roles',
    complete: gotGroupDepartmentRoles
  });
}

function groupEventChanged(elem) {
  var eventID = elem.value;
  let myEvent = {};
  for(let event of events) {
    if(event['_id']['$oid'] === eventID) {
      myEvent = event;
      break;
    }
  }
  if($('#groupStartTime')[0]._flatpickr !== undefined) {
    var start = $('#groupStartTime')[0]._flatpickr;
    var end = $('#groupEndTime')[0]._flatpickr;
    start.set('minDate', myEvent.startTime);
    start.set('maxDate', myEvent.endTime);
    end.set('minDate', myEvent.startTime);
    end.set('maxDate', myEvent.endTime);
    return;
  }
  $('#groupStartTime').attr('min', myEvent.startTime);
  $('#groupStartTime').attr('max', myEvent.endTime);
  $('#groupEndTime').attr('min', myEvent.startTime);
  $('#groupEndTime').attr('max', myEvent.endTime);
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
  var msg = 'Are you sure you want to delete this shift?';
  if(e.data.shifts !== undefined) {
    msg = 'Are you sure you want to delete all '+e.data.shifts.length+' shifts in this set?';
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
        } else {
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
  if(this[element.groupID] === undefined) {
    this[element.groupID] = [];
  }
  this[element.groupID].push(element);
  return false;
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
  for(let data of array) {
    data.groupID = this;
    promises.push($.ajax({
      url: '../api/v1/shifts/'+data['_id']['$oid'],
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify(data)
    }));
  }
  Promise.all(promises).then(() => {
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
  } else if(data.group === 'single') {
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
  } else {
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
  } else {
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
  array = array.filter(removeOwnEvent, this);
  var groups =  {};
  var singles = array.filter(filterSinglesAndGroups, groups);
  var groupCount = Object.keys(groups).length;
  if(groupCount === 0 && singles.length === 0) {
    bootbox.alert('No shifts for this department have the same start and end times as the indicated shift!');
    return;
  }
  var groupOptions = {label: 'Existing Set', type: 'radio', id: 'group', value: 'group', onChange: groupTypeChange};
  var groupSelect = {label: 'Sets', type: 'select', id: 'groupID'};
  if(groupCount === 0) {
    groupOptions.disabled = true;
    groupSelect.disabled = true;
  } else {
    groupOptions.checked = true;
    groupSelect.options = [];
    for(var groupID in groups) {
      var groupName = getGroupName(groups[`${groupID}`]);
      groupSelect.options.push({value: groupID, text: groupName});
    }
  }
  var singleOptions = {label: 'Other Shift', type: 'radio', id: 'group', value: 'single', onChange: groupTypeChange};
  var singleSelect = {label: 'Shifts', type: 'select', id: 'shiftID'};
  if(singles.length === 0) {
    singleOptions.disabled = true;
    singleSelect.disabled = true;
  } else {
    if(groupCount === 0) {
      singleOptions.checked = true;
    } else {
      singleSelect.disabled = true;
    }
    singleSelect.options = [];
    for(let single of singles) {
      let shiftName = '';
      if(single.name !== undefined && single.name.length > 0) {
        shiftName = single.name+': '+getRoleName(single.roleID);
      } else {
        let start = new Date(single.startTime);
        let end = new Date(single.endTime);
        shiftName = getRoleName(single.roleID)+': '+start+' to '+end;
      }
      singleSelect.options.push({value: single['_id']['$oid'], text: shiftName});
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

function doGroupShift(e) {
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
  if (aProps.length !== bProps.length) {
    return false;
  }

  for(let propName of aProps) {
    // If values of same property are not equal,
    // objects are not equivalent
    if (a[`${propName}`] !== b[`${propName}`]) {
      return false;
    }
  }
  // If we made it this far, objects
  // are considered equivalent
  return true;
}

function saveGroup(event) {
  var shifts = event.data.shifts;
  let roleList = {};
  for(let shift of shifts) {
    shift.department = event.data.department;
    shift.departmentID = event.data.departmentID;
    shift.earlyLate = event.data.earlyLate;
    shift.enabled = event.data.enabled;
    shift.approvalNeeded = event.data.approvalNeeded;
    shift.endTime = event.data.endTime;
    shift.name = event.data.name;
    shift.startTime = event.data.startTime;
    shift.eventID = event.data.eventID;
    shift.unbounded = event.data.unbounded;
    shift.minShifts = event.data.minShifts;
    if(roleList[shift.roleID] === undefined) {
      roleList[shift.roleID] = 0;
    }
    roleList[shift.roleID]++;
  }
  delete event.data.department;
  delete event.data.departmentID;
  delete event.data.earlyLate;
  delete event.data.enabled;
  delete event.data.approvalNeeded;
  delete event.data.endTime;
  delete event.data.groupID;
  delete event.data.name;
  delete event.data.startTime;
  delete event.data.eventID;
  delete event.data.shifts;
  delete event.data.unbounded;
  delete event.data.minShifts;
  for(let role in event.data) {
    event.data[`${role}`] = event.data[`${role}`]*1;
  }
  if(!isEquivalent(event.data, roleList)) {
    //TODO Create more copies of the role...
    for(let role in roleList) {
      event.data[`${role}`] = event.data[`${role}`] - roleList[`${role}`];
      if(event.data[`${role}`] === 0) {
        delete event.data[`${role}`];
      }
      if(event.data[`${role}`] > 0) {
        while(event.data[`${role}`] > 0) {
          var newShift = Object.assign({}, shifts[0]);
          delete newShift['_id'];
          if(newShift.participant !== undefined) {
            delete newShift.participant;
          }
          if(newShift.volunteer !== undefined) {
            delete newShift.volunteer;
          }
          delete newShift.status;
          delete newShift.why;
          if(newShift.whyClass !== undefined) {
            delete newShift.whyClass;
          }
          newShift.roleID = role;
          shifts.push(newShift);
          event.data[`${role}`]--;
        }
      } else {
        while(event.data[`${role}`] < 0) {
          for(let shift of shifts) {
            if(shift.roleID === role) {
              shift.DELETE = true;
              event.data[`${role}`]++;
              break;
            }
          }
        }
      } 
    }
  }
  var promises = [];
  for(let shift of shifts) {
    if(shift['_id'] !== undefined && shift.DELETE !== true) {
      promises.push($.ajax({
        url: '../api/v1/shifts/'+shift['_id']['$oid'],
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify(shift)
      }));
    } else if(shift.DELETE === true) {
      promises.push($.ajax({
        url: '../api/v1/shifts/'+shift['_id']['$oid'],
        method: 'DELETE',
        contentType: 'application/json'
      }));
    } else {
      promises.push($.ajax({
        url: '../api/v1/shifts/',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(shift)
      }));
    }
  } 
  Promise.all(promises).then(() => {
    location.reload();
  }).catch(e => {
    console.log(e);
    alert('One of more shift failed to save!');
    location.reload();
  });
}

function getDepartmentName(departmentID) {
  if(departments[`${departmentID}`] !== undefined) {
    return departments[`${departmentID}`].departmentName;
  }
  return departmentID;
}

function retryEvents() {
  if(events === undefined) {
    setTimeout(retryEvents, 100);
    return;
  }
  var eventdd = $('#eventID');
  for(let event of events) {
    eventdd.append($('<option value="'+event['_id']['$oid']+'">'+event.name+'</option>'));
  }
}

function shiftAssigned(jqXHR) {
  let obj = this;
  if(jqXHR.status !== 200) {
    if(jqXHR.responseJSON !== undefined && jqXHR.responseJSON.canOverride) {
      bootbox.confirm(jqXHR.responseJSON.message, function(result) {
        if(result) {
          $.ajax({
            url: '../api/v1/shifts/'+obj.id+'/Actions/Assign',
            method: 'POST',
            complete: shiftAssigned,
            contentType: 'application/json',
            data: JSON.stringify({email: obj.email, force: result}),
            context: obj
          });
        }
      });
      return;
    } else if(jqXHR.responseJSON !== undefined) {
      alert(jqXHR.responseJSON.message);
      return;
    }
    console.log(jqXHR);
    alert('Unable to assign shift!');
    return;
  }
  location.reload();
}

function finishAssignShift(e) {
  let shiftID = e.data.id;
  let obj = {id: shiftID, email: e.data.assignUser};
  $.ajax({
    url: '../api/v1/shifts/'+shiftID+'/Actions/Assign',
    method: 'POST',
    complete: shiftAssigned,
    contentType: 'application/json',
    data: JSON.stringify({email: e.data.assignUser}),
    context: obj
  });
}

function assignShift(e) {
  let shiftID = e.data['_id']['$oid'];
  let dialogOptions = {
    id: 'assignShift',
    title: 'Assign Shift',
    data: {id: shiftID},
    inputs: [
      {label: 'User', type: 'text', id: 'assignUser', keyUp: searchUsers}
    ],
    buttons: [
      {text: 'Assign', callback: finishAssignShift}
    ]
  };
  flipDialog.dialog(dialogOptions);
}

function gotShiftToEdit(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to obtain shift!');
    return;
  }
  var shift = jqXHR.responseJSON;
  var eventOptions = [];
  let myEvent = {};
  if(events === undefined) {
    setTimeout(retryEvents, 100);
    myEvent.startTime = new Date();
    myEvent.endTime = new Date(8640000000000000);
  } else {
    for(let event of events) {
      let eventOption = {value: event['_id']['$oid'], text: event.name};
      if(shift.eventID === event['_id']['$oid']) {
        eventOption.selected = true;
        myEvent = event;
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
      {label: 'Start Time', type: 'datetime-local', id: 'startTime', min: myEvent.startTime, max: myEvent.endTime, onChange: setMinEndTime, required: true, value: shift.startTime},
      {label: 'End Time', type: 'datetime-local', id: 'endTime', min: myEvent.startTime, max: myEvent.endTime, required: true, value: shift.endTime},
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
      {text: 'Add to Shift Set', callback: doGroupShift, disabled: !groupable},
      {text: 'Save Shift', callback: saveShift}
    ]
  };
  let promises = [];
  if(shift.status === 'filled' || shift.status === 'pending') {
    dialogOptions.alerts = [
      {type: 'warning', text: 'Shift is already filled!'}
    ];
    if(shift.needEEApproval) {
      dialogOptions.alerts.push({type: 'info', text: 'Shift requires Early Entry approval.'});
    }
    dialogOptions.inputs.push({label: 'Participant', type: 'text', id: 'participant', value: shift.participant, disabled: true});
    
    dialogOptions.buttons.push({text: 'Empty Shift', callback: emptyShift});
    promises.push($.ajax({
      url: '../api/v1/participants/'+encodeURIComponent(shift.participant)
    }));
  } else {
    dialogOptions.buttons.push({text: 'Assign Shift', callback: assignShift});
  }
  promises.push($.ajax({
    url: '../api/v1/departments/'+shift.departmentID+'/roles'
  }));
  Promise.allSettled(promises).then((results) => {
    if(results.length > 1) {
      if(results[0].status === 'fulfilled') {
        let partResults = results.shift().value;
        let name = partResults.firstName+' "'+partResults.burnerName+'" '+partResults.lastName;
        if(partResults.burnerName.trim().length === 0 || partResults.firstName === partResults.burnerName) {
          name = partResults.firstName+' '+partResults.lastName;
        }
        dialogOptions.inputs.push({label: 'Participant Name', type: 'text', id: 'participant_name', value: name, disabled: true});
        dialogOptions.inputs.push({label: 'Participant Email', type: 'text', id: 'participant_email', value: partResults.email, disabled: true});
      } else {
        results.shift();
      }
    }
    let roleResult = results.shift().value;
    for(let input of dialogOptions.inputs) {
      if(input.id === 'roleID') {
        input.options = [];
        for(let role of roleResult) {
          input.options.push({value: role.short_name, text: role.display_name});
        }
      }
    }
    flipDialog.dialog(dialogOptions);
  });
}

function removeGroupSignup(e) {
  $.ajax({
    url: '../api/v1/shifts/Actions/RemoveGroupSignupLink',
    contentType: 'application/json',
    data: JSON.stringify(e.data),
    type: 'POST',
    dataType: 'json',
    complete: doneCreatingShift
  });
}

function generateGroupSignup(e) {
  let obj = {};
  for(let shift of e.data.shifts) {
    if(shift.status === 'pending' || shift.status === 'filled') {
      continue;
    }
    if(obj['roles.'+shift.roleID] === undefined) {
      obj['roles.'+shift.roleID] = 1;
    } else {
      obj['roles.'+shift.roleID]++;
    }
  }
  $.ajax({
    url: '../api/v1/shifts/'+e.data.shifts[0]['_id']['$oid']+'/Actions/GenerateGroupLink',
    contentType: 'application/json',
    data: JSON.stringify(obj),
    type: 'POST',
    dataType: 'json',
    complete: doneCreatingShift
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
  let myEvent = {};
  for(let event of events) {
    let eventOption = {value: event['_id']['$oid'], text: event.name};
    if(shifts[0].eventID === event['_id']['$oid']) {
      eventOption.selected = true;
      myEvent = event;
    }
    eventOptions.push(eventOption);
  }
  var group = {shifts: shifts};
  var roleText = '';
  var roleList = {};
  var taken = false;
  var groupLink = false;
  for(let shift of shifts) {
    if(roleList[shift.roleID] === undefined) {
      roleList[shift.roleID] = 0;
    }
    roleList[shift.roleID]++;
    if(shift.status === 'filled' || shift.status === 'pending') {
      taken = true;
    }
    if(shift.signupLink !== undefined && shift.signupLink !== '') {
      groupLink = true;
    }
  }
  for(var role in roleList) {
    roleText+='<div class="input-group"><input type="number" class="form-control" id="'+role+'" name="'+role+'" value="'+roleList[`${role}`]+'"/><div class="input-group-append"><span class="input-group-text" id="basic-addon2">'+getRoleName(role)+'</span></div></div>';
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
      {label: 'Start Time', type: 'datetime-local', id: 'startTime', min: myEvent.startTime, max: myEvent.endTime, onChange: setMinEndTime, required: true, value: shifts[0].startTime},
      {label: 'End Time', type: 'datetime-local', id: 'endTime', min: myEvent.startTime, max: myEvent.endTime, required: true, value: shifts[0].endTime},
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
      {text: 'Add Shift/Merge Set', callback: doGroupShift},
      {text: 'Save Shift Set', callback: saveGroup}
    ]
  };
  dialogOptions.alerts = [];
  if(taken) {
    dialogOptions.alerts.push({type: 'warning', text: 'One or more shift in the set is already filled!'});
  }
  let i = 0;
  for(let shift of shifts) {
    if(shift.status === 'filled') {
      dialogOptions.inputs.push({label: 'Shift '+i+' ('+getRoleName(shift.roleID)+')', type: 'html', id: 'participant-'+i, text: '<a href="shifts.php?shiftID='+shift['_id']['$oid']+'">'+shift.participant+'</a>'});
    } else if(shift.status === 'pending') {
      dialogOptions.inputs.push({label: 'Shift '+i+' ('+getRoleName(shift.roleID)+')', type: 'html', id: 'participant-'+i, text: '<a href="shifts.php?shiftID='+shift['_id']['$oid']+'"><i>Pending:</i> '+shift.participant+'</a>'});
    } else {
      dialogOptions.inputs.push({label: 'Shift '+i+' ('+getRoleName(shift.roleID)+')', type: 'html', id: 'participant-'+i, text: '<a href="shifts.php?shiftID='+shift['_id']['$oid']+'"><i>Unfilled</i></a>'});
    }
    i++;
  }
  if(groupLink) {
    dialogOptions.alerts.push({type: 'info', text: 'A group signup link exists for this group!'});
    for(let shift of shifts) {
      if(shift.signupLink !== undefined && shift.signupLink !== '') {
        dialogOptions.inputs.push({label: 'Group Signup Link', type: 'html', id: 'signupLink', text: '<a href="https://secure.burningflipside.com/fvs/groupSignup.php?id='+shift.signupLink+'">https://secure.burningflipside.com/fvs/groupSignup.php?id='+shift.signupLink+'</a>'});
        break;
      }
    }
    dialogOptions.buttons.push({text: 'Remove Group Signup', callback: removeGroupSignup});
  } else {
    dialogOptions.buttons.push({text: 'Generate Group Signup', callback: generateGroupSignup});
  }
  flipDialog.dialog(dialogOptions);
}

function editShift(elem) {
  var href = elem.getAttribute('href');
  href = href.substring(1);
  $.ajax({
    url: '../api/v1/shifts/'+href,
    complete: gotShiftToEdit
  });
  return false;
}

function editGroup(elem) {
  var href = elem.getAttribute('href');
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
  let roleID = getParameterByName('role');
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
    var group = groups[`${groupID}`];
    var groupName = getGroupName(group);
    var filledCount = 0;
    var pendingCount = 0;
    var emptyCount = 0;
    let found = false;
    for(let groupShift of group) {
      if(groupShift.status === 'filled') {
        filledCount++;
      } else if(groupShift.status === 'pending') {
        pendingCount++;
      } else {
        emptyCount++;
      }
      if(roleID !== null && groupShift.roleID === roleID) {
        found = true;
      }
    }
    if(roleID !== null && !found) {
      continue;
    }
    let badge = '';
    if(filledCount > 0) {
      badge += '<span class="badge badge-warning">Filled <span class="badge badge-light">'+filledCount+'</span></span>';
    }
    if(pendingCount > 0) {
      badge += '<span class="badge badge-info">Pending <span class="badge badge-light">'+pendingCount+'</span></span>';
    }
    if((filledCount > 0 || pendingCount > 0) && emptyCount !== 0) {
      badge += '<span class="badge badge-secondary">Empty <span class="badge badge-light">'+emptyCount+'</span></span>';
    }
    $('#'+group[0].departmentID+'List').append('<a href="#'+groupID+'" class="list-group-item list-group-item-action shift" onclick="return editGroup(this);"><i class="fas fa-object-group"></i> '+groupName+' '+badge+'</a>');
  }
  singles.sort(sortEvents);
  for(let single of singles) {
    if(roleID !== null && single.roleID !== roleID) {
      continue;
    }
    let shiftName = '';
    if(single.name !== undefined && single.name.length > 0) {
      shiftName = single.name+': '+getRoleName(single.roleID);
    } else {
      let start = new Date(single.startTime);
      let end = new Date(single.endTime);
      shiftName = getRoleName(single.roleID)+': '+start+' to '+end;
    }
    let badge = '';
    if(single.status === 'filled') {
      badge = '<span class="badge badge-warning">Filled</span>';
    } else if(single.status === 'pending') {
      badge = '<span class="badge badge-info">Pending</span>';
    }
    $('#'+single.departmentID+'List').append('<a href="#'+single['_id']['$oid']+'" class="list-group-item list-group-item-action shift" onclick="return editShift(this);">'+shiftName+' '+badge+'</a>');
  }
  if(getParameterByName('hideEmpty') !== null) {
    $('.card:not(:has(.shift))').hide();
  }
}

function processEvents(eventToProcess) {
  if(!Array.isArray(eventToProcess)) {
    Sentry.withScope(scope => {
      scope.setExtra('eventToProcess', eventToProcess);
      scope.setLevel('info');
      Sentry.captureMessage('Failed to obtain events to process '+eventToProcess);
    });
    alert('Failed to obtain events...');
    return;
  }
  if(getParameterByName('showOld') === null) {
    eventToProcess = eventToProcess.filter(function(evt) {
      return evt.why !== 'Event is in the past';
    });
  }
  eventToProcess.sort(function(a, b){
    var aDate = new Date(a.startTime);
    var bDate = new Date(b.startTime);
    return aDate.getTime() - bDate.getTime();
  });
  var ef = $('#eventFilter');
  for(let event of eventToProcess) {
    var option = $('<option value="'+event['_id']['$oid']+'">'+event.name+'</option>');
    ef.append(option);
  }
  var faveEvent = localStorage.getItem('adminEvent');
  if(faveEvent !== null) {
    ef.val(faveEvent);
  }
  return eventToProcess;
}

function processDepartments(array) {
  let deptID = getParameterByName('dept');
  array.sort(function(a, b) {
    return a.departmentName.localeCompare(b.departmentName);
  });
  array = array.filter(function(elem) {
    return elem.isAdmin;
  });
  var count = 0;
  var accordian = $('#accordion');
  for(let dept of array) {
    if(deptID !== null) {
      if(dept.departmentID !== deptID) {
        continue;
      }
    }
    count++;
    departments[dept.departmentID] = dept;
    accordian.append('<div class="card"><div class="card-header" id="heading'+dept.departmentID+'"><h2 class="mb-0"><button class="btn btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#collapse'+dept.departmentID+'" aria-expanded="true" aria-controls="collapse'+dept.departmentID+'">'+dept.departmentName+'</button></h2></div><div id="collapse'+dept.departmentID+'" class="collapse show" aria-labelledby="heading'+dept.departmentID+'" data-parent="#accordion"><div class="card-body"><div class="list-group" id="'+dept.departmentID+'List"><a href="#'+dept.departmentID+'" class="list-group-item list-group-item-action" onclick="return addNewShift(this);"><i class="fas fa-plus"></i> Add new shift</a><a href="#'+dept.departmentID+'" class="list-group-item list-group-item-action" onclick="return addNewGroup(this);"><i class="far fa-plus-square"></i> Add new shift set</a></div></div></div></div>');
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
    } else if(filled === '2') {
      uri += 'eq pending';
    } else {
      uri += 'ne filled and status ne pending';
    }
  } else if(eventID !== null) {
    uri += '?$filter=eventID eq '+eventID;
  }
  $.ajax({
    url: uri,
    complete: gotShifts
  });
  if(window.location.hash !== '') {
    accordian.find(':not(#collapse'+window.location.hash.substr(1)+')').removeClass('show');
  } else if (count > 2) {
    accordian.find('.show').removeClass('show');
  }
}

function processRoles(roleData) {
  roles = {};
  for(let role in roleData) {
    roles[role.short_name] = role;
  }
  return roles;
}

function gotInitialData(results) {
  var eventResult = results.shift();
  var deptResult = results.shift();
  var roleResult = results.shift();
  var obj = {};
  if(eventResult.status !== 'fulfilled' || deptResult.status !== 'fulfilled' || roleResult.status !== 'fulfilled') {
    if(eventResult.reason.status === 401) {
      //User is just not logged in. Return silently...
      return;
    }
    Sentry.withScope(scope => {
      scope.setExtra('eventResult', eventResult);
      scope.setExtra('deptResult', deptResult);
      scope.setExtra('roleResult', roleResult);
      scope.setLevel('info');
      Sentry.captureMessage('Failed to obtain data to create shift page');
    });
    alert('Unable to obtain required data!');
    return;
  }
  events = obj.events = processEvents(eventResult.value);
  obj.depts = processDepartments(deptResult.value);
  roles = obj.roles = processRoles(roleResult.value);
  var shiftID = getParameterByName('shiftID');
  var groupID = getParameterByName('groupID');
  if(shiftID !== null) {
    $.ajax({
      url: '../api/v1/shifts/'+shiftID,
      complete: gotShiftToEdit
    });
  } else if(groupID !== null) {
    $.ajax({
      url: '../api/v1/shifts?$filter=groupID eq '+groupID,
      complete: gotGroupToEdit
    });
  }
}

function setMinEndTime(e) {
  $('#endTime').attr('min', e.target.value);
}

function setBoundaryTimes(e) {
  var id = e.target.value;
  let myEvent = {};
  for(let event of events) {
    if(event['_id']['$oid'] === id) {
      myEvent = event;
      break;
    }
  }
  $('#startTime').attr('min', myEvent.startTime);
  $('#startTime').attr('max', myEvent.endTime);
  $('#endTime').attr('min', myEvent.startTime);
  $('#endTime').attr('max', myEvent.endTime);
  if(document.querySelector('#startTime')._flatpickr !== undefined) {
    let fp = document.querySelector('#startTime')._flatpickr;
    fp.set('minDate', myEvent.startTime);
    fp.set('maxDate', myEvent.endTime);
    fp.clear();
    fp.changeMonth(-12);
    fp.changeMonth(12);
    fp.jumpToDate();
    fp.redraw();
    fp = document.querySelector('#endTime')._flatpickr;
    fp.set('minDate', myEvent.startTime);
    fp.set('maxDate', myEvent.endTime);
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
  } else {
    $('#minShifts').attr('disabled', true);
  }
}

function efChanged(e) {
  $('.shift').remove();
  $('.card').show();
  if(e.target.value === '') {
    $.ajax({
      url: '../api/v1/shifts',
      complete: gotShifts
    });
  } else {
    for(let fvsEvent of events) {
      if(fvsEvent['_id']['$oid'] === e.target.value) {
        if(fvsEvent.departments.length > 0) {
          let cards = $('.card');
          for(let card of cards) {
            let header = card.querySelector('.card-header');
            let headerName = header.id.substring(7);
            if(!fvsEvent.departments.includes(headerName)) {
              $(card).hide();
            }
          }
        }
        break;
      }
    }
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
  promises.push($.ajax({
    url: '../api/v1/roles'
  }));
  Promise.allSettled(promises).then(gotInitialData);
  $('#startTime').change(setMinEndTime);
  $('#eventID').change(setBoundaryTimes);
  $('#eventFilter').change(efChanged);
}

$(initPage);
/* vim: set tabstop=2 shiftwidth=2 expandtab: */
