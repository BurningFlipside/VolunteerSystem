/*global $, bootbox, Tabulator, getParameterByName, addOptiontoSelect, flipDialog, Papa, getNameForUser, searchUsers*/
/* exported groupsAllowedUpdated, newRole, onEmailListUpdated, publiclyVisibleUpdated, roleNameUpdated, showRoleWizard, gApiLoaded, gisLoaded */
var deptId;
var table;

function loadDataFromColumn(sheetId, tabId, columnNumber, otherColumns, event) {
  // TODO allow rules for another column to be created
  const ACharCode = 65;
  let columnName = String.fromCharCode(ACharCode + columnNumber);
  fetch('/fvs/api/v1/google/spreadsheets/'+sheetId+'/'+tabId+'/*/'+columnName).then((response) => {
    response.json().then((data) => {
      let emails = [];
      // Skip the first row, it's the header
      for(let i = 1; i < data.length; i++) {
        if(data[i].length === 0) {
          continue;
        }
        emails.push(data[i][0]);
      }
      showDialog2(event.data.emailList, event.data.editEmailId, [], true).then(() => {
        processNewEmails(emails, event.data.editEmailId);
      });
    });
  });
}

function loadDataFromSubSheet(sheetId, tabId, event) {
  // Get the first row to determine if there is only one column and get column headers
  fetch('/fvs/api/v1/google/spreadsheets/'+sheetId+'/'+tabId+'/1').then((response) => {
    response.json().then((data) => {
      let headers = data[0];
      if(headers.length === 1) {
        loadDataFromColumn(sheetId, tabId, 0, [], event);
        return;
      }
      let inputOptions = [];
      for(let header of headers) {
        inputOptions.push({text: header, value: header});
      }
      bootbox.prompt({
        title: 'Which column contains emails?',
        inputType: 'select',
        inputOptions: inputOptions,
        callback: (result) => {
          if(result === null) {
            return;
          }
          const indexOf = headers.indexOf(result);
          if(indexOf > -1) {
            headers.splice(indexOf, 1);
          }
          loadDataFromColumn(sheetId, tabId, indexOf, headers, event);
        }
      });
    });
  });
}

function loadDataFromSpreadSheet(sheetId, event) {
  fetch('/fvs/api/v1/google/spreadsheets/'+sheetId).then((response) => {
    response.json().then((data) => {
      let inputOptions = [];
      for(let tab of data.sheets) {
        inputOptions.push({text: tab.properties.title, value: tab.properties.title});
      }
      if(inputOptions.length === 1) {
        loadDataFromSubSheet(sheetId, inputOptions[0].value, event);
        return;
      }
      bootbox.prompt({
        title: 'Which tab would you like to read?',
        inputType: 'select',
        inputOptions: inputOptions,
        callback: (result) => {
          if(result === null) {
            return;
          }
          loadDataFromSubSheet(sheetId, result, event);
        }
      });
    });
  });
}

function importFromGoogle(ev) {
  fetch('/fvs/api/v1/google/spreadsheets').then((response) => {
    response.json().then((data) => {
      let inputOptions = [];
      for(let sheet of data) {
        inputOptions.push({text: sheet.name, value: sheet.id});
      }
      bootbox.prompt({
        title: 'Which spreadsheet would you like to read?',
        inputType: 'select',
        inputOptions: inputOptions,
        callback: (result) => {
          if(result === null) {
            return;
          }
          loadDataFromSpreadSheet(result, ev);
        }
      });
    });
  });
}

function roleNameUpdated() {
  let dispName = $('#display_name').val();
  let id = dispName.replace(/ /g, '_');
  id = id.replace(/[\/\\]/g, '_');
  let fullId = deptId+'_'+id;
  $('#short_name').val(fullId);
}

function groupsAllowedUpdated() {
  var allowed = $('#groups_allowed')[0].checked;
  if(allowed) {
    $('#grouped_with').removeAttr('disabled');
  } else {
    $('#grouped_with').attr('disabled', true);
  }
}

