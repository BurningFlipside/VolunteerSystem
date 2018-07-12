<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');

$page->addWellKnownJS(JS_BOOTBOX);
$page->addWellKnownJS(JS_JQUERY_UI);

$page->body .= '
<div id="content">
';
if($page->isAdmin() || $page->isLead())
{
$page->body .= '
  <div class="row">
    <div class="col-md-4">
      <div class="panel panel-default" style="cursor: pointer;" onclick="addNewShift()">
        <div class="panel-heading">Add New Shift</div>
        <div class="panel-body" style="text-align: center;"><i class="fa fa-plus" style="font-size: 7em;"></i></div>
      </div>
    </div>
  </div>
  ';
}
$page->body .= '
</div>';

$page->printPage();
