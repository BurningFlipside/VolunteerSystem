<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');

$page->addJSByURI('js/viewDept.js');

$page->body .= '
<div id="content">
    <form id="department">
    <fieldset id="deptData">
        <legend id="departmentNameRO"></legend>
        <div class="form-group">
            <label class="col-sm-2 control-label">Department Name:</label>
            <div class="col-sm-10">
               <input type="text" class="form-control" name="departmentName" id="departmentName"/>
            </div>
        </div>
        <div class="clearfix visible-sm visible-md visible-lg"></div>
        <div class="form-group">
            <label class="col-sm-2 control-label">Description:</label>
            <div class="col-sm-10">
                <textarea class="form-control" name="description" id="description"></textarea>
            </div>
        </div>
        <div class="clearfix visible-sm visible-md visible-lg"></div>
        <div class="form-group">
            <label class="col-sm-2 control-label">Public Group:</label>
            <div class="col-sm-10">
                <input type="checkbox" class="form-control" name="public" id="public" onchange="publicChanged()"/>
            </div>
        </div>
        <div class="clearfix visible-sm visible-md visible-lg"></div>
        <fieldset id="privateDept">
            <legend>Private Department Info</legend>
            <div class="form-group">
                 <label class="col-sm-2 control-label">Department Visible To:</label>
                 <div class="col-sm-10">
                     <select class="form-control" name="visibleType" id="visibleType" onchange="visibleTypeChanged()">
                         <option value="UserGroup">Only users in Group...</option>
                         <option value="SpecifiedVolunteers">Only specified volunteers...</option>
                     </select>
                 </div>
            </div>
        </fieldset>
        <div class="clearfix visible-sm visible-md visible-lg"></div>
        <div class="panel-group" id="accordion" role="tablist">
          <div class="panel panel-default">
            <div class="panel-heading" role="tab" id="roleHeader">
              <h4 class="panel-title">
                <a role="button" data-toggle="collapse" data-parent="#accordion" href="#roles" aria-expanded="true" aria-controls="roles">
                  Roles
                </a>
              </h4>
            </div>
            <div id="roles" class="panel-collapse collapse" role="tabpanel" aria-labelledby="roleHeader">
              <div class="panel-body">
              </div>
            </div>
          </div>
        </div>
        <div class="clearfix visible-sm visible-md visible-lg"></div>
        <button type="submit" class="btn btn-primary">Submit Changes</button>
        <button type="button" class="btn btn-secondary" onclick="viewShifts();">View Associated Shifts <i class="fa fa-chevron-right"></i></button>
    </fieldset>
    </form>
</div>';

$page->printPage();
