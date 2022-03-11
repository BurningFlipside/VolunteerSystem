<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');

$page->body .= '
<div class="row">
  <div class="col-lg-12">
    <h1 class="page-header">Early Entry/Late Stay <a href="#" onclick="generateCSV();"><i class="far fa-file-excel"></i></a></h1>
  </div>
</div>
<div class="row">
  <label for="event" class="col-sm-2 col-form-label">Event:</label>
  <div class="col-sm-10">
    <select name="event" id="event" class="form-control"></select>
  </div>
  <label for="startTime" class="col-sm-2 col-form-label">EE Type:</label>
  <div class="col-sm-10">
    <select name="earlyLate" id="earlyLate" class="form-control">
      <option value="*">All</option>
      <option value="-2">Late Stay (Monday Evening)</option>
      <option value="0">Wednesday Afternoon (Theme Camp/Art) Early Entry</option>
      <option value="1">Wednesday Morning Infrastructure Setup</option>
      <option value="2">Tuesday Morning Infrastructure Setup</option>
    </select>
  </div>
</div>
<div class="row">
  <table class="table" id="eeTable">
    <thead>
      <tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Window</th><th>Ticket Status</th></tr>
    </thead>
    <tbody></tbody>
  </table>
</div>
';
$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
