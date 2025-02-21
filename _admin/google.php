<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->addWellKnownJS(JS_BOOTBOX);

$page->body .= '
<div class="row">
  <div class="col-lg-12">
    <h1 class="page-header">Link Organization Google Account</h1>
  </div>
</div>
<div class="row">
  <div class="col-lg-12">
  The Volunteer System now allows you to link your official organization account with your volunteer account.  This will allow you to export and import data from Google Drive.
  </div>
</div>
<div class="row">
  <hr/>
</div>
<div class="row">
  <div class="col-lg-12" id="googleLink"></div>
</div>
<div class="row">
  <div class="col-lg-12" id="actions" style="visibility: hidden;">
    <button id="exportShifts" class="btn btn-primary">Export Shifts to Google Drive</button><br/>
    <button id="importShifts" class="btn btn-primary">Import Shifts from Google Drive</button><br/>
  </div>
</div>
';
$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
