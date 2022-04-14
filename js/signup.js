/* global $, bootbox, flipDialog, getParameterByName */
/* exported abandon, groupSignup, override, revealPage, showAdminSignup, signup */
function signupDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to sign up for shift');
    return;
  }
  alert('Success!');
  window.history.back();
}

function signupCreated(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to sign up for shift');
    return;
  }
  bootbox.alert({
    message: 'Here is your group signup link. Share the link with your friends or campmates to allow them to sign up for the same shift as you.<br/><br/><blockquote>https://secure.burningflipside.com/fvs/groupSignup.php?id='+jqXHR.responseJSON.uuid+'</blockquote>',
    size: 'large'
  });
  console.log(jqXHR);
}

function createGroupSignup(e) {
  var shiftID = getParameterByName('shiftID');
  $.ajax({
    url: 'api/v1/shifts/'+shiftID+'/Actions/GenerateGroupLink',
    method: 'POST',
    data: JSON.stringify(e.data),
    contentType: 'application/json',
    complete: signupCreated
  });
}

function groupSignupInfoObtained(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to sign up for shift');
    return;
  }
  var shiftID = $('#shiftID').val();
  var data = jqXHR.responseJSON;
  var dialogOptions = {
    title: 'New Group Signup',
    inputs: [
      {type: 'hidden', id: 'groupID', value: data.groupID},
      {label: 'Department', type: 'text', readonly: true, id: 'department', value: data.department},
      {label: 'Start Time', type: 'datetime-local', id: 'startTime', readonly: true, value: data.startTime},
      {label: 'End Time', type: 'datetime-local', id: 'endTime', readonly: true, value: data.endTime},
      {label: 'Shift Name', type: 'text', id: 'name', readonly: true, value: data.name}
    ],
    buttons: [
      {text: 'Start Group Signup', callback: createGroupSignup}
    ]
  };
  var myPos = {label: 'My position', type: 'select', id: 'myshift', options: []};
  var used = {};
  for(let shift of data.shifts) {
    if(used[shift.roleID] === undefined) {
      let id = shift['_id']['$oid'];
      myPos.options.push({value: id, text: shift.role, selected: shiftID === id});
      used[shift.roleID] = {name: shift.role, count: 0};
      if(shiftID !== id) {
        used[shift.roleID].count = 1;
      }
    } else {
      used[shift.roleID].count++;
    }
  }
  dialogOptions.inputs.push(myPos);
  for(var role in used) {
    dialogOptions.inputs.push({label: used[`${role}`].name, type: 'number', id: 'roles.'+role, min: 0, max: used[`${role}`].count, value: used[`${role}`].count});
  }
  flipDialog.dialog(dialogOptions);
}

function abandon() {
  var shiftID = getParameterByName('shiftID'); 
  $.ajax({
    url: 'api/v1/shifts/'+shiftID+'/Actions/Abandon',
    method: 'POST',
    complete: signupDone
  });
}

function signup() {
  var shiftID = $('#shiftID').val();
  $.ajax({
    url: 'api/v1/shifts/'+shiftID+'/Actions/Signup',
    method: 'POST',
    complete: signupDone
  });
}

function override() {
  var shiftID = $('#shiftID').val();
  var obj = {};
  obj['participant'] = '/dev/null';
  obj['status'] = 'filled';
  obj['volunteer'] = $('#participantOverride').val();
  $.ajax({
    url: 'api/v1/shifts/'+shiftID,
    method: 'PATCH',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    complete: signupDone
  });
}

function groupSignup() {
  var shiftID = $('#shiftID').val();
  $.ajax({
    url: 'api/v1/shifts/'+shiftID+'/Actions/StartGroupSignup',
    method: 'POST',
    complete: groupSignupInfoObtained
  });
}

function showAdminSignup() {
  $('#adminSignup').removeClass('d-none');
}

function revealPage() {
  $('#signupContent').removeClass('d-none');
  $('#groupContent').removeClass('d-none');
}
