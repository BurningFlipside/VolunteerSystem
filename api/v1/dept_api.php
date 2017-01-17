<?php

function deptGroup()
{
    global $app;
    $app->get('(/)', 'getDepartmentList');
    $app->post('(/)', 'createDepartment');
    $app->get('/:id(/)', 'getDepartment');
    $app->get('/:id/shifts(/)', 'getShiftsForDepartment');
    $app->get('/:id/roles(/)', 'getRolesForDepartment');
}

function getDepartmentList()
{
    global $app;
    if(!$app->user)
    {
        throw new Exception('Must be logged in', ACCESS_DENIED);
    }
    $dataSet = DataSetFactory::get_data_set('fvs');
    $dataTable = $dataSet['departments'];
    $ret = false;
    if($app->user->isInGroupNamed('VolunteerAdmins'))
    {
        if($app->odata->filter !== false && $app->odata->filter->contains('lead eq me'))
        {
            $app->odata->filter = false;
        }
        $ret = $dataTable->read($app->odata->filter, $app->odata->select, $app->odata->top, $app->odata->skip, $app->odata->orderby);
    }
    else
    {
        if($app->user->isInGroupNamed('Lead'))
        {
            $filter = false;
            if($app->odata->filter !== false && $app->odata->filter->contains('lead eq me'))
            {
                $filter = new \Data\Filter('lead eq '.$app->getUID());
            }
            else
            {
                $filter = new \Data\Filter('lead eq '.$app->getUID().' or public eq true');
            }
            $ret = $dataTable->read($filter, $app->odata->select, $app->odata->top, $app->odata->skip, $app->odata->orderby);
        }
        else
        {
            $filter = new \Data\Filter('public eq true');
            $ret = $dataTable->read($filter, $app->odata->select, $app->odata->top, $app->odata->skip, $app->odata->orderby);
        }
    }
    echo json_encode($ret);
}

function createDepartment()
{
    global $app;
    if(!$app->user)
    {
        throw new Exception('Must be logged in', ACCESS_DENIED);
    }
    else if(!$app->user->isInGroupNamed('VolunteerAdmins'))
    {
        throw new Exception('Must be a volunteer admin to create a department', ACCESS_DENIED);
    }
    $obj = $app->getJSONBody();
    $dataSet = DataSetFactory::get_data_set('fvs');
    $dataTable = $dataSet['departments'];
    echo json_encode($dataTable->create($obj));
}

function getDepartmentByID($id, $select = false)
{
    global $app;
    if(!$app->user)
    {
        throw new Exception('Must be logged in', ACCESS_DENIED);
    }
    $dataSet = DataSetFactory::get_data_set('fvs');
    $dataTable = $dataSet['departments'];
    $filter = new \Data\Filter("departmentID eq '$id'");
    $ret = $dataTable->read($filter, $select);
    if(empty($ret))
    {
        return false;
    }
    if($ret[0]['public'])
    {
        return $ret[0];
    }
    if($app->user->isInGroupNamed('VolunteerAdmins'))
    {
        return $ret[0];
    }
    //TODO Give lead access to department
    return false;
}

function getDepartment($id)
{
    global $app;
    $ret = getDepartmentByID($id, $app->odata->select);
    if($ret === false)
    {
        $app->notFound();
    }
    echo json_encode($ret);
}

function getShiftsForDepartment($id)
{
    global $app;
    $dept = getDepartmentByID($id);
    if($dept === false)
    {
        $app->notFound();
    }
    $filter = new \Data\Filter('departmentID eq '.$dept['departmentID']);
    $dataSet = DataSetFactory::get_data_set('fvs');
    $dataTable = $dataSet['shifts'];
    $ret = $dataTable->read($filter, $app->odata->select);
    if($ret === false || !isset($ret[0]))
    {
        $ret = array();
    }
    echo json_encode($ret);
}

function getRolesForDepartment($id)
{
    global $app;
    $dept = getDepartmentByID($id);
    if($dept === false)
    {
        $app->notFound();
    }
    $filter = new \Data\Filter('departmentID eq '.$dept['departmentID']);
    $dataSet = DataSetFactory::get_data_set('fvs');
    $dataTable = $dataSet['roles'];
    $ret = $dataTable->read($filter, $app->odata->select);
    if($ret === false || !isset($ret[0]))
    {
        $ret = array();
    }
    echo json_encode($ret);
}

?>
