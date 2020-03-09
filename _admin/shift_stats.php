<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-table-new.html');
$page->addJS('//unpkg.com/xlsx/dist/xlsx.full.min.js');

$page->content['pageHeader'] = 'Shift Statistics <button type="button" class="btn btn-link" onClick="tableToCSV();"><i class="fas fa-file-csv"></i></button>';
$page->content['table'] = array('id' => 'shift_stats');
$page->content['selectors'] = '<label for="event" class="col-sm-2 col-form-label">Event</label>
  <div class="col-sm-10">
    <select class="form-control" id="event"></select>
  </div>
';

$page->printPage();
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
