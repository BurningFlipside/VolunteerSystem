<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-table-new.html');

$page->addWellKnownJS(JS_BOOTBOX);
$page->addJS('../js/wizard.js');

$dataTable = DataSetFactory::getDataTableByNames('fvs', 'certifications');
$certText = '';
$certs = $dataTable->read();
if($certs !== false)
{
    $certCount = count($certs);
    for($i = 0; $i < $certCount; $i++)
    {
        $cert = $certs[$i];
        $certText .= '<label for="requirements.'.$cert['certID'].'" class="col-sm-3 col-form-label">'.$cert['name'].':</label>
          <div class="col-sm-2"><input class="form-control" type="checkbox" name="requirements.'.$cert['certID'].'" id="requirements.'.$cert['certID'].'" disabled/></div>';
    }
}

$page->content['pageHeader'] = 'Roles: <span id="deptName"></span>';
$page->content['table'] = array('id' => 'roles');
$page->content['selectors'] = '<div class="col-sm2"><button type="button" class="btn btn-primary" id="newRoleBtn" onclick="showRoleWizard();">New Role</button></div>';
if(!isset($_GET['dept']))
{
    $page->content['selectors'] .= '<div class="col-sm4"><select class="form-control" id="deptFilter"><option value="*"></option></select></div>';
}
$page->content['body'] = '
<div class="modal fade bd-example-modal-lg" id="roleWizard" tabindex="-1" role="dialog" aria-labelledby="roleWizardTitle" aria-hidden="true" data-backdrop="static" data-complete="newRole">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="roleWizardTitle">New Role</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="row flex-xl-nowrap">
          <div class="col-12 col-md-4 col-xl-3 bd-sidebar">
            <ul class="list-group">
              <li class="list-group-item active">Basic Info</li>
              <li class="list-group-item">Role ID</li>
              <li class="list-group-item">Grouping</li>
              <li class="list-group-item">Requirements</li>
            </ul>
          </div>
          <div class="col-12 col-md-8 col-xl-8 bd-content">
            <div id="roleBasic" class="d-block">
              This is some basic information about the role.
              <div class="row">
                <label for="display_name" class="col-sm-2 col-form-label">Role Name:</label>
                <div class="col-sm-10">
                  <input class="form-control" type="text" name="display_name" id="display_name" required onChange="roleNameUpdated();"/>
                </div>
                <div class="w-100"></div>
                <label for="description" class="col-sm-2 col-form-label">Description:</label>
                <div class="col-sm-10">
                  <input class="form-control" type="text" name="description" id="description" required/>
                </div>
                <div class="w-100"></div>
                <label for="down_time" class="col-sm-2 col-form-label">Down Time Between Shifts:</label>
                <div class="col-sm-10">
                  <input class="form-control" type="number" name="down_time" id="down_time" value="0"/>
                </div>
              </div>
            </div>
            <div id="roleID" class="d-none">
              This system requires a unique ID per role. One has been autopopulated for you, usually you just need to click next.
              <div class="row">
                <label for="short_name" class="col-sm-2 col-form-label">Role ID:</label>
                <div class="col-sm-10">
                  <input class="form-control" type="text" name="short_name" id="short_name" required/>
                </div>
              </div>
            </div>
            <div id="roleGroups" class="d-none">
              You might want to allow groups such as a theme camp to sign up for a shift. Selecting the "Allow Group" options below will allow this.
              You might also want to allow groups to sign up for multiple roles at the same shift time. Select those roles in the list below.
              <div class="row">
                <label for="groups_allowed" class="col-sm-2 col-form-label">Groups Allowed:</label>
                <div class="col-sm-10">
                  <input class="form-control" type="checkbox" name="groups_allowed" id="groups_allowed" onChange="groupsAllowedUpdated();"/>
                </div>
                <div class="w-100"></div>
                <div class="col-sm-12">
                  <select name="grouped_with" id="grouped_with" multiple="multiple" disabled="true">
                  </select>
                </div>
              </div>
            </div>
            <div id="roleReqs" class="d-none">
              Does this role require special training?
              <div class="row">
                <label for="publicly_visible" class="col-sm-2 col-form-label">Anyone allowed:</label>
              <div class="col-sm-10">
                <input class="form-control" type="checkbox" name="publicly_visible" id="publicly_visible" onChange="publiclyVisibleUpdated();" checked/>
              </div>
              <div class="w-100"></div>'.$certText.'
                <div class="w-100"></div>
                <label for="onEmailList" class="col-sm-3 col-form-label">On Email List:</label>
                <div class="col-sm-2">
                  <input class="form-control" type="checkbox" name="onEmailList" id="onEmailList" onChange="onEmailListUpdated();" disabled/>
                </div>
                <div class="w-100"></div>
                <label for="requirements.email_list" class="col-sm-3 col-form-label">Email List:</label>
                <div class="col-sm-10">
                  <textarea class="form-control" name="requirements.email_list" id="requirements.email_list" disabled></textarea>
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