function publiclyVisibleUpdated() {
  var allowed = $('#publicly_visible')[0].checked;
  var email = $('#onEmailList')[0].checked;
  var inputs = $('#roleReqs input[name!="publicly_visible"]');
  var textareas = $('#roleReqs textarea');
  if(allowed) {
    inputs.attr('disabled', true);
    textareas.attr('disabled', true);
  } else {
    inputs.removeAttr('disabled');
    if(email) {
      textareas.removeAttr('disabled');
    }
  }
}

function onEmailListUpdated() {
  var allowed = $('#onEmailList')[0].checked;
  if(allowed) {
    $('[id="requirements.email_list"]').removeAttr('disabled');
  } else {
    $('[id="requirements.email_list"]').attr('disabled', true);
  }
}

function editDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to edit value!');
  }
}

function editDoneRefresh(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to edit value!');
  }
  location.reload();
}

function addDone(jqXHR) {
  if(jqXHR.status === 200) {
    location.reload();
    return;
  }
  alert('Unable to add role!');
  console.log(jqXHR);
}

function valueChanged(value, field, id) {
  var propParts = field.split('.');
  var obj = {};
  var current = obj;
  for(var i = 0; i < propParts.length-1; i++) {
    current = current[`${propParts[i]}`] = {};  // eslint-disable-line security/detect-object-injection
  }
  current[propParts[propParts.length-1]] = value;
  var url = '../api/v1/departments/'+deptId+'/roles/'+id;
  if(deptId === null) {
    url = '../api/v1/roles/'+id;
  }
  $.ajax({
    url: url,
    method: 'PATCH',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    dataType: 'json',
    complete: editDone
  });
}

function dataChanged(cell) {
  valueChanged(cell.getValue(), cell.getColumn().getField(), cell.getRow().getData()['short_name']);
}

function gotDept(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to locate department '+deptId);
    console.log(jqXHR);
    return;
  }
  $('#deptName').html(jqXHR.responseJSON.departmentName);
}

function newRole(role) {
  delete role.onEmailList;
  role.short_name = role.short_name.replace(/ /g, '_'); // eslint-disable-line camelcase
  role.short_name = role.short_name.replace(/[\/\\]/g, '_'); // eslint-disable-line camelcase
  $.ajax({
    url: '../api/v1/departments/'+deptId+'/roles/',
    method: 'POST',
    data: JSON.stringify(role),
    contentType: 'application/json',
    dataType: 'json',
    complete: addDone
  });
}

function showRoleWizard() {
  $('#roleWizard').modal('show');
}

function groupFormatter(cell) {
  var value = cell.getValue();
  if(value === undefined) {
    return '';
  }
  if(Array.isArray(value)) {
    return value.join(',');
  }
  return value;
}

function groupedWithEditor(cell, onRendered, success) {
  var rowData = cell.getRow().getData();
  var departmentID = rowData.departmentID;
  var rows = cell.getTable().getRows();
  var editor = document.createElement('select');
  var value = cell.getValue();
  var values = [];
  if(value !== undefined) {
    if(Array.isArray(value)) {
      values = value;
    } else {
      values = value.split(',');
    }
  }

  editor.setAttribute('multiple', true);
  editor.setAttribute('style', 'width: 100%;');
  for(let row of rows) {
    let data = row.getData();
    if(data.short_name === rowData.short_name) {
      continue;
    }
    if(data.departmentID === departmentID) {
      var opt = document.createElement('option');
      opt.value = data.short_name;
      if(values.includes(data.short_name)) {
        opt.selected = true;
      }
      opt.text = data.display_name;
      editor.add(opt);
    }
  }
  function successFunc() {
    let data = $(editor).select2('data');
    var ret = '';
    for(let item of data) {
      ret+=item.id;
      ret+=',';
    }
    ret = ret.slice(0, -1);
    success(ret);
  }
  onRendered(function(){
    var sel2 = $(editor).select2();
    sel2.select2('open');
    sel2.change(successFunc);
    sel2.on('blur', successFunc);
  });
  return editor;
}

