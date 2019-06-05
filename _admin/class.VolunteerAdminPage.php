<?php
require_once('class.FlipSession.php');
require_once('app/VolunteerAutoload.php');
require_once('../../class.SecurePage.php');
class VolunteerAdminPage extends \Http\FlipAdminPage
{
    use SecureWebPage;

    function __construct($title)
    {
        parent::__construct($title, 'VolunteerAdmins');
        $this->addLinks();
        $this->addCSS('https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.7/css/select2.min.css');
        $this->addJS('https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.7/js/select2.min.js');
    }

    function addLinks()
    {
        $this->content['header']['sidebar'] = array();
        if($this->user === false && $this->user === null)
        {
            return;
        }
        $this->content['header']['sidebar']['Dashboard'] = array('icon' => 'fa-tachometer-alt', 'url' => 'index.php');
        $this->content['header']['sidebar']['Events'] = array('icon' => 'fa-calendar-alt', 'url' => 'events.php');
        $this->content['header']['sidebar']['Departments'] = array('icon' => 'fa-building', 'url' => 'departments.php');
        $this->content['header']['sidebar']['Shifts'] = array('icon' => 'fa-tshirt', 'url' => 'shifts.php');
    }
}
