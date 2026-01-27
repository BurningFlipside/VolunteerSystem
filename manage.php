<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');
$page->addJS('js/manage.js');

$page->body .= '
<div class="container text-center">
  <div class="row">
    <div id="shifts"></div>
  </div>
</div>
';

$page->printPage();