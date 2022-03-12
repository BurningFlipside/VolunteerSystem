/* global $, bootbox, Tabulator*/
/* exported newDepartment */
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
  alert('Unable to add department!');
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
  $.ajax({
    url: '../api/v1/departments/'+id,
    method: 'PATCH',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    dataType: 'json',
    complete: editDone
  });
}

function dataChanged(cell) {
  valueChanged(cell.getValue(), cell.getColumn().getField(), cell.getRow().getData()['departmentID']);
}

function leadDropDown() {
  var values = {};
  var cache = window.localStorage.getItem('FlipsideLeadCache');
  if(cache === undefined || !cache || cache === 'undefined') {
    return false;
  }
  var leads = JSON.parse(cache);
  for(let lead of leads) {
    values[lead.short_name] = lead.name;
  }
  return {values:values};
}

function areaDropDown() {
  var values = {};
  var cache = window.localStorage.getItem('FlipsideAreaCache');
  if(cache === undefined || !cache || cache === 'undefined') {
    return false;
  }
  var areas = JSON.parse(cache);
  for(let area of areas) {
    values[area.short_name] = area.name;
  }
  return {values:values};
}

function areaDisplay(cell) {
  var value = cell.getValue();
  var cache = window.localStorage.getItem('FlipsideAreaCache');
  if(cache === undefined || !cache || cache === 'undefined') {
    return value;
  }
  var areas = JSON.parse(cache);
  for(let area of areas) {
    if(area.short_name === value) {
      return area.name;
    }
  }
  return value;
}

function saveLeads(jqXHR) {
  window.localStorage.setItem('FlipsideLeadCache', jqXHR.responseText);
}

function saveAreas(jqXHR) {
  window.localStorage.setItem('FlipsideAreaCache', jqXHR.responseText);
}

function refreshCache() {
  $.ajax({
    url: 'https://profiles.burningflipside.com/api/v1/areas/*/leads',
    xhrFields: {withCredentials: true},
    complete: saveLeads
  });
  $.ajax({
    url: 'https://profiles.burningflipside.com/api/v1/areas',
    xhrFields: {withCredentials: true},
    complete: saveAreas
  });
}

function newDepartment() {
  bootbox.prompt("Please enter the new department's ID", function(result) {
    if(result === null) {
      return;
    }
    result = result.replace(/\s/g, '_');
    var obj = {departmentID: result};
    $.ajax({
      url: '../api/v1/departments/',
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
    alert('Unable to delete department!');
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
    bootbox.alert('This department has one or more roles. The roles must be deleted first!');
    return;
  }
  var data = this;
  bootbox.confirm({
    message: 'Are you sure you want to delete the department "'+this.departmentName+'"?',
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
          url: '../api/v1/departments/'+data.departmentID,
          method: 'DELETE',
          complete: deleteDone
        });
      }
    }
  });
}

function delDepartment(e, cell) {
  var data = cell.getRow().getData();
  $.ajax({
    url: '../api/v1/roles?$filter=departmentID eq '+data.departmentID,
    context: data,
    complete: gotRolesBeforeDelete
  });
}

function initPage() {
  var cache = window.localStorage.getItem('FlipsideLeadCache');
  var cache2 = window.localStorage.getItem('FlipsideAreaCache');
  if(!cache || cache === 'undefined' || !cache2 || cache2 === 'undefined') {
    refreshCache();
  }
  new Tabulator('#depts', {
    ajaxURL: '../api/v1/departments',
    ajaxResponse: function(url, params, response) {
      return response.filter(function(element) {
        return element.isAdmin;
      });
    },
    columns:[
      {formatter: delIcon, width:40, hozAlign: 'center', cellClick: delDepartment},
      {title: 'ID', field: '_id.$id', visible: false},
      {title: 'Department ID', field: 'departmentID', formatter: 'link', formatterParams:{urlPrefix:'roles.php?dept='}},
      {title: 'Name', field: 'departmentName', editor: 'input'},
      {title: 'Public', field: 'public', editor: 'tickCross', formatter: 'tickCross'},
      {title: 'Lead', field: 'lead', editor:'select', editorParams: leadDropDown},
      {title: 'Area', field: 'area', editor:'select', editorParams: areaDropDown, formatter: areaDisplay, sorter: 'alphanum'},
      {title: 'Other Admins', field: 'others', editor:'input'}
    ],
    cellEdited: dataChanged,
    initialSort:[
      {column: 'departmentName', dir: 'asc'},
      {column: 'area', dir: 'asc'}
    ]
  });
}

$(initPage);
