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

function showCertPresent(cell) {
  let value = cell.getValue();
  const tick = '<svg enable-background="new 0 0 24 24" height="14" width="14" viewBox="0 0 24 24" xml:space="preserve" ><path fill="#2DC214" clip-rule="evenodd" d="M21.652,3.211c-0.293-0.295-0.77-0.295-1.061,0L9.41,14.34  c-0.293,0.297-0.771,0.297-1.062,0L3.449,9.351C3.304,9.203,3.114,9.13,2.923,9.129C2.73,9.128,2.534,9.201,2.387,9.351  l-2.165,1.946C0.078,11.445,0,11.63,0,11.823c0,0.194,0.078,0.397,0.223,0.544l4.94,5.184c0.292,0.296,0.771,0.776,1.062,1.07  l2.124,2.141c0.292,0.293,0.769,0.293,1.062,0l14.366-14.34c0.293-0.294,0.293-0.777,0-1.071L21.652,3.211z" fill-rule="evenodd"/></svg>';
  const cross = '<svg enable-background="new 0 0 24 24" height="14" width="14"  viewBox="0 0 24 24" xml:space="preserve" ><path fill="#CE1515" d="M22.245,4.015c0.313,0.313,0.313,0.826,0,1.139l-6.276,6.27c-0.313,0.312-0.313,0.826,0,1.14l6.273,6.272  c0.313,0.313,0.313,0.826,0,1.14l-2.285,2.277c-0.314,0.312-0.828,0.312-1.142,0l-6.271-6.271c-0.313-0.313-0.828-0.313-1.141,0  l-6.276,6.267c-0.313,0.313-0.828,0.313-1.141,0l-2.282-2.28c-0.313-0.313-0.313-0.826,0-1.14l6.278-6.269  c0.313-0.312,0.313-0.826,0-1.14L1.709,5.147c-0.314-0.313-0.314-0.827,0-1.14l2.284-2.278C4.308,1.417,4.821,1.417,5.135,1.73  L11.405,8c0.314,0.314,0.828,0.314,1.141,0.001l6.276-6.267c0.312-0.312,0.826-0.312,1.141,0L22.245,4.015z"/></svg>';
  if(value === undefined) {
    return cross;
  }
  return tick;
}

function getParticipantLink(cell) {
  return 'vol.php?id='+encodeURIComponent(cell.getValue());
}

function initPage() {
  const tShirts = {
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
  let tableElem = document.getElementById('vols');
  let parent = tableElem.parentElement;
  let table = new Tabulator('#vols', {
    ajaxURL: '../api/v1/participants?$select=uid,email,firstName,lastName,burnerName,shirtSize,critVol,certs.ics100.status,certs.ics200.status,certs.bls.status',
    pagination: true,
    paginationSize: 25,
    columns:[
      {title:'User ID', field: 'uid', formatter: 'link', formatterParams:{url: getParticipantLink}, visible: true},
      {title:'Email', field: 'email', formatter: 'link', formatterParams:{urlPrefix:'mailto:'}},
      {title:'First Name', field: 'firstName'},
      {title:'Last Name', field: 'lastName'},
      {title:'Burner Name', field: 'burnerName'},
      {title:'T-Shirt Size', field: 'shirtSize', editor: 'list', formatter: 'lookup', editorParams: {values: tShirts}, formatterParams: tShirts},
      {title:'Critical Volunteer', field: 'critVol', editor: 'tickCross', formatter: 'tickCross'},
      {title:'ICS 100', field: 'certs.ics100', formatter: showCertPresent},
      {title:'ICS 200', field: 'certs.ics200', formatter: showCertPresent}
    ],
    cellEdited: dataChanged,
    initialSort:[
      {column: 'uid', dir: 'asc'}
    ]
  });
  table.on('tableBuilt', () => {
    table.setData();
  });
  let node = document.createElement('div');
  node.style.float = 'right';
  node.style.textAlign = 'right';
  node.className = 'col-sm-12';
  node.innerText = 'Search:';
  let search = document.createElement('input');
  search.type = 'text';
  search.style.border = '1px solid #aaa';
  search.style.borderRadius = '5px';
  search.style.padding = '2px';
  node.appendChild(search);
  parent.insertBefore(node, tableElem);
  search.addEventListener('input', ()=> {
    table.clearFilter();
    if(search.value !== '') {
      table.setFilter((data) => {
        let inputData = search.value.toLowerCase();
        let uid = data.uid.toLowerCase().includes(inputData);
        let email = data.email.toLowerCase().includes(inputData);
        let first = data.firstName === undefined ? false : data.firstName.toLowerCase().includes(inputData);
        let last = data.lastName === undefined ? false : data.lastName.toLowerCase().includes(inputData);
        let burner = data.burnerName.toLowerCase().includes(inputData);
        return uid || email || first || last || burner;
      });
    }
  });
}

window.onload = initPage;
