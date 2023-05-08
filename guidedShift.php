<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');
$page->addJS('js/guidedShift.js');

$page->body .= '
Great! Here are the available shifts currently available for that department and that event.
<div id="shifts"></div>
<br/>
<button type="button" class="btn btn-warning" id="back" onclick="location.href=\'guidedDepartment.php?eventID='.$_GET['eventID'].'\';"><i class="fas fa-chevron-left"></i>Select a different department</button>';

$page->printPage();