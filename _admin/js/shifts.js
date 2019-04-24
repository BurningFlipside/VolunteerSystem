function addNewShift(elem) {
  var href = elem.getAttribute("href");
  href = href.substring(1);
  console.log(href);
  return false;
}

function gotShifts(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to obtain shifts');
    console.log(jqXHR);
    return;
  }
}

function gotDepartments(jqXHR) {
  if(jqXHR.status !== 200) {
    alert('Unable to obtain departments');
    console.log(jqXHR);
    return;
  }
  var array = jqXHR.responseJSON;
  var accordian = $('#accordion');
  for(var i = 0; i < array.length; i++) {
    accordian.append('<div class="card"><div class="card-header" id="heading'+array[i].departmentID+'"><h2 class="mb-0"><button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapse'+array[i].departmentID+'" aria-expanded="true" aria-controls="collapse'+array[i].departmentID+'">'+array[i].departmentName+'</button></h2></div><div id="collapse'+array[i].departmentID+'" class="collapse show" aria-labelledby="heading'+array[i].departmentID+'" data-parent="#accordion"><div class="card-body"><div class="list-group"><a href="#'+array[i].departmentID+'" class="list-group-item list-group-item-action" onclick="return addNewShift(this);"><i class="fas fa-plus"></i> Add new shift</a></div></div></div></div>');
  }
  $.ajax({
    url: '../api/v1/shifts',
    complete: gotShifts
  });
}

function initPage() {
  $.ajax({
    url: '../api/v1/departments',
    complete: gotDepartments
  });
}

$(initPage);
