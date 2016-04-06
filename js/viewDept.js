var deptData = null;

function getDepartmentDone(jqXHR)
{
    if(jqXHR.status !== 200 || jqXHR.responseJSON === undefined)
    {
        alert('Unable to obtain department!');
        return;
    }
    var data = jqXHR.responseJSON;
    deptData = data;
    $('#departmentNameRO').append(data.departmentName);
    $('#departmentName').val(data.departmentName);
    if(data.description !== undefined)
    {
        $('#description').val(data.description);
    }
    if(data.public)
    {
        $('#public').prop('checked', true);
        $('#privateDept').hide();
    }
    console.log(data);
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
