<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');

$page->addWellKnownJS(JS_BOOTBOX);
$page->addWellKnownJS(JS_JQUERY_UI);

$page->body .= '
<div id="content">
  <table id="shifts">
  </table>
</div>';

$page->printPage();
