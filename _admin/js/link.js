/* global $*/

function dataChanged() {
  //TODO get base from current site
  let base = 'https://secure.burningflipside.com/fvs/';
  let event = $('#event').val();
  if(event === null) {
    $('#link').val(base);
    return;
  }
  base += '?event='+event;
  let dept = $('#dept').val();
  if(dept === null) {
    $('#link').val(base);
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
  $('#event').select2({
    ajax: {
      url: '../api/v1/events',
      processResults: function(data) {
        var res = [];
        data.sort((a,b) => {
          return a.name.localeCompare(b.name);
        });
        for(let event of data) {
          if(event.available) {
            if(event.alias !== undefined && event.alias !== '') {
              res.push({id: event.alias, text: event.name});
            } else {
              res.push({id: event['_id']['$oid'], text: event.name});
            }
          }
        }
        return {results: res};
      }
    }
  });
  $('#dept').select2({
    ajax: {
      url: '../api/v1/departments',
      processResults: function(data) {
        var res = [];
        data.sort((a,b) => {
          return a.departmentName.localeCompare(b.departmentName);
        });
        for(let dept of data) {
          if(dept.isAdmin) {
            res.push({id: dept.departmentID, text: dept.departmentName});
          }
        }
        return {results: res};
      }
    }
  });
  $('#role').select2();
  $('#event').change(dataChanged);
  $('#dept').change(deptChanged);
  $('#role').change(dataChanged);
  dataChanged();
}

$(initPage);