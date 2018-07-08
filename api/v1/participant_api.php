<?php

function participantGroup()
{
    global $app;
    $app->get('(/)', 'getParticipants');
    $app->get('/me(/)', 'getMe');
    $app->get('/:uid(/)', 'getUid');
}

function getParticipants()
{
    global $app;
    if(!$app->user)
    {
        throw new Exception('Must be logged in', ACCESS_DENIED);
    }
    $dataSet = DataSetFactory::get_data_set('fvs');
    $dataTable = $dataSet['participants'];
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
            $myDept = \Volunteer\Participants::getParticipantsForLead($app->user, $app->odata->select);
        }
        $me = $dataTable->read(new \Data\Filter('uid eq '.$app->user->getUid()), $app->odata->select);
        if($myDept)
        {
            $depts = array_merge($me, $myDept);
        }
        $ret = $depts;
    }
    echo json_encode($ret);
}

function getMe()
{
    global $app;
    if(!$app->user)
    {
        throw new Exception('Must be logged in', ACCESS_DENIED);
    }
    $dataSet = DataSetFactory::get_data_set('fvs');
    $dataTable = $dataSet['participants'];
    $user = $dataTable->read(new \Data\Filter('uid eq '.$app->user->getUid()), $app->odata->select);
    if($user === false || !isset($user[0]))
    {
        //Get user from profiles.burningflipside.com
        $userStr = file_get_contents('https://profiles.burningflipside.com/api/v1/users/'.$app->user->getUid());
        $userJson = json_decode($userStr, true);
        $user = array();
        $user['displayName'] = $userJson['displayName'];
        $user['givenName'] = $userJson['givenName'];
        $user['mail'] = $userJson['mail'];
        $user['uid'] = $userJson['uid'];
        $user['sn'] = $userJson['sn'];
        $dataTable->create($user);
    }
    echo json_encode($user);
}

function getUid($uid)
{
    global $app;
    if(!$app->user)
    {
        throw new Exception('Must be logged in', ACCESS_DENIED);
    }
    $dataSet = DataSetFactory::get_data_set('fvs');
    $dataTable = $dataSet['participants'];
    $user = false;
    //TODO add check for Lead...
    if($app->user->isInGroupNamed('VolunteerAdmins') || $uid === $app->user->getUid())
    {
        $user = $dataTable->read(new \Data\Filter('uid eq '.$uid), $app->odata->select);
    }
    if($user === false || !isset($user[0]))
    {
        $app->notFound();
    }
    echo json_encode($user[0]);
}

?>