function gotDeptList(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    return;
  }
  var array = jqXHR.responseJSON;
  array.sort(function(a, b) {
    return a.departmentName.localeCompare(b.departmentName);
  });
  var sel = $('#deptFilter');
  let count = 0;
  for(let dept of array) {
    if(dept.isAdmin) {
      addOptiontoSelect(sel[0], dept.departmentID, dept.departmentName);
      count++;
    }
  }
  if(count === 1) {
    $('#deptFilter')[0].selectedIndex=1;
    $('#newRoleBtn').removeAttr('disabled').removeAttr('title');
    $('#deptFilter').change();
  }
}

function deptFilterChanged(e) {
  var value = e.target.value;
  if(value === '*') {
    table.setData('../api/v1/roles');
    $('#newRoleBtn').attr('disabled', true).attr('title', 'Adding a new role is disabled except on the individual department pages');
    deptId = null;
  } else {
    table.setData('../api/v1/departments/'+value+'/roles');
    $('#newRoleBtn').removeAttr('disabled').removeAttr('title');
    deptId = value;
  }
}

function gotRoles(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    return;
  }
  var array = jqXHR.responseJSON;
  for(let role in array) {
    if(role.retired) {
      continue;
    }
    let newOption = new Option(role.display_name, role.short_name, false, false);
    $('#grouped_with').append(newOption);
  }
}

function delIcon() {
  return "<i class='fa fa-trash'></i>";
}

function emailIcon() {
  return '<i class="fa fa-users" title="Edit the restricted to email list with help from the system."></i>';
}

function deleteDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to delete department!');
    return;
  }
  location.reload();
}

function gotShiftsBeforeDelete(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to obtain shifts!');
    return;
  }
  var shifts = jqXHR.responseJSON;
  let roleId = this.short_name;
  if(shifts.length > 0) {
    bootbox.confirm({
      message: 'This role has one or more shifts. Would you like to retire this role so that you will not see it when creating shifts?',
      buttons: {
        confirm: {
          label: 'Yes'
        },
        cancel: {
          label: 'No'
        }
      },
      callback: (result) => {
        if(result) {
          doRetire(roleId);
        }
      }
    });
    return;
  }
  bootbox.confirm({
    message: 'Are you sure you want to delete the role "'+this.display_name+'"?',
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
        $.ajax({
          url: '../api/v1/roles/'+roleId,
          method: 'DELETE',
          complete: deleteDone
        });
      }
    }
  });
}

function doRetire(roleId) {
  fetch('../api/v1/roles/'+roleId, {
    method: 'PATCH',
    body: JSON.stringify({retired: true})
  }).then((response) => {
    if(response.ok) {
      location.reload();
      return;
    }
    alert('Unable to retire role!');
  })
}


function delRole(e, cell) {
  var data = cell.getRow().getData();
  $.ajax({
    url: '../api/v1/shifts?$filter=roleID eq '+data.short_name,
    context: data,
    complete: gotShiftsBeforeDelete
  });
}

function gotEmailFailure3(email, resolve) {
  resolve({email: email, value: [], status: 2});
}

function gotEmailSuccess3(value, email, resolve) {
  if(value[`${email}`]) {
    resolve({email: email, value: value, status: 3});
    return;
  }
  gotEmailFailure3(email, resolve);
}

function gotEmailFailure2(email, resolve) {
  let obj = {'emails': [email]};
  let intPromise = $.ajax({url: '../api/v1/participants/Actions/HasProfile', method: 'POST', data: JSON.stringify(obj), contentType: 'application/json'});
  intPromise.then((value) => {
    gotEmailSuccess3(value, email, resolve);
  }).catch(() => {
    gotEmailFailure3(email, resolve);
  });
}

function gotEmailSuccess2(value, email, resolve) {
  if(value.length > 0) {
    resolve({email: email, value: value, status: 1});
    return;
  }
  gotEmailFailure2(email, resolve);
}

function gotEmailFailure(email, resolve) {
  let intPromise = $.ajax({url: '../api/v1/participants?$filter=substringof(email,\''+email+'\')'});
  intPromise.then((value) => {
    gotEmailSuccess2(value, email, resolve);
  }).catch(() => {
    gotEmailFailure2(email, resolve);
  });
}

