var deptData = null;

function getRoleDone(jqXHR)
{
    if(jqXHR.status !== 200 || jqXHR.responseJSON === undefined)
    {
        alert('Unable to obtain roles!');
        return;
    }
    console.log(jqXHR);
}

function getDepartmentDone(jqXHR)
{
    if(jqXHR.status !== 200 || jqXHR.responseJSON === undefined)
    {
        alert('Unable to obtain department!');
        return;
    }
    var data = jqXHR.responseJSON;
    deptData = data[0];
    $('#departmentNameRO').append(deptData.departmentName);
    $('#departmentName').val(deptData.departmentName);
    if(deptData.description !== undefined)
    {
        $('#description').val(deptData.description);
    }
    if(deptData.public)
    {
        $('#public').prop('checked', true);
        $('#privateDept').hide();
    }
    $.ajax({
        url: 'api/v1/departments/'+deptData.departmentID+'/roles',
        type: 'GET',
        dataType: 'json',
        complete: getRoleDone});
}

function publicChanged()
{
    if($('#public').prop('checked'))
    {
        $('#privateDept').hide();
    }
    else
    {
        $('#privateDept').show();
    }
}

function viewShifts()
{
    window.location = 'shifts.php?id='+deptData.departmentID;
    return false;
}

function initPage()
{
    var id = getParameterByName('id');
    if(id === null)
    {
        $.ajax({
            url: 'api/v1/departments?$top=1',
            type: 'GET',
            dataType: 'json',
            complete: getDepartmentDone});
    }
    else
    {
        $.ajax({
            url: 'api/v1/departments/'+id,
            type: 'GET',
            dataType: 'json',
            complete: getDepartmentDone});
    }
}

$(initPage);
