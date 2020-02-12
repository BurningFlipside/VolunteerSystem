<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-dashboard.html');
$page->addWellKnownJS(JS_CHART);

if($page->isLead === false)
{
    $page->addCard('fa-calendar-alt', '<div id="eventCount">?</div> Events', 'events.php', $page::CARD_GREEN);
    $page->addCard('fa-building', '<div id="deptCount">?</div> Departments', 'departments.php');
    $deptOptions = '<option value="*">All Departments</option>';
}
else
{
    $page->addCard('fa-building', '<div id="deptName"></div>', 'departments.php');
    $deptOptions = '';
}
$page->addCard('fa-address-card', '<div id="roleCount">?</div> Roles', 'roles.php', $page::CARD_YELLOW);
$page->addCard('fa-user', '<div id="volCount">?</div> Volunteers', 'volunteers.php', $page::CARD_RED);

$page->content['body'] = '
<div class="row">
  <label for="events" class="col-sm-2 col-form-label">Events:</label>
  <div class="col-sm-9">
    <select class="form-control" id="events">
    </select>
  </div>
  <button type="button" class="col-sm-1 btn btn-link" onClick="favoriteEvent();"><i id="eventStar" class="far fa-star"></i></button>
  <label for="departments" class="col-sm-2 col-form-label">Departments:</label> 
  <div class="col-sm-10">
    <select class="form-control" id="departments">
      '.$deptOptions.'
    </select>
  </div>
</div>
<div class="row">
  <canvas id="shiftsFilled" class="w-auto"></canvas>
</div>
';

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