function gotEmailSuccess(value, email, resolve) {
  if(value.length > 0) {
    resolve({email: email, value: value, status: 0});
    return;
  }
  gotEmailFailure(email, resolve);
}

function getParticipantByEmail(email) {
  return new Promise((resolve) => {
    let intPromise = $.ajax({url: '../api/v1/participants?$filter=email eq \''+email+'\''});
    intPromise.then((value) => {
      return gotEmailSuccess(value, email, resolve);
    }).catch(() => {
      gotEmailFailure(email, resolve);
    });
  });
}

function saveEmailEdits(e) {
  let roleName = e.data.roleId;
  let string = e.data.emailList.join(',');
  if($('#addUser').val().length > 0) {
    addEmailToList(e.data.emailList, $('#addUser').val());
    string = e.data.emailList.join(',');
  }
  console.log(string);
  $.ajax({
    url: '../api/v1/roles/'+roleName,
    method: 'PATCH',
    data: JSON.stringify({'requirements': {'email_list': string}}),
    contentType: 'application/json',
    dataType: 'json',
    complete: editDoneRefresh
  });
}

function emailSendDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to send email!');
    return;
  }
  alert('Email sent!');
}

function doEmailSend(e) {
  let event = $('#eventSelect').select2('data');
  if(event.length === 0) {
    alert('Please select event first!');
    return;
  }
  let sendSignupLink = $('#signupLink')[0].checked;
  let sendSystemLink = $('#systemLink')[0].checked;
  let sendSignupLink2 = $('#signupLink2')[0].checked;
  let obj = {roleId: e.data.sendEmailRoleId, eventId: event[0].id};
  if(sendSignupLink) {
    obj.signupLink = e.data.signupLink;
  }
  if(sendSystemLink) {
    obj.systemLink = e.data.systemLink;
  }
  if(sendSignupLink2) {
    obj.signupLink2 = e.data.signupLink2;
  }
  console.log(obj);
  $.ajax({
    url: '../api/v1/roles/Actions/SendRoleEmail',
    method: 'POST',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    dataType: 'json',
    complete: emailSendDone
  });
}

function emailRoleCapable(e) {
  let signupLink = [];
  let systemLink = [];
  let signupLink2 = [];
  for(let email in e.data.emailStatus) {
    switch(e.data.emailStatus[`${email}`]) {
      case 0:
      case 1:
        signupLink.push(email);
        break;
      case 2:
        systemLink.push(email);
        break;
      case 3:
        signupLink2.push(email);
        break;
      default:
        console.log(email);
    }
  }
  let content = $('<div style="width: 100%;">');
  let row = $('<div class="row">');
  row.append('<div class="col col-md-3"><label for="eventSelect" class="form-label">Event for emails</label></div>');
  let col = $('<div class="col col-md-9">');
  let eventSelect = $('<select id="eventSelect" class="form-select">');
  col.append(eventSelect);
  row.append(col);
  content.append(row);
  content.append('<div class="form-check"><input class="form-check-input" type="checkbox" id="signupLink" checked><label class="form-check-label" for="signupLink">Send an email to the following people with a link to all shifts for this role:</label></div>');
  content.append('<div class="w-100"></div>');
  content.append('<div class="row"><div class="col col-lg-1"></div><div class="col col-lg-11"><i>'+signupLink.join(', ')+'</i></div></div>');
  content.append('<div class="form-check"><input class="form-check-input" type="checkbox" id="systemLink" checked><label class="form-check-label" for="systemLink">Send an email to the following people with a link to sign up for a profile and/or provide their correct email:</label></div>');
  content.append('<div class="w-100"></div>');
  content.append('<div class="row"><div class="col col-lg-1"></div><div class="col col-lg-11"><i>'+systemLink.join(', ')+'</i></div></div>');
  content.append('<div class="form-check"><input class="form-check-input" type="checkbox" id="signupLink2" checked><label class="form-check-label" for="signupLink2">Send an email to the following people with a link to sign in to the volunteer system:</label></div>');
  content.append('<div class="w-100"></div>');
  content.append('<div class="row"><div class="col col-lg-1"></div><div class="col col-lg-11"><i>'+signupLink2.join(', ')+'</i></div></div>');
  let dialogOptions = {
    id: 'sendEmail',
    title: 'Send Emails to Role',
    data: {roleId: e.data.roleId, signupLink: signupLink, systemLink: systemLink, signupLink2: signupLink2},
    inputs: [
      {type: 'hidden', id: 'sendEmailRoleId', value: e.data.roleId},
      {type: 'html', text: content}
    ],
    buttons: [
      {text: 'Save', callback: doEmailSend}
    ]
  };
  flipDialog.dialog(dialogOptions);
  eventSelect.select2({
    width: '90%',
    ajax: {
      url: '../api/v1/events',
      processResults: function(data) {
        var res = [];
        data.sort((a,b) => {
          return a.name.localeCompare(b.name);
        });
        for(let event of data) {
          if(event.available) {
            res.push({id: event['_id']['$oid'], text: event.name});
          }
        }
        return {results: res};
      }
    }
  });
  if(signupLink.length === 0) {
    $('#signupLink')[0].checked = false;
    $('#signupLink')[0].disabled = true;
  }
  if(systemLink.length === 0) {
    $('#systemLink')[0].checked = false;
    $('#systemLink')[0].disabled = true;
  }
  if(signupLink2.length === 0) {
    $('#signupLink2')[0].checked = false;
    $('#signupLink2')[0].disabled = true;
  }
}

