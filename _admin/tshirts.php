<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');

$page->body .= '
<div class="row">
  <div class="col-lg-12">
    <h1 class="page-header">T-Shirts</h1>
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
    <input type="number" name="minShifts" id="minShifts" class="form-control" min="1" value="1"/>
  </div>
  <label for="roles" class="col-sm-2 col-form-label">Roles:</label>
  <div class="col-sm-10">
    <select name="roles" id="roles" class="form-control" multiple="multiple"></select>
  </div>
</div>
<div class="row">
  <table class="table">
    <tr><td></td><th>Filled Shifts</th><th>Unfilled Shifts*</th><th>Total</th></tr>
    <tr><th>Women\'s Small</th><td id="filledWS"></td><td id="unfilledWS"></td><td id="totalWS"></td></tr>
    <tr><th>Women\'s Medium</th><td id="filledWM"></td><td id="unfilledWM"></td><td id="totalWM"></td></tr>
    <tr><th>Men\'s Small</th><td id="filledMS"></td><td id="unfilledMS"></td><td id="totalMS"></td></tr>
    <tr><th>Women\'s Large</th><td id="filledWL"></td><td id="unfilledWL"></td><td id="totalWL"></td></tr>
    <tr><th>Men\'s Medium</th><td id="filledMM"></td><td id="unfilledMM"></td><td id="totalMM"></td></tr>
    <tr><th>Women\'s Extra Large</th><td id="filledWXL"></td><td id="unfilledWXL"></td><td id="totalWXL"></td></tr>
    <tr><th>Women\'s Extra Extra Large</th><td id="filledWXXL"></td><td id="unfilledWXXL"></td><td id="totalWXXL"></td></tr>
    <tr><th>Men\'s Large</th><td id="filledML"></td><td id="unfilledML"></td><td id="totalML"></td></tr>
    <tr><th>Women\'s Extra Extra Extra Large</th><td id="filledWXXXL"></td><td id="unfilledWXXXL"></td><td id="totalWXXXL"></td></tr>
    <tr><th>Men\'s Extra Large</th><td id="filledMXL"></td><td id="unfilledMXL"></td><td id="totalMXL"></td></tr>
    <tr><th>Men\'s Extra Extra Large</th><td id="filledMXXL"></td><td id="unfilledMXXL"></td><td id="totalMXXL"></td></tr>
    <tr><th>Men\'s Extra Extra Extra Large</th><td id="filledMXXXL"></td><td id="unfilledMXXXL"></td><td id="totalMXXXL"></td></tr>
  </table>
  <div class="alert alert-info" role="alert">
    *Unfilled Shifts: This fills in a standard distribution of t-shirts based on the number of unfilled shifts for the selection
  </div>
</div>
';
$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
