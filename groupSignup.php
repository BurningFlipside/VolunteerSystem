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
$dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
$filter = new \Flipside\Data\Filter('signupLink eq '.$groupID);
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
    $shifts[$i] = new Volunteer\VolunteerShift(false, $shifts[$i]);
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
$deptName = $shifts[0]->department->departmentName;
$start = $shifts[0]->startTime;
$end = $shifts[0]->endTime;
$diff = $end->diff($start);
$shiftLength = $diff->h + ($diff->i / 60.0);
$page->body .= '
<div class="row">
  <label for="department" class="col-sm-2 col-form-label">Department:</label>
  <div class="col-sm-10">
    <input type="text" name="department" id="department" class="form-control" readonly="readonly" value="'.$deptName.'">
  </div>
  <label for="startTime" class="col-sm-2 col-form-label">Start Time:</label>
  <div class="col-sm-10">
    <input type="datetime-local" name="startTime" id="startTime" class="form-control" readonly="readonly" value="'.$start->format('Y-m-d\TH:i').'">
  </div>
  <label for="endTime" class="col-sm-2 col-form-label">End Time:</label>
  <div class="col-sm-10">
    <input type="datetime-local" name="endTime" id="endTime" class="form-control" readonly="readonly" value="'.$end->format('Y-m-d\TH:i').'">
  </div>
  <label for="length" class="col-sm-2 col-form-label">Length:</label>
  <div class="col-sm-10">
    <input type="text" name="length" id="length" class="form-control" readonly="readonly" value="'.$shiftLength.' hours">
  </div>
</div>
<div class="row"><h3>Filled Shifts</h3></div><div class="row"><table class="table"><tr><th>Role</th><th>Participant</th></tr>';
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
