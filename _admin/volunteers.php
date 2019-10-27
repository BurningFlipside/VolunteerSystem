<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-table-new.html');

$page->addWellKnownJS(JS_BOOTBOX);

$page->content['pageHeader'] = 'Volunteers';
$page->content['table'] = array('id' => 'vols');

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
