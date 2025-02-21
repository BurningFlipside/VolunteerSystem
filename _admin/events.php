<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-table-new.html');

$page->addWellKnownJS(JS_BOOTBOX);
$page->addJS('../js/wizard.js');

$page->content['pageHeader'] = 'Events';
$page->content['table'] = array('id' => 'events');
$page->content['selectors'] = '';
if($page->user && $page->user->isInGroupNamed('VolunteerAdmins'))
{
    $page->content['selectors'] = '<button type="button" class="btn btn-primary" onclick="showEventWizard();">New Event</button><div class="w-100"></div>';
}
$page->content['selectors'] .= '<div class="form-check"><input type="checkbox" class="form-check-input" id="hideOld" checked><label class="form-check-label" for="hideEmpty">Hide Past Events</label></div>';
$page->content['body'] = '
<div class="modal fade bd-example-modal-lg" id="eventWizard" tabindex="-1" role="dialog" aria-labelledby="eventWizardTitle" aria-hidden="true" data-backdrop="static" data-complete="newEvent">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="profileWizardTitle">New Event</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="row flex-xl-nowrap">
          <div class="d-none d-sm-none d-md-none d-lg-none d-xl-block col-xl-3 bd-sidebar">
            <ul class="list-group">
              <li class="list-group-item active">Basic Info</li>
              <li class="list-group-item">Private Event</li>
              <li class="list-group-item">Departments</li>
              <li class="list-group-item">Tickets</li>
            </ul>
          </div>
          <div class="col-12 col-md-8 col-xl-8 bd-content">
            <div id="eventBasic" class="d-block">
              This is some basic information about the event.
              <div class="row">
                <label for="name" class="col-sm-2 col-form-label">Event Name:</label>
                <div class="col-sm-10">
                  <input class="form-control" type="text" name="name" id="name" required/>
                </div>
                <div class="w-100"></div>
                <label for="startTime" class="col-sm-2 col-form-label">Start:</label>
                <div class="col-sm-10">
                  <input class="form-control" type="datetime-local" name="startTime" id="startTime" required/>
                </div>
                <div class="w-100"></div>
                <label for="endTime" class="col-sm-2 col-form-label">End:</label>
                <div class="col-sm-10">
                  <input class="form-control" type="datetime-local" name="endTime" id="endTime" required/>
                </div>
              </div>
            </div>
            <div id="eventPrivacy" class="d-none">
              For purposes of this system a private event is one that you only want a set of volunteers to be able to see, i.e. not everyone logged into the system can see this event.
              <div class="row">
                <label for="private" class="col-sm-2 col-form-label">Private Event:</label>
                <div class="col-sm-2">
                  <input class="form-check-input" type="checkbox" name="private" id="private" onChange="privateEventChange(this);"/>
                </div>
                <div class="w-100"></div>
                <div class="col-sm-12">
                  <p class="font-weight-lighter">
                    For a private event you must provide a list of email addresses for volunteers who will be able to see the event. One email address per line.
                  </p>
                </div>
                <div class="w-100"></div>
                <label for="volList" class="col-sm-2 col-form-label">Volunteer List:</label>
                <div class="col-sm-10">
                  <textarea class="form-control" name="volList" id="volList" disabled></textarea>
                </div>
                <div class="w-100"></div>
                <label for="private" class="col-sm-2 col-form-label">Send Invites:</label>
                <div class="col-sm-2">
                  <input class="form-check-input" type="checkbox" name="invites" id="invites" disabled/>
                </div>
              </div>
            </div>
            <div id="eventDepartments" class="d-none">
              You might want to limit which departments can create shifts for this event. If you do not select any departments than all department leads will be able to create shifts for this event.
              <div class="row" id="deptList">
              </div>
            </div>
            <div id="eventTickets" class="d-none">
              Does volunteering for this event require Flipside tickets?
              <div class="alert alert-warning" role="alert">
                NOTE: Selecting this option will not prevent people without tickets from signing up! It will add the ability to leads/AFs to get reports on who has tickets, require tickets for certain shifts, and provide the leads the ability to kick anyone who doesn\'t have a ticket from their shifts. 
              </div>
              <div class="row">
                <label for="tickets" class="col-sm-3 col-form-label">Tickets Required:</label>
                <div class="col-sm-2">
                  <input class="form-control" type="checkbox" name="tickets" id="tickets"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary mr-auto" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-outline-primary" id="prevStep" disabled onClick="prevWizardStep(this);">Previous</button>
        <button type="button" class="btn btn-outline-primary" id="nextStep" onClick="nextWizardStep(this);">Next</button>
      </div>
    </div>
  </div>
</div>
';

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
