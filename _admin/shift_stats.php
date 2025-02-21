<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-table-new.html');
$page->addJS('//unpkg.com/xlsx/dist/xlsx.full.min.js');
$page->addJS('./js/extern/nice-select2.js');
$page->addCSS('./js/extern/nice-select2.css');

$page->content['pageHeader'] = 'Shift Statistics <button type="button" class="btn btn-link" onClick="tableToCSV();"><i class="fas fa-file-csv"></i></button>';
$page->content['table'] = array('id' => 'shift_stats');
$page->content['selectors'] = '<label for="event" class="col-sm-2 col-form-label">Event</label>
  <div class="col-sm-10">
    <select class="form-control" id="event"></select>
  </div>
  <div class="w-100"></div>
  <div class="form-check">
    <input type="checkbox" class="form-check-input" id="showOld">
    <label class="form-check-label" for="showOld">Show Old Events</label>
  </div>
  <div class="w-100"></div>
  <div class="form-check">
    <input type="checkbox" class="form-check-input" id="hideEmpty">
    <label class="form-check-label" for="hideEmpty">Hide Empty Departments</label>
  </div>
  <div class="w-100"></div>
  <div class="form-check">
    <input type="checkbox" class="form-check-input" id="hideInviteOnly">
    <label class="form-check-label" for="hideInviteOnly">Hide Invite Only Shifts</label>
  </div>
  <div class="w-100"></div>
  <div class="form-check">
    <input type="checkbox" class="form-check-input" id="groupPending">
    <label class="form-check-label" for="groupPending">Count Group Pending Shifts as Full</label>
  </div>
  <div class="w-100"></div>
  <div class="form-check">
    <input type="checkbox" class="form-check-input" id="unbound">
    <label class="form-check-label" for="unbound">Do not include unfilled unbound shifts</label>
  </div>
';

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
