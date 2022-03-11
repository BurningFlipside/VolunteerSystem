<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');

$page->body .= '
<div class="row">
  <div class="col-lg-12">
    <h1 class="page-header">Copy Shifts from Prior Event</h1>
  </div>
</div>
<div class="row">
  <label for="department" class="col-sm-2 col-form-label">Department:</label>
  <div class="col-sm-10">
    <select name="department" id="department" class="form-control"></select>
  </div>
  <label for="src" class="col-sm-2 col-form-label">Source Event:</label>
  <div class="col-sm-10">
    <select name="src" id="src" class="form-control"></select>
  </div>
  <label for="dst" class="col-sm-2 col-form-label">Target Event:</label>
  <div class="col-sm-10">
    <select name="dst" id="dst" class="form-control"></select>
  </div>
</div>
<div class="row" id="nextStep">
</div>
';
$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */

