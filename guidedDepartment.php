<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');
$page->addJS('js/guidedDepartment.js');

$page->body .= '
Awesome! It takes a lot of different kinds of volunteers to make Flipside go. Which department did you want to volunteer for?
<div id="departments"></div>
<br/>
<button type="button" class="btn btn-warning" onclick="location.href=\'guidedEvent.php\';"><i class="fas fa-chevron-left"></i>Select a different event</button>';

$page->printPage();