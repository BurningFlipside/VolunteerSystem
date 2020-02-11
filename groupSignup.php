<?php
require_once('class.VolunteerPage.php');
require_once('app/VolunteerAutoload.php');

$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');
$page->addJS('js/groupSignup.js');

$page->body = '<div class="row"><h1>Group Signup</h1></div>';

if(!isset($_GET['id']))
{
    $page->body .= 'Error! Missing Group ID. You must have followed a bad link!';
    $page->printPage();
    return;
}

$groupID = $_GET['id'];
$dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
$filter = new \Data\Filter('signupLink eq '.$groupID);
$shifts = $dataTable->read($filter);
if(empty($shifts))
{
    $page->body .= 'Error! Could not locate shifts. You must have followed an old link!';
    $page->printPage();
    return;
}

$filled = array();
$available = array();
$alreadySignedUp = false;

$count = count($shifts);
for($i = 0; $i < $count; $i++)
{
    $shifts[$i] = new \VolunteerShift(false, $shifts[$i]);
    if($shifts[$i]->status === 'filled' || $shifts[$i]->status === 'pending')
    {
        array_push($filled, $shifts[$i]);
        if($page->user && $shifts[$i]->participant === $page->user->uid)
        {
            $alreadySignedUp = true;
        }
    }
    else
    {
        array_push($available, $shifts[$i]);
    }
}
$page->body .= '<div class="row"><h3>Filled Shifts</h3></div><div class="row"><table class="table"><tr><th>Role</th><th>Participant</th></tr>';
foreach($filled as $shift)
{
  $page->body .= '<tr><td>'.$shift->role->display_name.'</td><td>'.$shift->webParticipantName.'</td></tr>';
}
$page->body .= '</table></div>';
$page->body .= '<div class="row"><h3>Unfilled Shifts</h3></div><div class="row"><table class="table"><tr><th>Role</th><th>Sign Up</th></tr>';
foreach($available as $shift)
{
    $cell = '<i>You already have a shift!</i>';
    if($alreadySignedUp === false)
    {
        $cell = '<button type="button" class="btn btn-primary" onClick="signUp(\''.$shift->_id.'\');">Sign Up</button>';
    } 
    $page->body .= '<tr><td>'.$shift->role->display_name.'</td><td>'.$cell.'</td></tr>';
}
$page->body .= '</table></div>';
$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