function addEmailToList(list, email) {
  if(list.includes(email)) {
    return false;
  }
  list.push(email);
  return true;
}

function dragEnter(e) {
  e.stopPropagation();
  e.preventDefault();
  $(this).css('border', '2px solid #0B85A1');
}

function dragOver(e) {
  e.stopPropagation();
  e.preventDefault();
}

function processNewEmails(emails, id) {
  let roleId = $('#editEmailId').val();
  if(id !== undefined) {
    roleId = id;
  }
  let tableData = Tabulator.findTable('#roles')[0].getData();
  let roleData = null;
  for(let row of tableData) {
    if(row.short_name === roleId) {
      roleData = row;
      break;
    }
  }
  if(roleData === null) {
    alert('Unable to locate data! Try again!');
    return;
  }
  let oldEmails = [];
  if(roleData.requirements !== undefined && roleData.requirements.email_list !== undefined) {
    oldEmails = roleData.requirements.email_list.split(',');
  }
  let duplicates = [];
  for(let email of emails) {
    email = email.trim();
    if(email.length === 0) {
      continue;
    }
    if(addEmailToList(oldEmails, email) === false) {
      duplicates.push(email);
    }
  }
  let alerts = [{type:'warning', 'text':'Any added emails have not been saved yet. Please click save before leaving the page.'}];
  if(duplicates.length > 0) {
    alerts.push({type:'warning', 'text':'Duplicate emails have been automatically discarded. '+duplicates.join(',')});
  }
  $('#editEmail').modal('hide');
  showDialog(oldEmails, roleId, alerts);
}

function processResults(txt) {
  let data = Papa.parse(txt);
  let emails = [];
  if(data.data.length === 0) {
    alert('Unable to parse data. Must be in text format or csv!');
    return;
  }
  if(!data.data[0][0].includes('@')) {
    //This is maybe a CSV with headers?
    data = Papa.parse(txt, {header: true});
    let values = [];
    for(let field of data.meta.fields) {
      values.push({value: field, text: field});
    }
    bootbox.prompt({
      title: 'This looks like a CSV file. Which column contains the email addresses?',
      inputType: 'select',
      inputOptions: values,
      callback: function(result) {
        for(let emailArr of data.data) {
          emails.push(emailArr[`${result}`]);
        }
        processNewEmails(emails);
      }
    });
    return;
  } 
  for(let emailArr of data.data) {
    emails.push(emailArr[0]);
  }  
  processNewEmails(emails);
}

