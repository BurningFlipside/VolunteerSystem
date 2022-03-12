/*global $, Tabulator*/
function editDone(jqXHR) {
  if(jqXHR.status !== 200) {
    console.log(jqXHR);
    alert('Unable to edit value!');
    return;
  }
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
    url: '../api/v1/participants/'+id,
    method: 'PATCH',
    data: JSON.stringify(obj),
    contentType: 'application/json',
    dataType: 'json',
    complete: editDone
  });
}

function dataChanged(cell) {
  valueChanged(cell.getValue(), cell.getColumn().getField(), cell.getRow().getData()['uid']);
}

function initPage() {
  var tShirts = {
    'WS': "Women's Small",
    'WM': "Women's Medium",
    'MS': "Men's Small",
    'WL': "Women's Large",
    'MM': "Men's Medium",
    'WXL': "Women's Extra Large",
    'WXXL': "Women's Extra Extra Large",
    'ML': "Men's Large",
    'WXXXL': "Women's Extra Extra Extra Large",
    'MXL': "Men's Extra Large",
    'MXXL': "Men's Extra Extra Large",
    'MXXXL': "Men's Extra Extra Extra Large",
  };
  new Tabulator('#vols', {
    ajaxURL: '../api/v1/participants',
    columns:[
      {title:'User ID', field: 'uid', visible: true},
      {title:'Email', field: 'email', formatter: 'link', formatterParams:{urlPrefix:'mailto:'}},
      {title:'First Name', field: 'firstName'},
      {title:'Last Name', field: 'lastName'},
      {title:'Burner Name', field: 'burnerName'},
      {title:'T-Shirt Size', field: 'shirtSize', editor: 'select', formatter: 'lookup', editorParams: {values: tShirts}, formatterParams: tShirts},
      {title:'Critical Volunteer', field: 'critVol', editor: 'tickCross', formatter: 'tickCross'}      
    ],
    cellEdited: dataChanged,
    initialSort:[
      {column: 'uid', dir: 'asc'}
    ]
  });
}

$(initPage);
