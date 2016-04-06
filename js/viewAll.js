function getDepartmentsDone(jqXHR)
{
    if(jqXHR.status !== 200 || jqXHR.responseJSON === undefined)
    {
        alert('Unable to obtain departments!');
        return;
    }
    var div = $('#departments');
    var data = jqXHR.responseJSON;
    for(var i = 0; i < data.length; i++)
    {
         div.prepend('<a href="viewDept.php?id='+data[i].departmentID+'" class="list-group-item">'+data[i].departmentName+'<span class="label label-success pull-right">0</span><span class="label label-danger pull-right">0</span></a>');
    }
}

function initPage()
{
    $.ajax({
        url: 'api/v1/departments',
        type: 'GET',
        dataType: 'json',
        complete: getDepartmentsDone});
}

$(initPage);
