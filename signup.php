<?php
require_once('class.VolunteerPage.php');
require_once('api/v1/class.Processor.php');
require_once('app/VolunteerAutoload.php');

class ProcessorUser
{
    use Processor;

    protected $isAdmin;

    public function __construct($isAdmin)
    {
        $this->isAdmin = $isAdmin;
    }

    protected function isVolunteerAdmin($request)
    {
        return $this->isAdmin;
    }
}

$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');
$page->addJS('js/signup.js');
$page->addJS('js/dialog.js');
$page->addWellKnownJS(JS_BOOTBOX);
$admin = false;
if($page->user !== null)
{
  $admin = $page->user->isInGroupNamed('VolunteerAdmins');
}
else
{
    $page->body .= 'Not logged in! Please log in to sign up for this shift.';
    $page->printPage();
    return;
}
$processor = new ProcessorUser($admin);

$page->body = '<div class="row"><div class="col-12"><h1>Shift Signup</h1></div></div>';

if(!isset($_GET['shiftID']))
{
    $page->body .= 'Error! Missing Shift ID. You must have followed a bad link!';
    $page->printPage();
    return;
}

$shiftID = $_GET['shiftID'];
$dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
$filter = new \Flipside\Data\Filter('_id eq '.$shiftID);
$shifts = $dataTable->read($filter);
if(empty($shifts))
{
    $page->body .= 'Error! Could not locate shift. You must have followed an old link!';
    $page->printPage();
    return;
}
$shift = $shifts[0];
$myShift = new Volunteer\VolunteerShift(false, $shift);

try {
$profile = new Volunteer\VolunteerProfile($page->user->uid);
} catch(Exception $e) {
//User hasn't made a profile yet... Let the wizard take care of them
$page->printPage();
return;
}

if($processor->isAdminForShift($shift, $page->user))
{
    if(isset($shift['groupID']) && strlen($shift['groupID'] > 0))
    {
        $page->body .= '
            <div class="alert alert-info" role="alert">
            You are an administrator for this shift. You can edit the shift <a href="_admin/shifts.php?shiftID='.$shiftID.'" class="alert-link">here</a>.
            Or you can edit the shift group <a href="_admin/shifts.php?groupID='.$shift['groupID'].'" class="alert-link">here</a>.
            </div>
            ';
    }
    else
    {
        $page->body .= '
            <div class="alert alert-info" role="alert">
            You are an administrator for this shift. You can edit the shift <a href="_admin/shifts.php?shiftID='.$shiftID.'" class="alert-link">here</a>.
            </div>
            ';
    }
    if(!isset($shift['participant']) || strlen($shift['participant']) === 0)
    {
        $page->body .= '
            <div class="alert alert-info" role="alert">
            You are an administrator for this shift. You can assign someone to the shift, but it is highly recommended to let the users sign up. But if you are sure click <a href="#" onClick="showAdminSignup()" class="alert-link">here</a>.
            </div>
            ';
    }
}

//Is shift already taken?
if($myShift->isFilled())
{
    if(isset($shift['signupLink']))
    {
        $page->body .= '<div class="alert alert-info" role="alert">This is a group shift. The group signup link is <a>https://secure.burningflipside.com/fvs/groupSignup.php?id='.$shift['signupLink'].'</a></div>';
    }
    if(isset($shift['participant']) && $shift['participant'] === $page->user->uid)
    {
        $page->body .= '<div class="alert alert-success" role="alert">
            You already have this shift!
            </div>
            <div class="row">
            <button type="button" class="btn btn-secondary mr-auto" onClick="window.history.back();">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="abandon();">Abandon Shift</button>
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
if($myShift->doAnyOverlap($page->user->uid))
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

$dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'departments');
$departments = $dataTable->read(new \Flipside\Data\Filter('departmentID eq '.$shift['departmentID']));
if(!empty($departments))
{
    $deptName = $departments[0]['departmentName'];
}

$dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'events');
$events = $dataTable->read(new \Flipside\Data\Filter('_id eq '.$shift['eventID']));
if(!empty($events))
{
    if($events[0]['tickets'])
    {
        //TODO... Event requires tickets. Does this account have tickets?
    }
}

$dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'roles');
$roles = $dataTable->read(new \Flipside\Data\Filter('short_name eq '.$shift['roleID']));
if(!empty($roles))
{
    $roleName = $roles[0]['display_name'];
}

