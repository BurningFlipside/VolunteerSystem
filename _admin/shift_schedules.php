<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->addWellKnownJS(JS_BOOTBOX);

$page->body .= '
<div class="row">
  <div class="col-lg-12">
    <h1 class="page-header">Shift Schedules</h1>
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
</div>
<div class="row">
  <ul>
    <li>Simple Schedule: <button type="button" class="btn btn-link" id="simplePDF"><i class="far fa-file-pdf"></i>PDF</button>
    </li>
    <li>Schedule Grid: <button type="button" class="btn btn-link" id="gridXLSX"><i class="far fa-file-excel"></i>XLSX</button>
    </li>
  </ul>
</div>
';
$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
