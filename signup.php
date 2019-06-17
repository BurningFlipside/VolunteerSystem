<?php
require_once('class.VolunteerPage.php');
require_once('api/v1/class.Processor.php');

class ProcessorUser
{
  use Processor;
}

$processor = new ProcessorUser();
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');
$page->addJS('js/signup.js');

$page->body = '<div class="row"><h1>Shift Signup</h1></div>';

if(!isset($_GET['shiftID']))
{
  $page->body .= 'Error! Missing Shift ID. You must have followed a bad link!';
  $page->printPage();
  return;
}

$shiftID = $_GET['shiftID'];
$dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
$filter = new \Data\Filter('_id eq '.$shiftID);
$shifts = $dataTable->read($filter);
if(empty($shifts))
{
  $page->body .= 'Error! Could not locate shift. You must have followed an old link!';
  $page->printPage();
  return;
}
$shift = $shifts[0];

$dataTable = DataSetFactory::getDataTableByNames('fvs', 'participants');
$profiles = $dataTable->read(new \Data\Filter('uid eq '.$page->user->uid));
if(empty($profiles))
{
  $page->body .= 'Error! Could not locate user profile!';
  $page->printPage();
  return;
}
$profile = $profiles[0];

//Is shift already taken?
if(isset($shift['participant']))
{
  if($shift['participant'] === $page->user->uid)
  {
    $page->body .= '<div class="alert alert-success" role="alert">
      You already have this shift!
    </div>';
  }
  else
  {
    $page->body .= '<div class="alert alert-danger" role="alert">
      Someone else took this shift!
    </div>';
  }
  $page->printPage();
  return;
}

$overlap = false;
if($processor->shiftOverlaps($shift, $page->user->uid))
{
    $page->body .= '<div class="alert alert-warning" role="alert">
      You already have a shift during this time. If you choose to signup for this shift the lead(s) for the departments will be notified and must approve.
    </div>
    <div class="row">
      <label for="department" class="col-sm-10 col-form-label">I understand I am signing up for multiple shifts at the same time.</label>
      <div class="col-sm-2">
        <input type="checkbox" class="form-control" onChange="revealPage();">
      </div>
    </div>';
    $overlap = true;
}

$deptName = $shift['departmentID'];
$roleName = $shift['roleID'];

$dataTable = DataSetFactory::getDataTableByNames('fvs', 'departments');
$depts = $dataTable->read(new \Data\Filter('departmentID eq '.$shift['departmentID']));
if(!empty($depts))
{
  $deptName = $depts[0]['departmentName'];
}

$dataTable = DataSetFactory::getDataTableByNames('fvs', 'events');
$events = $dataTable->read(new \Data\Filter('_id eq '.$shift['eventID']));
if(!empty($events))
{
  if($events[0]['tickets'])
  {
    //TODO... Event requires tickets. Does this account have tickets?
  }
}

$dataTable = DataSetFactory::getDataTableByNames('fvs', 'roles');
$roles = $dataTable->read(new \Data\Filter('short_name eq '.$shift['roleID']));
if(!empty($roles))
{
  $roleName = $roles[0]['display_name'];
}

//Is user eligible for shift?
$canDo = $processor->canUserDoRole($profile, $roles[0]);
if($canDo !== true)
{
  $page->body .= '<div class="alert alert-danger" role="alert">';
  switch($canDo['whyClass'])
  {
    case 'INVITE':
      $page->body .= 'This shift requires an invite from the department lead. If you think you should have recieved such an invite please <a href="https://www.burningflipside.com/contact" class="alert-link">contact the lead</a>.';
      break;
    case 'CERT':
       $page->body .= $canDo['whyMsg'].' If you have this certification it is not recorded in your profile. You can <a href="certiciation.php" class="alert-link">record that certification</a> to sign up.';
       break;
    default:
      $page->body .= 'You are not eligible for this shift because: '.$canDo['whyMsg'];
      break;
  }
  $page->body .= '</div>';
  $page->printPage();
  return;  
  var_dump($canDo); die();
}

$start = new \DateTime($shift['startTime']);
$end = new \DateTime($shift['endTime']);
$diff = $end->diff($start);
$shiftLength = $diff->h + ($diff->i/60.0);

$page->body .= '<div id="signupContent" ';
if($overlap)
{
  $page->body .= 'class="d-none" ';
}
$page->body .= '/>';
$page->body .= '
<div class="row">
  <input type="hidden" id="shiftID" name="shiftID" value="'.$shiftID.'"/>
  <label for="department" class="col-sm-2 col-form-label">Department:</label>
  <div class="col-sm-10">
    <input type="text" name="department" id="department" class="form-control" readonly="readonly" value="'.$deptName.'">
  </div>
  <label for="role" class="col-sm-2 col-form-label">Role:</label>
  <div class="col-sm-10">
    <input type="text" name="role" id="role" class="form-control" readonly="readonly" value="'.$roleName.'">
  </div>
  <label for="startTime" class="col-sm-2 col-form-label">Start Time:</label>
  <div class="col-sm-10">
    <input type="datetime-local" name="startTime" id="startTime" class="form-control" readonly="readonly" value="'.$shift['startTime'].'">
  </div>
  <label for="endTime" class="col-sm-2 col-form-label">End Time:</label>
  <div class="col-sm-10">
    <input type="datetime-local" name="endTime" id="endTime" class="form-control" readonly="readonly" value="'.$shift['endTime'].'">
  </div>
  <label for="length" class="col-sm-2 col-form-label">Length:</label>
  <div class="col-sm-10">
    <input type="text" name="length" id="length" class="form-control" readonly="readonly" value="'.$shiftLength.' hours">
  </div>
</div>
<div class="row">
  <div class="alert alert-info" role="alert">
    By signing up for a Burning Flipside shift you are commiting to showing up on time for your shift prepared to work. Please make sure you are prepared to make this commitment before clicking signup below.
  </div>
</div>
<div class="row">
  <button type="button" class="btn btn-secondary mr-auto" onClick="window.history.back();">Cancel</button>
  <button type="button" class="btn btn-primary" onclick="signup();">Signup</button>
</div></div>
';

//Is group eligible?
if(isset($shift['groupID']) && isset($roles[0]['groups_allowed']) && $roles[0]['groups_allowed'])
{
  $page->body .= '
  <div class="row">
    <div class="alert alert-primary" role="alert">
      You have selected a group eligible shift. This means you can generate a link for your friends to sign up on the shift with you. Would you like to sign up for the shift and generate that link now?
    </div>
  </div>
  <div class="row">
    <button type="button" class="btn btn-secondary" onclick="groupSignup();">Signup and Generate Group Link</button>
  </div>
  ';
}

$page->printPage();
