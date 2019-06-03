<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Burning Flipside Volunteer System - Admin');
$page->setTemplateName('admin-dashboard.html');

$page->addCard('fa-building', '<div id="deptCount">?</div> Departments', 'departments.php');
$page->addCard('fa-address-card', '<div id="roleCount">?</div> Roles', 'roles.php', $page::CARD_YELLOW);
$page->addCard('fa-tshirt', '<div id="shiftCount">?</div> Shifts', 'shifts.php', $page::CARD_GREEN);
$page->addCard('fa-user', '<div id="volCount">?</div> Volunteers', 'volunteers.php', $page::CARD_BLUE);

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
