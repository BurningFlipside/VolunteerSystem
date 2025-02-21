/* global $*/

function dataChanged() {
  //Get base (parent directory) from current site
  let base = location.href.substring(0, location.href.lastIndexOf('/'));
  base = base.substring(0, base.lastIndexOf('/')+1);
  let event = document.getElementById('event').value;
  let linkBox = document.getElementById('link');
  if(event === null || event === '') {
    linkBox.value = base;
    return;
  }
  base += '?event='+event;
  let dept = document.getElementById('dept').value;
  if(dept === null || dept === '') {
    linkBox.value = base;
    return;
  }
  base += '&department='+dept;
  let role = $('#role').val();
  if(role === null) {
    $('#link').val(base);
    return;
  }
  base += '&role='+role;
  $('#link').val(base);
}

function deptChanged(e) {
  $('#role').select2('destroy');
  $('#role').select2({
    ajax: {
      url: '../api/v1/departments/'+e.target.value+'/roles',
      processResults: function(data) {
        var res = [];
        data.sort((a,b) => {
          return a.display_name.localeCompare(b.display_name);
        });
        for(let role of data) {
          res.push({id: role.short_name, text: role.display_name});
        }
        return {results: res};
      } 
    }
  });
  dataChanged();
}

function initPage() {
  fetch('../api/v1/events').then((response) => {
    if(response.httpStatusCode === 401) {
      return;
    }
    response.json().then((data) => {
      let eventSelect = document.getElementById('event');
      data = data.filter((event) => {
        return event.available;
      });
      data.sort((a, b) => {
        let aStart = new Date(a.startTime);
        let bStart = new Date(b.startTime);
        return aStart - bStart;
      });
      eventSelect.add(new Option(''));
      for(let event of data) {
        let opt = new Option(event.name, event['_id']['$oid']);
        if(event.alias !== undefined && event.alias !== '') {
          opt.value = event.alias;
        }
        eventSelect.add(opt);
      }
      eventSelect.addEventListener('change', dataChanged);
    });
  });
  fetch('../api/v1/departments').then((response) => {
    if(response.httpStatusCode === 401) {
      return;
    }
    response.json().then((data) => {
      let deptSelect = document.getElementById('dept');
      data = data.filter((department) => {
        return department.isAdmin;
      });
      data.sort((a, b) => {
        return a.departmentName.localeCompare(b.departmentName);
      });
      for(let dept of data) {
        if(dept.isAdmin) {
          let opt = new Option(dept.departmentName, dept.departmentID);
          deptSelect.add(opt);
        }
      }
      deptSelect.addEventListener('change', deptChanged);
    });
  });
  $('#role').select2();
  $('#role').change(dataChanged);
  dataChanged();
}

window.onload = initPage;