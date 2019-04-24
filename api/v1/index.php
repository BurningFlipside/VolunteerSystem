<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require('Autoload.php');
require_once('class.DepartmentAPI.php');
require_once('class.ShiftAPI.php');
require_once('participant_api.php');

$site = new \Http\WebSite();
$site->registerAPI('/departments', new DepartmentAPI());
$site->registerAPI('/shifts', new ShiftAPI());
/*
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
*/
$site->run();
?>
