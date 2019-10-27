<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-accordian.html');

$page->addWellKnownJS(JS_BOOTBOX);
$page->addJS('../js/wizard.js');

$page->content['pageHeader'] = 'Shifts';
$page->content['panel'] = array();
$page->content['body'] = '
<div class="modal fade bd-example-modal-lg" id="groupWizard" tabindex="-1" role="dialog" aria-labelledby="groupWizardTitle" aria-hidden="true" data-backdrop="static" data-complete="newGroup">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="groupWizardTitle">New Shift Group</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="row flex-xl-nowrap">
          <div class="col-12 col-md-4 col-xl-3 bd-sidebar">
            <ul class="list-group">
              <li class="list-group-item active">Basic Info</li>
              <li class="list-group-item">Roles</li>
            </ul>
          </div>
          <div class="col-12 col-md-8 col-xl-8 bd-content">
            <div id="groupBasic" class="d-block">
              This is some basic information about the shift group.
              <div class="row">
                <input type="hidden" id="groupDepartmentID"/>
                <label for="groupDepartmentName" class="col-sm-2 col-form-label">Department:</label>
                <div class="col-sm-10">
                  <input class="form-control" type="text" name="groupDepartmentName" id="groupDepartmentName" readonly/>
                </div>
                <div class="w-100"></div>
                <label for="groupEvent" class="col-sm-2 col-form-label">Event:</label>
                <div class="col-sm-10">
                  <select class="form-control" name="groupEvent" id="groupEvent" onChange="groupEventChanged(this);"></select>
                </div>
                <div class="w-100"></div>
                <label for="groupStartTime" class="col-sm-2 col-form-label">Start Time:</label>
                <div class="col-sm-10">
                  <input class="form-control" type="datetime-local" name="groupStartTime" id="groupStartTime" required/>
                </div>
                <div class="w-100"></div>
                <label for="groupEndTime" class="col-sm-2 col-form-label">End Time:</label>
                <div class="col-sm-10">
                  <input class="form-control" type="datetime-local" name="groupEndTime" id="groupEndTime" required/>
                </div>
                <div class="w-100"></div>
                <label for="groupEnabled" class="col-sm-2 col-form-label">Enabled:</label>
                <div class="col-sm-10">
                  <input type="checkbox" name="groupEnabled" id="groupEnabled" class="form-control" checked="checked">
                </div>
                <div class="w-100"></div>
                <label for="groupName" class="col-sm-2 col-form-label">Shift Name:</label>
                <div class="col-sm-10">
                  <input type="text" name="groupName" id="groupName" class="form-control"/>
                </div>
                <label for="groupEarlyLate" class="col-sm-2 col-form-label">Entry/Late Stay Window:</label>
                <div class="col-sm-10">
                  <select name="groupEarlyLate" id="groupEarlyLate" class="form-control">
                    <option value="-2">Late Stay (Monday Evening)</option>
                    <option value="-1" selected="selected">Regular Entry (Thursday Morning)</option>
                    <option value="0">Wednesday Afternoon (Theme Camp/Art) Early Entry</option>
                    <option value="1">Wednesday Morning Infrastructure Setup</option>
                    <option value="2">Tuesday Morning Infrastructure Setup</option>
                  </select>
                </div>
              </div>
            </div>
            <div id="groupRoles" class="d-none">
              What roles share this same shift?
              <div class="row">
                <select id="groupAddRole" name="groupAddRole"></select><button type="button" class="btn btn-primary" onClick="addRoleToShift()">Add Role To Shift</button>
              </div>
              <div class="row">
                <table id="groupRoleTable" class="table">
                  <thead>
                    <tr><th>Role</th><th>Role Count</th><th>Remove Role</th></tr>
                  </thead>
                  <tbody></tbody>
                </table>
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
