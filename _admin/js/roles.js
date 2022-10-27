/*global $, bootbox, Tabulator, getParameterByName, addOptiontoSelect*/
/* exported groupsAllowedUpdated, newRole, onEmailListUpdated, publiclyVisibleUpdated, roleNameUpdated, showRoleWizard */
var deptId;
var table;

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
  alert('Unable to add department!');
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
  if(shifts.length > 0) {
    bootbox.alert('This role has one or more shifts. The shifts must be deleted first!');
    return;
  }
  var data = this;
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
          url: '../api/v1/roles/'+data.short_name,
          method: 'DELETE',
          complete: deleteDone
        });
      }
    }
  });
}

function delRole(e, cell) {
  var data = cell.getRow().getData();
  $.ajax({
    url: '../api/v1/shifts?$filter=roleID eq '+data.short_name,
    context: data,
    complete: gotShiftsBeforeDelete
  });
}

function gotEmailFailure2(email, resolve) {
  resolve({email: email, value: [], status: 2});
}

function gotEmailSuccess2(value, email, resolve) {
  if(value.length > 0) {
    resolve({email: email, value: value, status: 1});
  }
  gotEmailFailure2(email, resolve);
}

function gotEmailFailure(email, resolve) {
  let intPromise = $.ajax({url: '../api/v1/participants?$filter=substringof(email,\''+email+'\')'});
  intPromise.then((value) => {gotEmailSuccess2(value, email, resolve)}).catch(() => {gotEmailFailure2(email, resolve)});
}

function gotEmailSuccess(value, email, resolve) {
  if(value.length > 0) {
    resolve({email: email, value: value, status: 0});
  }
  gotEmailFailure(email, resolve);
}

function getParticipantByEmail(email) {
  return new Promise((resolve) => {
    let intPromise = $.ajax({url: '../api/v1/participants?$filter=email eq \''+email+'\''});
    intPromise.then((value) => {return gotEmailSuccess(value, email, resolve)}).catch(() => {gotEmailFailure(email, resolve)});
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
  })
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

function processNewEmails(emails) {
  let roleId = $('#editEmailId').val();
  let tableData = Tabulator.prototype.findTable('#roles')[0].getData();
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
    alert.push({type:'warning', 'text':'Duplicate emails have been automatically discarded. '+duplicates.join(',')});
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
      title: "This looks like a CSV file. Which column contains the email addresses?",
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
  } else {
    for(let emailArr of data.data) {
      emails.push(emailArr[0]);
    }  
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
  let promises = [];
  for(let email of emails) {
    email = email.trim();
    promises.push(getParticipantByEmail(email));
  }
  Promise.allSettled(promises).then((results) => {
    let newEmails = [];
    let misCasedEmail = false;
    let duplicateEmails = false;
    let table = $('<table style="width: 100%;">');
    table.append('<tr><th>Email</th><th>Status</th><th>Name</th><th>Action</th></tr>');
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
                let index = newEmails.indexOf(result.email);
                newEmails.splice(index, 1);
                console.log(newEmails);
                break;
            }
          });
          row.append('<td>'+result.email+'</td><td style="background-color:'+statusColor+';">'+statusStr+'</td><td>'+name+'</td>');
          cell.append(select);
          row.append(cell);
          table.append(row);
          break;
        case 1:
          misCasedEmail = true;
          statusStr = 'Miscased';
          statusColor = 'yellow';
          name = getNameForUser(result.value[0]);
          if(addEmailToList(newEmails, result.value[0].email) === false) {
            duplicateEmails = true;
          }
          table.append('<tr><td>'+result.email+'</td><td style="background-color:'+statusColor+';">'+statusStr+'</td><td>'+name+'</td><td><i>Auto Fix Email Casing</i></td></tr>');
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
                let index = newEmails.indexOf(result.email);
                newEmails.splice(index, 1);
                console.log(newEmails);
                break;
            }
          });
          row.append('<td>'+result.email+'</td><td style="background-color:'+statusColor+';">'+statusStr+'</td><td>'+name+'</td>');
          cell.append(select);
          row.append(cell);
          table.append(row);
          break;
      }
    }
    let alerts = [{type: 'info', text: 'You can drop a file containing a list of emails into this dialog to add more users in bulk.'}, ...extraAlerts];
    if(misCasedEmail) {
      alerts.push({type: 'warning', text: 'You have at least one email whose case does not match the system. Hitting save will fix this.'});
    }
    if(duplicateEmails) {
      alerts.push({type: 'warning', text: 'You have at least one duplicate email address. Hitting save will fix this.'});
    }
    let dialogOptions = {
      id: 'editEmail',
      title: 'Edit Restricted Email List',
      data: {roleId: roleId, emailList: newEmails},
      alerts: alerts,
      inputs: [
        {type: 'hidden', id: 'editEmailId', value: roleId},
        {type: 'html', text: table},
        {label: 'Add User From System', type: 'text', id: 'addUser', keyUp: searchUsers}
      ],
      buttons: [
        {text: 'Save', callback: saveEmailEdits}
      ]
    };
    flipDialog.dialog(dialogOptions);
    $('.modal.show .modal-content').on('dragenter', dragEnter);
    $('.modal.show .modal-content').on('dragover', dragOver);
    $('.modal.show .modal-content').on('drop', dropIn);
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
        return element.isAdmin;
      });
    },
    columns: cols,
    cellEdited: dataChanged
  });
}

$(initPage);
/* vim: set tabstop=2 shiftwidth=2 expandtab: */
