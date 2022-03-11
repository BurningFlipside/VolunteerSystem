<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-table-new.html');

$page->addWellKnownJS(JS_BOOTBOX);
$page->addJS('../js/wizard.js');

$page->content['pageHeader'] = 'Certification';
$page->content['table'] = array('id' => 'certs');
if($page->user && $page->user->isInGroupNamed('VolunteerAdmins'))
{
    $page->content['selectors'] = '<button type="button" class="btn btn-primary" onclick="newCert();">New Cert</button>';
}

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
