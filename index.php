<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');
$page->addJS('js/index.js');

$page->body .= '
<div class="row">
  <label for="event" class="col-sm-2 col-form-label">Event</label>
  <div class="col-sm-10">
    <select class="form-control" id="event"></select>
  </div>
  <div class="w-100"></div>
  <div class="d-lg-none d-xl-none col-sm-12">
    <button type="button" class="btn btn-info" onClick="unhideFilters();">Filters</button>
  </div>
  <label for="departments" class="d-none d-lg-block col-sm-2 col-form-label">Departments:</label>
  <div class="d-none d-lg-block col-sm-10">
    <select class="form-control" id="departments" multiple></select>
  </div>
  <div class="w-100"></div>
  <label for="shiftTypes" class="d-none d-lg-block col-sm-2 col-form-label">Shift Status:</label>
  <div class="d-none d-lg-block col-sm-10">
    <select class="form-control" id="shiftTypes" multiple>
      <option value="unfilled" title="Shift is unfilled and available for you to sign up" selected>Unfilled</option>
      <option value="filled" title="Shift is filled. Maybe one of your friends already has it?" selected>Filled</option>
      <option value="unavailable" title="This shift is unavailable either because it is invite only or requires training the system doesn\'t know you have." selected>Unavailable</option>
      <option value="mine" title="This is a shift you are signed up for." selected>Mine</option>
      <option value="overlap" title="This shift overlaps with one you are signed up for." selected>Overlapping</option>
    </select>
  </div>
  <div class="w-100"></div>
  <div id="calendar" class="w-100"></div>
  <div class="w-100"></div>
  <a role="button" class="btn btn-primary" href="api/v1/participants/me/shifts?$format=text/calendar"><i class="far fa-calendar-alt"></i> Download My Shifts</a>
  <a role="button" class="btn btn-primary" href="api/v1/participants/me/shifts?$format=application/pdf"><i class="fas fa-print"></i> Print My Shifts</a>
</div>
<style type="text/css">
  .select2-container--default .select2-selection--multiple .select2-selection__choice[title="Shift is unfilled and available for you to sign up"] {
    background-color: #3788d8;
    color: #fff;
  }
  
  .select2-container--default .select2-selection--multiple .select2-selection__choice[title="Shift is filled. Maybe one of your friends already has it?"] {
    background-color: firebrick;
    color: #fff;
  }

  .select2-container--default .select2-selection--multiple .select2-selection__choice[title="This shift overlaps with one you are signed up for."] {
    background-color: gold;
    color: #fff;
  }

  .select2-container--default .select2-selection--multiple .select2-selection__choice[title="This is a shift you are signed up for."] {
    background-color: springgreen;
    color: #fff;
  }
</style>';

$page->printPage();
