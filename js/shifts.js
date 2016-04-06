function getDepartmentDone(jqXHR)
{
    if(jqXHR.status !== 200 || jqXHR.responseJSON === undefined)
    {
        alert('Unable to obtain departments!');
        return;
    }
    var data = jqXHR.responseJSON; 
    var list = $('#departmentName');
    for(var i = 0; i < data.length; i++)
    {
        list.append('<option value="'+data[i].departmentID+'">'+data[i].departmentName+'</option>');
    }
    if(data.length === 1)
    {
        list.attr('disabled', true);
    }
}

function addNewShift()
{
    $('#roles').empty();
    $('#addShiftModal').modal('show');
}

function polyfillerLoaded()
{
    webshim.setOptions('basePath', '/js/common/js-webshim/minified/shims/'); 
    webshim.polyfill();
}

function initPage()
{
    $('#addShiftModal').modal({show: false});
    $.ajax({
            url: 'api/v1/departments?$filter=lead eq me',
            type: 'GET',
            dataType: 'json',
            complete: getDepartmentDone});
    if(!browser_supports_input_type('datetime-local'))
    {
        $.getScript('/js/common/js-webshim/minified/polyfiller.js', polyfillerLoaded);
    }
}

$(initPage);
