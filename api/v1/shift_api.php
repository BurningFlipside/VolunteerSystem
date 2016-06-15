<?php

function shiftGroup()
{
    global $app;
    $app->get('(/)', 'getCurrentShiftList');
}

function getCurrentShiftList()
{
    global $app;
    if(!$app->user)
    {
        throw new Exception('Must be logged in', ACCESS_DENIED);
    }
    $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
    $ret = false;
    if($app->user->isInGroupNamed('VolunteerAdmins'))
    {
        $ret = $dataTable->read($app->odata->filter, $app->odata->select, $app->odata->top, $app->odata->skip, $app->odata->orderby);
    }
    else
    {
        $myDept = false;
        if($app->user->isInGroupNamed('Lead'))
        {
            $myDept = \Volunteer\Shifts::getShiftsForLead($app->user, $app->odata->select);
        }
        $depts = \Volunteer\Shifts::getPublicShifts($app->odata->select);
        if($myDept)
        {
            $depts = array_merge($depts, $myDept);
        }
        $ret = $depts;
    }
    echo json_encode($ret);
}

