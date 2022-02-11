<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require('../../app/VolunteerAutoload.php');
require_once('class.Processor.php');
require_once('class.VolunteerAPI.php');
require_once('class.DepartmentAPI.php');
require_once('class.EventAPI.php');
require_once('class.RoleAPI.php');
require_once('class.ShiftAPI.php');
require_once('class.ParticipantAPI.php');
require_once('class.CertificatonAPI.php');
require_once('class.TextAPI.php');

$site = new \Flipside\Http\WebSite();
$site->registerAPI('/events', new EventAPI());
$site->registerAPI('/departments', new DepartmentAPI());
$site->registerAPI('/roles', new RoleAPI());
$site->registerAPI('/shifts', new ShiftAPI());
$site->registerAPI('/participants', new ParticipantAPI());
$site->registerAPI('/certs', new CertificatonAPI());
$site->registerAPI('/longText', new TextAPI());
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
