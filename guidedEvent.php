<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');
$page->addJS('js/guidedEvent.js');

$page->body .= '
Hi! Welcome to the Flipside Volunteer System. As you may know, Flipside is not just an event, but a thriving year round community. Therefore we have lots of different things for people to volunteer for. Which event would you like to volunteer for?
<div id="events"></div>';

$page->printPage();