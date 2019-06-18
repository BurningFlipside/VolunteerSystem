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
  <label for="shiftTypes" class="d-none d-lg-block col-sm-2 col-form-label">Shift Types:</label>
  <div class="d-none d-lg-block col-sm-10">
    <select class="form-control" id="shiftTypes" multiple>
      <option value="unfilled" selected>Unfilled</option>
      <option value="filled" selected>Filled</option>
      <option value="unavailable" selected>Unavailable</option>
      <option value="mine" selected>Mine</option>
      <option value="overlap" selected>Overlapping</option>
    </select>
  </div>
  <div class="w-100"></div>
  <div id="calendar"></div>
</div>';

$page->printPage();
