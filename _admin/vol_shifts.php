<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->addJS('./js/extern/nice-select2.js');
$page->addCSS('./js/extern/nice-select2.css');
$page->setTemplateName('admin-table-new.html');

$page->body .= '
<div class="row">
  <div class="col-lg-12">
    <h1 class="page-header">Participant Shifts</h1>
  </div>
</div>
<div class="row">
  <label for="event" class="col-sm-2 col-form-label">Event:</label>
  <div class="col-sm-10">
    <select name="event" id="event" class="form-control"></select>
  </div>
  <label for="department" class="col-sm-2 col-form-label">Department:</label>
  <div class="col-sm-10">
    <select name="department" id="department" class="form-control"></select>
  </div>
  <label for="minShifts" class="col-sm-2 col-form-label">Minimum Shifts:</label>
  <div class="col-sm-10">
    <input type="number" name="minShifts" id="minShifts" class="form-control" min="0" value="0"/>
  </div>
  <label for="maxShifts" class="col-sm-2 col-form-label">Maximum Shifts:</label>
  <div class="col-sm-10">
    <input type="number" name="maxShifts" id="maxShifts" class="form-control" min="1"/>
  </div>
  <label for="roles" class="col-sm-2 col-form-label">Roles:</label>
  <div class="col-sm-10">
    <select name="roles" id="roles" class="form-control" multiple="multiple"></select>
  </div>
</div>
<div class="row">
  <table class="table" id="shiftTable">
    <thead>
      <tr><th>Username</th><th>Number of Shifts</th></tr>
    </thead>
    <tbody></tbody>
  </table>
</div>
';
$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