//Is user eligible for shift?
$canDo = $processor->canUserDoRole($profile, $roles[0]);
if(is_array($canDo) && $processor->isAdminForShift($shift, $page->user))
{
    $canDo = true;
}
if($canDo !== true)
{
    $page->body .= '<div class="alert alert-danger" role="alert">';
    switch($canDo['whyClass'])
    {
        case 'INVITE':
            $page->body .= 'This shift requires an invite from the department lead. If you think you should have received such an invite please <a href="https://www.burningflipside.com/contact" class="alert-link">contact the lead</a>.';
            break;
        case 'CERT':
            $page->body .= $canDo['whyMsg'].' If you have this certification it is not recorded in your profile. You can <a href="certification.php" class="alert-link">record that certification</a> to sign up.';
            break;
        default:
            $page->body .= 'You are not eligible for this shift because: '.$canDo['whyMsg'];
            break;
    }
    $page->body .= '</div>';
    $page->printPage();
    return;  
}

if(isset($shift['approvalNeeded']) && $shift['approvalNeeded'])
{
    $page->body .= '<div class="alert alert-warning" role="alert">This shift requires explicit permission from the lead in order to sign up. The lead may decline your signup for this shift.</div>';
}

$start = new \DateTime($shift['startTime']);
$end = new \DateTime($shift['endTime']);
$diff = $end->diff($start);
$shiftLength = $diff->h + ($diff->i / 60.0);

$page->body .= '<div id="signupContent" ';
if($overlap)
{
    $page->body .= 'class="d-none" ';
}
$page->body .= '/>';
$groupLink = '';
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
    <input type="datetime-local" name="startTime" id="startTime" class="form-control" readonly="readonly" value="'.$start->format('Y-m-d\TH:i').'">
  </div>
  <label for="endTime" class="col-sm-2 col-form-label">End Time:</label>
  <div class="col-sm-10">
    <input type="datetime-local" name="endTime" id="endTime" class="form-control" readonly="readonly" value="'.$end->format('Y-m-d\TH:i').'">
  </div>
  <label for="length" class="col-sm-2 col-form-label">Length:</label>
  <div class="col-sm-10">
    <input type="text" name="length" id="length" class="form-control" readonly="readonly" value="'.number_format((float)$shiftLength, 2, '.','').' hours">
  </div>
</div>
<div class="row">
  <div class="alert alert-info" role="alert">
    By signing up for a Burning Flipside shift you are committing to showing up on time for your shift prepared to work. Please make sure you are prepared to make this commitment before clicking signup below.
  </div>
</div>
<div class="row">
  <button type="button" class="btn btn-secondary mr-auto" onClick="window.history.back();">Cancel</button>
  <button type="button" class="btn btn-primary" onclick="signup();">Signup</button>
</div></div>
';

if($processor->isAdminForShift($shift, $page->user) && (!isset($shift['participant']) || strlen($shift['participant']) === 0))
{
    $page->body .= '
        <div class="row d-none" id="adminSignup">
        <div class="alert alert-danger" role="alert">
        First off, make sure you understand what this will do. While it will let you fill out the details for a shift, it will prevent the user from seeing the shift on their list when they log in, it will not be correctly reported for t-shirts or for rock star volunteers, their camp will not be listed on the shift schedule, and the ability to contact past volunteers will not work for anyone signed up in this manner. Basically, doing this removes about 90% of the advantage of using this system. So please only do this if participant in question is unable to sign up on their own.
        </div>
        <label for="participantOverride" class="col-sm-2 col-form-label">Participant Name:</label>
        <div class="col-sm-10">
        <input type="text" name="participantOverride" id="participantOverride" class="form-control"/>
        </div>
        <button type="button" class="btn btn-primary" onclick="override();">Admin Override</button>
        </div>
        ';
}

//Is group eligible?
if(isset($shift['groupID']) && isset($roles[0]['groups_allowed']) && $roles[0]['groups_allowed'])
{
    $page->body .= '<div id="groupContent" ';
    if($overlap)
    {
        $page->body .= 'class="d-none" ';
    }
    $page->body .= '>
        <div class="row">
        <div class="alert alert-primary" role="alert">
        You have selected a group eligible shift. This means you can generate a link for your friends to sign up on the shift with you. Would you like to sign up for the shift and generate that link now?
        </div>
        </div>
        <div class="row">
        <button type="button" class="btn btn-secondary" onclick="groupSignup();">Signup and Generate Group Link</button>
        </div>
        </div>
        ';
}

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
