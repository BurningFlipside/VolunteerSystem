<?php

function deptGroup()
{
    global $app;
    $app->get('(/)', 'getDepartmentList');
    $app->post('(/)', 'createDepartment');
    $app->get('/:id(/)', 'getDepartment');
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

function getDepartment($id)
{
    global $app;
    if(!$app->user)
    {
        throw new Exception('Must be logged in', ACCESS_DENIED);
    }
    $dataSet = DataSetFactory::get_data_set('fvs');
    $dataTable = $dataSet['departments'];
    $filter = new \Data\Filter("departmentID eq '$id'");
    $ret = $dataTable->read($filter, $app->odata->select);
    if($ret === false || !isset($ret[0]))
    {
        $app->notFound();
    }
    echo json_encode($ret[0]);
}

?>
