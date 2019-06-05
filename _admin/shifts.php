<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-accordian.html');

$page->addWellKnownJS(JS_BOOTBOX);

$page->content['pageHeader'] = 'Shifts';
$page->content['panel'] = array();
$page->content['body'] = '
  <div class="modal fade show" id="newShift" aria-modal="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title">New Shift</h4>
          <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button>
        </div>
      <div class="modal-body">
        <div class-"containter-fluid">
          <div class="row">
            <input type="hidden" id="departmentID"/>
            <label for="department" class="col-sm-2 col-form-label">Department:</label>
            <div class="col-sm-10">
              <input class="form-control" type="text" name="department" id="department" readonly>
            </div>
            <label for="role" class="col-sm-2 col-form-label">Event:</label>
            <div class="col-sm-10">
              <select id="eventID" name="eventID" class="form-control"></select>
            </div>
            <div class="w-100"></div>
            <label for="role" class="col-sm-2 col-form-label">Role:</label>
            <div class="col-sm-10">
              <select id="role" name="role" class="form-control"></select>
            </div>
            <div class="w-100"></div>
            <label for="startTime" class="col-sm-2 col-form-label">Start Time:</label>
            <div class="col-sm-10">
              <input class="form-control" type="datetime-local" name="startTime" id="startTime" autocomplete="off">
            </div>
            <div class="w-100"></div>
            <label for="endTime" class="col-sm-2 col-form-label">End Time:</label>
            <div class="col-sm-10">
              <input class="form-control" type="datetime-local" name="endTime" id="endTime" autocomplete="off">
            </div>
            <div class="w-100"></div>
            <label for="enabled" class="col-sm-2 col-form-label">Enabled:</label>
            <div class="col-sm-2">
              <input type="checkbox" id="enabled" name="enabled"/>
            </div>
            <div class="w-100"></div>
            <label for="shiftName" class="col-sm-2 col-form-label">Shift Name:</label>
            <div class="col-sm-10">
              <input class="form-control" type="text" name="shiftName" id="shiftName">
            </div>
            <div class="w-100"></div>
            <label for="earlyEntryWindow" class="col-sm-2 col-form-label">Entry/Late Stay Window:</label>
            <div class="col-sm-10">
              <select id="earlyEntryWindow" name="earlyEntryWindow" class="form-control">
                <option value="-2">Late Stay (Monday Evening)</option>
                <option value="-1" selected="selected">Regular Entry (Thursday Morning)</option>
                <option value="0">Wednesday Afternoon (Theme Camp/Art) Early Entry</option>
                <option value="1">Wednesday Morning Infrastructure Setup</option>
                <option value="2">Tuesday Morning Infrastructure Setup</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary col-sm-2" data-dismiss="modal">Close</button>
        <div class="input-group">
          <input type="number" id="copies" class="form-control" placeholder="Copies" aria-label="Copies" aria-describedby="button-addon2">
          <div class="input-group-append">
            <button class="btn btn-outline-secondary" type="button" id="button-addon2" onclick="createCopies();">Create Copies</button>
          </div>
        </div>
        <button type="button" class="btn btn-primary col-sm-2" id="saveticket" onclick="createShift();">Create Shift</button>
      </div>
    </div>
  </div>
</div>';

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
