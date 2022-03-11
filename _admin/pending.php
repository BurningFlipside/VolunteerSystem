<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-table-new.html');

$page->addWellKnownJS(JS_BOOTBOX);

$page->content['pageHeader'] = 'Pending Shifts: <span id="deptName"></span>';
$page->content['table'] = array('id' => 'pendingShifts');
$page->content['selectors'] = '<div class="col-sm4"><select class="form-control" id="deptFilter"><option value="*"></option></select></div>';

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
