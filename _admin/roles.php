<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Burning Flipside Volunteer System - Admin');
$page->setTemplateName('admin-table-new.html');

$page->addWellKnownJS(JS_BOOTBOX);

$page->content['pageHeader'] = 'Roles: <span id="deptName"></span>';
$page->content['table'] = array('id' => 'roles');
$page->content['selectors'] = '<button type="button" class="btn btn-primary" onclick="newRole();">New Role</button>';

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
