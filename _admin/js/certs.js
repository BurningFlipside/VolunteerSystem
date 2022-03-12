/* global $, bootbox, Tabulator*/
/* exported newCert*/
function editDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to edit value!');
    return;
  }
}

function addDone(jqXHR) {
  if(jqXHR.status === 200) {
    location.reload();
    return;
  }
  alert('Unable to add cert!');
  console.log(jqXHR);
}

function valueChanged(value, field, id) {
  var propParts = field.split('.');
  var obj = {};
  var current = obj;
  for(var i = 0; i < propParts.length-1; i++) {
    current = current[`${propParts[i]}`] = {}; // eslint-disable-line security/detect-object-injection
  }
  current[propParts[propParts.length-1]] = value;
  console.log(obj);
  $.ajax({
    url: '../api/v1/certs/'+id,
    method: 'PATCH',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    dataType: 'json',
    complete: editDone
  });
}

function dataChanged(cell) {
  valueChanged(cell.getValue(), cell.getColumn().getField(), cell.getRow().getData()['certID']);
}

function newCert() {
  bootbox.prompt("Please enter the new certification's ID", function(result) {
    if(result === null) {
      return;
    }
    result = result.replace(/\s/g, '_');
    var obj = {certID: result};
    $.ajax({
      url: '../api/v1/certs/',
      method: 'POST',
      data: JSON.stringify(obj),
      contentType: 'application/json',
      dataType: 'json',
      complete: addDone
    });
  });
}

function deleteDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to delete cert!');
    return;
  }
  location.reload();
}

function delIcon() {
  return "<i class='fa fa-trash'></i>";
}

function gotRolesBeforeDelete(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to obtain roles!');
    return;
  }
  var roles = jqXHR.responseJSON;
  if(roles.length > 0) {
    bootbox.alert('This certification is used by one or more roles. The roles must be changed or deleted first!');
    return;
  }
  var data = this;
  bootbox.confirm({
    message: 'Are you sure you want to delete the role "'+this.name+'"?',
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
          url: '../api/v1/certs/'+data.certID,
          method: 'DELETE',
          complete: deleteDone
        });
      }
    }
  });
}

function delCert(e, cell) {
  var data = cell.getRow().getData();
  $.ajax({
    url: '../api/v1/roles?$filter=requirements.'+data.certID+' eq true',
    context: data,
    complete: gotRolesBeforeDelete
  });
}

function validDisplay(cell) {
  var val = cell.getValue();
  if(val === undefined) {
    return '';
  }
  return val+' years';
}

function initPage() {
  new Tabulator('#certs', {
    ajaxURL: '../api/v1/certs',
    columns:[
      {formatter: delIcon, width:40, align: 'center', cellClick: delCert},
      {title: 'ID', field: '_id.$id', visible: false},
      {title: 'Cert ID', field: 'certID'},
      {title: 'Name', field: 'name', editor: 'input'},
      {title: 'Expires', field: 'expires', editor: 'tickCross', formatter: 'tickCross'},
      {title: 'Validated By', field: 'validatedBy', editor:'select', editorParams: {values: ['lead', 'admin']}},
      {title: 'Valid For', field: 'validFor', editor: 'number', editorParams: {min: 0}, formatter: validDisplay},
      {title: 'Link', field: 'link', editor: 'input'}
    ],
    cellEdited: dataChanged,
    initialSort:[
      {column: 'name', dir: 'asc'}
    ]
  });
}

$(initPage);
