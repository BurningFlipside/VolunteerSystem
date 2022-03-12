<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');

$page->body .= '
<div class="row">
  <div class="col-lg-12">
    <h1 class="page-header">Participants without Shifts</h1>
  </div>
</div>
<div class="row">
  <label for="event" class="col-sm-2 col-form-label">Event:</label>
  <div class="col-sm-10">
    <select name="event" id="event" class="form-control"></select>
  </div>
  <label for="certs" class="col-sm-2 col-form-label">Certifications:</label>
  <div class="col-sm-10">
    <select name="certs" id="certs" class="form-control" multiple="multiple">
      <option value="none" selected="true">None</option>
    </select>
  </div>
</div>
<div class="row">
  <table class="table" id="shiftTable">
    <thead>
      <tr><th>Username</th><th>Email</th><th>Certifications</th></tr>
    </thead>
    <tbody></tbody>
  </table>
</div>
';
$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
