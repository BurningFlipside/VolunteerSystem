<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');

$page->body .= '
<div id="content">
    <div id="departments" class="list-group">';
if($page->isAdmin())
{
    $page->body .= '<a href="addDept.php" class="list-group-item">Add New Department<i class="fa fa-plus pull-right"></i></a>';
}
$page->body .= '
    </div>
</div>';

$page->printPage();
