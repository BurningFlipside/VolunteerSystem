<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Burning Flipside Volunteer System - Admin');
$page->setTemplateName('admin-table-new.html');

$page->addWellKnownJS(JS_BOOTBOX);

$page->content['pageHeader'] = 'Departments';
$page->content['table'] = array('id' => 'depts');
if($page->user->isInGroupNamed('VolunteerAdmins'))
{
    $page->content['selectors'] = '<button type="button" class="btn btn-primary" onclick="newDepartment();">New Department</button>';
}

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
