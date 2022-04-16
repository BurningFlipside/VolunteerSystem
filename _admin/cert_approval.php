<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-table-new.html');

$page->addWellKnownJS(JS_BOOTBOX);
$page->addJS('../js/wizard.js');
$page->addJS('https://cdn.jsdelivr.net/npm/pdfjs-dist@2.13.216/build/pdf.min.js');

$page->content['pageHeader'] = 'Certification Approval';
$page->content['table'] = array('id' => 'certs');

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
