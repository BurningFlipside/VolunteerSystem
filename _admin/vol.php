<?php
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
require_once('class.VolunteerAdminPage.php');
$page = new VolunteerAdminPage('Volunteer System Admin');
$page->setTemplateName('admin-table-new.html');
$page->addJS('//unpkg.com/xlsx/dist/xlsx.full.min.js');

$page->content['pageHeader'] = 'Volunteer Details';
$page->content['table'] = array('id' => 'shifts');
$page->content['selectors'] = '<label for="firstName" class="col-sm-2 col-form-label">First Name:</label>
<div class="col-sm-10">
  <input class="form-control" type="text" name="firstName" id="firstName"/>
</div>
<div class="w-100"></div>
<label for="lastName" class="col-sm-2 col-form-label">Last Name:</label>
<div class="col-sm-10">
  <input class="form-control" type="text" name="lastName" id="lastName"/>
</div>
<div class="w-100"></div>
<label for="burnerName" class="col-sm-2 col-form-label">Burner Name:</label>
<div class="col-sm-10">
  <input class="form-control" type="text" name="burnerName" id="burnerName"/>
</div>
<div class="w-100"></div>
<label for="campName" class="col-sm-2 col-form-label">Camp Name:</label>
<div class="col-sm-10">
  <input class="form-control" type="text" name="campName" id="campName"/>
</div>
<div class="w-100"></div>
<div id="certs"></div>
<div class="w-100"></div>';

$page->printPage();