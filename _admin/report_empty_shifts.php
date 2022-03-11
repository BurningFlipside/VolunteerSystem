<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');

$page->body .= '
<div class="row">
  <div class="col-lg-12">
    <h1 class="page-header">Empty Shifts <a href="#" onclick="generateCSV();" title="Download as a CSV"><i class="fas fa-file-csv"></i></a>
      <a href="#" onclick="generateXLSX();" title="Download as a XLSX"><i class="fas fa-file-excel"></i></a>
    </h1>
  </div>
</div>
<div class="row">
  <label for="event" class="col-sm-2 col-form-label">Event:</label>
  <div class="col-sm-10">
    <select name="event" id="event" class="form-control"></select>
  </div>
  <label for="depts" class="col-sm-2 col-form-label">Departments:</label>
  <div class="col-sm-10">
    <select name="depts" id="depts" class="form-control" multiple></select>
  </div>
  <label for="startTime" class="col-sm-2 col-form-label">Shift Start Time:</label>
  <div class="col-sm-10">
    <input class="form-control" type="datetime-local" name="startTime" id="startTime"/>
  </div>
</div>
<div class="row">
  <table class="table" id="shiftTable">
    <thead>
      <tr><th>Department</th><th>Role</th><th>Date</th><th>Start Time</th><th>End Time</th></tr>
    </thead>
    <tbody></tbody>
  </table>
</div>
';
$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