function fileRead(e) {
  processResults(e.target.result);
}

function dropIn(e) {
  $(this).css('border', '2px dotted #0B85A1');
  e.preventDefault();
  let files = e.originalEvent.dataTransfer.files;
  for(let file of files) {
    let reader = new FileReader();
    reader.onload = fileRead;
    reader.readAsText(file);
  }
}

function showDialog(emails, roleId, extraAlerts) {
  fetch('/fvs/api/v1/google/loginStatus').then((response) => {
    response.json().then((data) => {
      if(data.loggedIn) {
        showDialog2(emails, roleId, extraAlerts, true);
        return;
      }
      showDialog2(emails, roleId, extraAlerts, false);
    });
  });
}

function createTableForDialog(results) {
  let dialogTable = $('<table style="width: 100%;">');
  dialogTable.append('<tr><th></th><th>Email</th><th>Status</th><th>Name</th><th>Actions</th></tr>');
  let misCasedEmail = false;
  let duplicateEmails = false;
  let newEmails = [];
  for(let result of results) {
    result = result.value;
    if(result.email.length === 0) {
      continue;
    }
    let statusStr = 'Unknown Email';
    let statusColor = 'red';
    let name = '';
    let row = $('<tr>');
    let select = null;
    let text = '';
    switch(result.status) {
      case 0:
        statusStr = 'Good';
        statusColor = 'green';
        name = getNameForUser(result.value[0]);
        if(addEmailToList(newEmails, result.email) === false) {
          duplicateEmails = true;
        }
        break;
      case 1:
        misCasedEmail = true;
        statusStr = 'Miscased';
        statusColor = 'yellow';
        name = getNameForUser(result.value[0]);
        if(addEmailToList(newEmails, result.email) === false) {
          duplicateEmails = true;
        }
        text = '<i>Auto Fix Email Casing</i>';
        break;
      case 3:
        statusStr = 'Has Profile';
        statusColor = 'yellow';
        text = '<i>This user has a Flipside Profile but has never signed in to the volunteer system.</i>';
        if(addEmailToList(newEmails, result.email) === false) {
          duplicateEmails = true;
        }
        break;
      default:
        if(addEmailToList(newEmails, result.email) === false) {
          duplicateEmails = true;
        }
        break;
    }
    let controlCell = $('<td>');
    let removeButton = $('<button class="btn btn-link">');
    removeButton.html('<i class="fas fa-times"></i>').prop('title', 'Remove User from Role');
    controlCell.append(removeButton);
    let myEmail = result.email;
    let thisRow = row;
    removeButton.click(() => {
      newEmails.splice(newEmails.indexOf(myEmail), 1);
      thisRow.remove();
    });
    let emailCell = $('<td>').text(result.email);
    let statusCell = $('<td>').css('background-color', statusColor).text(statusStr);
    let nameCell = $('<td>').text(name);
    let actionCell = $('<td>');
    if(select === null) {
      actionCell.append(text);
    } else {
      actionCell.append(select);
    }
    row.append(controlCell).append(emailCell).append(statusCell).append(nameCell).append(actionCell);
    dialogTable.append(row);
  }
  return {table: dialogTable, misCasedEmail: misCasedEmail, duplicateEmails: duplicateEmails, newEmails: newEmails};
}

