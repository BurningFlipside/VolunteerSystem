function generatePDF(e) {
  var type = e.target.id;
  console.log(type);
  var event = $('#event').val();
  if(event === null) {
    bootbox.alert('Please select event first!');
    return;
  }
  var dept = $('#department').val();
  if(dept === null) {
    bootbox.alert('Please select department first!');
    return;
  }
  location.href = '../api/v1/departments/'+dept+'/shifts/Actions/GenerateShiftSchedule?type='+type+'&eventID='+event;
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
        for(var i = 0; i < data.length; i++) {
          res.push({id: data[i]['_id']['$oid'], text: data[i].name});
        }
        return {results: res};
      }
    }
  });
  $('#department').select2({
    ajax: {
      url: '../api/v1/departments',
      processResults: function(data) {
        var res = [];
        data.sort((a,b) => {
          return a.departmentName.localeCompare(b.departmentName);
        });
        for(var i = 0; i < data.length; i++) {
          if(data[i].isAdmin) {
            res.push({id: data[i].departmentID, text: data[i].departmentName});
          }
        }
        return {results: res};
      }
    }
  });
  $('#simplePDF').click(generatePDF);
  $('#gridXLSX').click(generatePDF);
  $('#gridPDF').click(generatePDF);
}

$(initPage);
