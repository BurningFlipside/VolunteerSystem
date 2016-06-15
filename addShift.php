<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');

$page->addJSByURI('js/shifts.js', false);
$page->addWellKnownJS(JS_BOOTBOX);
$page->addWellKnownJS(JS_JQUERY_UI);

$page->body .= '
<div id="content">
          <div class="form-group">
            <label class="col-sm-2 control-label">Department Name:</label>
            <div class="col-sm-10">
               <select class="form-control" name="departmentName" id="departmentName">
               </select>
            </div>
          </div>
          <div class="clearfix visible-sm visible-md visible-lg"></div>
          <div class="form-group">
            <label class="col-sm-2 control-label">Shift Name:</label>
            <div class="col-sm-10">
               <input type="text" class="form-control" name="shiftName" id="shiftName"/>
            </div>
          </div>
          <div class="clearfix visible-sm visible-md visible-lg"></div>
          <div class="form-group">
            <label class="col-sm-2 control-label">Shift Start:</label>
            <div class="col-sm-10">
               <input type="datetime-local" class="form-control" name="shiftStart" id="shiftStart"/>
            </div>
          </div>
          <div class="clearfix visible-sm visible-md visible-lg"></div>
          <div class="form-group">
            <label class="col-sm-2 control-label">Shift End:</label>
            <div class="col-sm-10">
               <input type="datetime-local" class="form-control" name="shiftEnd" id="shiftEnd"/>
            </div>
          </div>
          <div class="clearfix visible-sm visible-md visible-lg"></div>
          <fieldset>
            <legend>Roles</legend>
            <div id="roles"></div>
            <button class="btn btn-link" title="Add New Role"><i class="fa fa-plus-square-o"></i></button>
            <button class="btn btn-link" title="Add Existing Role"><i class="fa fa-plus-square"></i></button>
          </fieldset>
        </div>
      </div>
    </div>';
$page->printPage();
