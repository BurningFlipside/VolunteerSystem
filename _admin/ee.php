<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-table-new.html');

$page->addWellKnownJS(JS_BOOTBOX);

$aar = $page->user->isInGroupNamed('AAR');
$af = $page->user->isInGroupNamed('AFs');
$lead = $page->user->isInGroupNamed('Leads');

$page->content['pageHeader'] = 'Early Entry: <span id="deptName"></span>';
$page->content['bodyTags'] = 'data-AAR="'.$aar.'" data-AF="'.$af.'" data-lead="'.$lead.'"';
$page->content['table'] = array('id' => 'ee');
$page->content['selectors'] = '';
$page->content['selectors'] .= '
    <label for="eventFilter" class="col-sm-2 col-form-label">Event:</label>
    <div class="col-sm-4"><select class="form-control" id="eventFilter"><option value="*"></option></select></div><div class="w-100"></div>';
$page->content['selectors'] .= '
    <label for="deptFilter" class="col-sm-2 col-form-label">Department:</label>
    <div class="col-sm-4"><select class="form-control" id="deptFilter"><option value="*"></option></select></div>';

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
