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
        <li><a href="schedule.php">View My Shift Schedule</a></li>';

if($page->isAdmin())
{
    $page->body .= '<li><a href="viewAll.php">View All Departments</a></li>';
}
else if($page->isLead())
{
    $page->body .= '<li><a href="viewDept.php">View My Department</a></li>';
}

$page->body .= '
    </ul>
</div>';

$page->printPage();
