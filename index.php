<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');
$page->addJS('js/index.js');

$page->body .= '
Hi! Welcome to the Flipside Volunteer System. As you may know, Flipside is not just an event, but a thriving year round community. This means that we have many different volunteer opportunities available.
What would you like to do today?
<div class="container text-center">
  <div class="row">
    <div class="col">
      <div class="card" onclick="location.href=\'guidedEvent.php\';" style="cursor:pointer;">
        <div class="card-body">
          <h5 class="card-title">Guided Volunteer Sign-Up</h5>
          <p class="card-text">Use a guided process to sign up for one or more volunteer shifts.</p>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card" onclick="location.href=\'timeline.php\';" style="cursor:pointer;">
        <div class="card-body">
          <h5 class="card-title">Timeline Volunteer Sign-Up</h5>
          <p class="card-text">Use a timeline of all volunteer shifts to sign up for one or more volunteer shifts.</p>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card" onclick="location.href=\'manage.php\';" style="cursor:pointer;">
        <div class="card-body">
          <h5 class="card-title">Manage Your Existing Volunteer Shifts</h5>
          <p class="card-text">See your current volunteer shifts and manage them including the ability to reverse your signup.</p>
        </div>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col">
      <div class="card flipside" id="flipsideGuided" style="display: none;">
        <div class="card-body">
          <h5 class="card-title">Flipside Guided Volunteer Sign-Up</h5>
          <p class="card-text">Use a guided process to sign up for one or more volunteer shifts at the Burning Flipside event.</p>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card flipside" id="flipsideTimeline" style="display: none;">
        <div class="card-body">
          <h5 class="card-title">Flipside Timeline Volunteer Sign-Up</h5>
          <p class="card-text">Use a timeline of all volunteer shifts to sign up for one or more volunteer shifts at the Burning Flipside event.</p>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card flipside" id="flipsideManage" style="display: none;">
        <div class="card-body">
          <h5 class="card-title">Manage Your Existing Flipside Shifts</h5>
          <p class="card-text">See your current volunteer shifts at Flipside and manage them including the ability to reverse your signup.</p>
        </div>
      </div>
    </div>
  </div>
</div>';

$page->printPage();