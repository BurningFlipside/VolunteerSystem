<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');

$page->body .= '
<div id="content">
    <h1>Welcome to the Burning Flipside Volunteer System</h1>
    <p></p>
    <h1>What would you like to do?</h1>
    <ul>
        <li><a href="shifts.php">View Available Shifts</a></li>
        <li><a href="schedule.php">View My Shift Schedule</a></li>
    </ul>
</div>';

$page->printPage();
