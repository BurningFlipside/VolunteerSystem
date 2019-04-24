<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Burning Flipside Volunteer System - Admin');
$page->setTemplateName('admin-accordian.html');

$page->addWellKnownJS(JS_BOOTBOX);

$page->content['pageHeader'] = 'Shifts';
$page->content['panel'] = array();

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
