<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');

$page->body .= '
<div class="row">
  <div class="col-lg-12">
    <h1 class="page-header">Generate Links</h1>
  </div>
</div>
<div class="row">
  <label for="event" class="col-sm-2 col-form-label">Event:</label>
  <div class="col-sm-10">
    <select name="event" id="event" class="form-control"></select>
  </div>
  <label for="dept" class="col-sm-2 col-form-label">Department:</label>
  <div class="col-sm-10">
    <select name="dept" id="dept" class="form-control"></select>
  </div>
  <label for="role" class="col-sm-2 col-form-label">Role:</label>
  <div class="col-sm-10">
    <select name="role" id="role" class="form-control"></select>
  </div>
</div>
<div class="row">
  <hr/>
</div>
<div class="row">
  <label for="link" class="col-sm-2 col-form-label">Link:</label>
  <div class="col-sm-10">
    <input type="text" class="form-control" id="link" disabled></input>
  </div>
</div>
';
$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