function showDialog2(emails, roleId, extraAlerts, googleLoggedIn) {
  let promises = [];
  for(let email of emails) {
    email = email.trim();
    if(email.length === 0) {
      continue;
    }
    promises.push(getParticipantByEmail(email));
  }
  if(promises.length === 0) {
    promises.push(Promise.resolve({email: '', value: [], status: 2}));
  }
  let settled = Promise.allSettled(promises);
  settled.then((results) => {
    let notFound = [];
    for(let result of results) {
      if(result.status === 'rejected' || result.value.email === '') {
        continue;
      }
      if(result.value.status === 2) {
        notFound.push(result.value.email);
      }
    }
    if(notFound.length === 0) {
      return;
    }
    console.log(notFound);
  });
  return new Promise((resolve) => {
    Promise.allSettled(promises).then((results) => {
      let res = createTableForDialog(results);
      let dialogTable = res.table;
      /*
      let newEmails = [];
      let status = {};
      let misCasedEmail = false;
      let duplicateEmails = false;
      let dialogTable = $('<table style="width: 100%;">');
      dialogTable.append('<tr><th>Email</th><th>Status</th><th>Name</th><th>Action</th></tr>');
      for(let result of results) {
        result = result.value;
        let statusStr = 'Unknown Email';
        let statusColor = 'red';
        let name = '';
        let row = $('<tr>');
        let select = $('<select>');
        let cell = $('<td>');
        switch(result.status) {
          case 0:
            statusStr = 'Good';
            statusColor = 'green';
            name = getNameForUser(result.value[0]);
            if(addEmailToList(newEmails, result.email) === false) {
              duplicateEmails = true;
            }
            select.append('<option value="none" selected>None</option>');
            select.append('<option value="delete">Remove User from Role</option>');
            select.change((e) => {
              switch(e.currentTarget.value) {
                case 'none':
                  addEmailToList(newEmails, result.email);
                  break;
                case 'delete':
                  newEmails.splice(newEmails.indexOf(result.email), 1);
                  console.log(newEmails);
                  break;
              }
            });
            row.append('<td>'+result.email+'</td><td style="background-color:'+statusColor+';">'+statusStr+'</td><td>'+name+'</td>');
            cell.append(select);
            row.append(cell);
            dialogTable.append(row);
            status[`${result.email}`] = 0;
            break;
          case 1:
            misCasedEmail = true;
            statusStr = 'Miscased';
            statusColor = 'yellow';
            name = getNameForUser(result.value[0]);
            if(addEmailToList(newEmails, result.value[0].email) === false) {
              duplicateEmails = true;
            }
            dialogTable.append('<tr><td>'+result.email+'</td><td style="background-color:'+statusColor+';">'+statusStr+'</td><td>'+name+'</td><td><i>Auto Fix Email Casing</i></td></tr>');
            status[`${result.email}`] = 1;
            break;
          case 3:
            statusStr = 'Has Profile';
            statusColor = 'yellow';
            if(addEmailToList(newEmails, result.email) === false) {
              duplicateEmails = true;
            }
            dialogTable.append('<tr><td>'+result.email+'</td><td style="background-color:'+statusColor+';">'+statusStr+'</td><td>'+name+'</td><td><i>This user has a Flipside Profile but has never signed in to the volunteer system.</i></td></tr>');
            status[`${result.email}`] = 3;
            break;
          default:
            if(addEmailToList(newEmails, result.email) === false) {
              duplicateEmails = true;
            }
            select.append('<option value="none" selected>Wait for user to sign up for an account</option>');
            select.append('<option value="delete">Remove User from Role</option>');
            select.change((e) => {
              switch(e.currentTarget.value) {
                case 'none':
                  addEmailToList(newEmails, result.email);
                  break;
                case 'delete':
                  newEmails.splice(newEmails.indexOf(result.email), 1);
                  console.log(newEmails);
                  break;
              }
            });
            row.append('<td>'+result.email+'</td><td style="background-color:'+statusColor+';">'+statusStr+'</td><td>'+name+'</td>');
            cell.append(select);
            row.append(cell);
            dialogTable.append(row);
            status[`${result.email}`] = result.status;
            break;
        }
      }*/
      let alerts = [{type: 'info', text: 'You can drop a file containing a list of emails into this dialog to add more users in bulk.'}, ...extraAlerts];
      if(res.misCasedEmail) {
        alerts.push({type: 'warning', text: 'You have at least one email whose case does not match the system. Hitting save will fix this.'});
      }
      if(res.duplicateEmails) {
        alerts.push({type: 'warning', text: 'You have at least one duplicate email address. Hitting save will fix this.'});
      }
      let dialogOptions = {
        id: 'editEmail',
        title: 'Edit Restricted Email List',
        data: {roleId: roleId, emailList: res.newEmails, emailStatus: status},
        alerts: alerts,
        inputs: [
          {type: 'hidden', id: 'editEmailId', value: roleId},
          {type: 'html', text: dialogTable},
          {label: 'Add User From System', type: 'text', id: 'addUser', keyUp: searchUsers}
        ],
        buttons: [
          {text: 'Save', callback: saveEmailEdits},
          {text: 'Email', callback: emailRoleCapable},
        ]
      };
      if(googleLoggedIn) {
        dialogOptions.buttons.push({text: '<i class="fab fa-google-drive"></i> Import Emails from Google Sheet', callback: importFromGoogle});
      }
      flipDialog.dialog(dialogOptions).then(() => {
        resolve();
      });
      $('.modal.show .modal-content').on('dragenter', dragEnter);
      $('.modal.show .modal-content').on('dragover', dragOver);
      $('.modal.show .modal-content').on('drop', dropIn);
    });
  });
}

function editEmails(e, cell) {
  let data = cell.getRow().getData();
  let emails = [];
  if(data.requirements !== undefined && data.requirements.email_list !== undefined) {
    emails = data.requirements.email_list.split(',');
  }
  showDialog(emails, data.short_name, []);
}

function initPage() {
  deptId = getParameterByName('dept');
  let tableURL = '';
  if(deptId !== null) {
    $.ajax({
      url: '../api/v1/departments/'+deptId,
      complete: gotDept
    });
    tableURL = '../api/v1/departments/'+deptId+'/roles';
    $('#grouped_with').select2({width: '100%'});
    $.ajax({
      url: tableURL,
      complete: gotRoles
    });
  } else {
    $('#deptName').html('All');
    tableURL = '../api/v1/roles';
    $('#newRoleBtn').attr('disabled', true).attr('title', 'Adding a new role is disabled except on the individual department pages');
    $.ajax({
      url: '../api/v1/departments',
      complete: gotDeptList
    });
    $('#deptFilter').change(deptFilterChanged);
  }
  $.ajax({
    url: '../api/v1/certs',
    complete: gotCerts,
    context: tableURL
  });
}

function gotCerts(jqXHR) {
  if(jqXHR.status !== 200) {
    if(jqXHR.status === 401) {
      //User is probably not logged in just silently fail...
      return;
    }
    console.log(jqXHR);
    alert('Failed to get certs!');
    return;
  }
  var cols = [
    {formatter: delIcon, width:40, hozAlign: 'center', cellClick: delRole},
    {formatter: emailIcon, width:40, hozAlign: 'center', cellClick: editEmails},
    {title: 'ID', field: '_id.$id', visible: false},
    {title: 'Short Name', field: 'short_name', visible: false},
    {title: 'Name', field: 'display_name', editor: 'input'},
    {title: 'Description', field: 'description', editor: 'textarea', formatter: 'html', width: 250, tooltip: true},
    {title: 'Public', field: 'publicly_visible', editor: 'tickCross', formatter: 'tickCross'},
    {title: 'Groups', field: 'groups_allowed', editor: 'tickCross', formatter: 'tickCross'},
    {title: 'Can be grouped with', field: 'grouped_with', editor: groupedWithEditor, formatter: groupFormatter},
    {title: 'Hours between shifts', field: 'down_time', editor: 'number'},
    {title: 'Restricted To Emails', field: 'requirements.email_list', editor: 'textarea', formatter: 'html', width: 250}
  ];
  var data = jqXHR.responseJSON;
  for(let cert of data) {
    cols.push({title:'Needs '+cert.name, field: 'requirements.'+cert.certID, editor: 'tickCross', formatter: 'tickCross'});
  }
  table = new Tabulator('#roles', {
    ajaxURL: this,
    ajaxResponse: function(url, params, response) {
      return response.filter(function(element) {
        return element.isAdmin && !element.retired;
      });
    },
    columns: cols
  });
  table.on('cellEdited', dataChanged);
  table.on('tableBuilt', () => {
    table.setData();
  });
}

window.onload = initPage;
/* vim: set tabstop=2 shiftwidth=2 expandtab: */
