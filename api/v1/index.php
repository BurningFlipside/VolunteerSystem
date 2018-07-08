<?php
require_once('class.FlipREST.php');
require_once('app/VolunteerAutoload.php');

require_once('dept_api.php');
require_once('shift_api.php');
require_once('participant_api.php');

$app = new FlipREST();
$app->get('(/)', 'getRoot');
$app->group('/shifts', 'shiftGroup');
$app->group('/departments', 'deptGroup');
$app->group('/participants', 'participantGroup');

function getRoot()
{
    global $app;
    $ret = array();
    $root = $app->request->getRootUri();
    $ret['shifts'] = array('uri'=>$root.'/shifts');
    $ret['departments'] = array('uri'=>$root.'/departments');
    if($app->user && ($app->user->isInGroupNamed('Leads') || $app->user->isInGroupNamed('VolunteerAdmins')))
    {
        $ret['volunteers'] = array('uri'=>$root.'/volunteers');
    }
    echo json_encode($ret);
}

$app->run();
?>
