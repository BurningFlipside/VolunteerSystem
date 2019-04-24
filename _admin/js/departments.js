var table;

function editDone(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to edit value!');
  }
  console.log(jqXHR);
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
  console.log('../api/v1/departments/'+id);
  var propParts = field.split('.');
  var obj = {};
  var current = obj;
  for(var i = 0; i < propParts.length-1; i++) {
    current = current[propParts[i]] = {};
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

function leadDropDown(cell) {
  var values = {};
  var cache = window.localStorage.getItem('FlipsideLeadCache');
  if(!cache) {
    return false;
  }
  var leads = JSON.parse(cache);
  for(var i = 0; i < leads.length; i++) {
    values[leads[i].short_name] = leads[i].name;
  }
  return {values:values};
}

function saveLeads(jqXHR) {
   window.localStorage.setItem('FlipsideLeadCache', jqXHR.responseText);
}

function refreshCache() {
  $.ajax({
    url: 'https://profiles.burningflipside.com/api/v1/areas/*/leads',
    xhrFields: {withCredentials: true},
    complete: saveLeads
  });
}

function newDepartment() {
  bootbox.prompt("Please enter the new department's ID", function(result){
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

function initPage() {
  var cache = window.localStorage.getItem('FlipsideLeadCache');
  if(!cache) {
    refreshCache();
  }
  table = new Tabulator("#depts", {
    ajaxURL: '../api/v1/departments',
    columns:[
      {title:"ID", field:"_id.$id", visible: false},
      {title:"Department ID", field: 'departmentID', formatter:"link", formatterParams:{urlPrefix:'roles.php?dept='}},
      {title:'Name', field: 'departmentName', editor:"input"},
      {title:'Public', field: 'public', editor: 'tickCross', formatter: 'tickCross'},
      {title:'Lead', field: 'lead', editor:'select', editorParams: leadDropDown},
      {title:'Other Admins', field: 'others', editor:'input'}
    ],
    cellEdited: dataChanged
  });
}

$(initPage);
