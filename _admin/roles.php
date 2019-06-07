<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-table-new.html');

$page->addWellKnownJS(JS_BOOTBOX);

$page->content['pageHeader'] = 'Roles: <span id="deptName"></span>';
$page->content['table'] = array('id' => 'roles');
$page->content['selectors'] = '<div class="col-sm2"><button type="button" class="btn btn-primary" id="newRoleBtn" onclick="newRole();">New Role</button></div>';
if(!isset($_GET['dept']))
{
    $page->content['selectors'].='<div class="col-sm4"><select class="form-control" id="deptFilter"><option value="*"></option></select></div>';
}

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
