<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->addWellKnownJS(JS_BOOTBOX);

$page->body .= '
<div class="row">
  <div class="col-lg-12">
    <h1 class="page-header">Volunteers without a Ticket <a href="#" onclick="generateCSV();"><i class="far fa-file-excel"></i></a></h1>
  </div>
</div>
<div class="row">
  <label for="event" class="col-sm-2 col-form-label">Event:</label>
  <div class="col-sm-10">
    <select name="event" id="event" class="form-control"></select>
  </div>
  <div class="w-100"></div>
  <div class="form-check">
    <input type="checkbox" class="form-check-input" id="showRegistered" checked>
    <label class="form-check-label" for="showRegistered">Show Volunteers with a registration, but no ticket</label>
  </div>
</div>
<div class="row">
  <table class="table" id="volTable">
    <thead>
      <tr><th>Name</th><th>Email</th><th>Department(s)</th><th>Number of Shifts</th></tr>
    </thead>
    <tbody></tbody>
  </table>
</div>
';
$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
