<?php
require_once('class.FlipSession.php');
require_once('app/VolunteerAutoload.php');
require_once('../../class.SecurePage.php');
class VolunteerAdminPage extends \Http\FlipAdminPage
{
    use SecureWebPage;

    function __construct($title)
    {
        $this->isLead = false;
        $this->isAuthorized = false;
        parent::__construct($title, 'VolunteerAdmins');
        $this->getAdminInfo();
        $this->addLinks();
        $this->addCSS('https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.7/css/select2.min.css');
        $this->addJS('https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.7/js/select2.min.js');
        //Neither Firefox nor Safari have support for datetime-local. This is roughly equivalent
        $this->addCSS('https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css');
        $this->addJS('https://cdn.jsdelivr.net/npm/flatpickr');
        $this->addJS('js/admin.js');
        $this->addJS('js/dialog.js');
        $this->secure_root = $this->getSecureRoot();
        $this->content['loginUrl'] = $this->secure_root.'api/v1/login';
    }

    protected function getAdminInfo()
    {
        if($this->is_admin === false && $this->user)
        {
            //Is the user a lead or otherwise authorized to manipulate a department?
            $this->isLead = $this->user->isInGroupNamed('Leads');
            if($this->isLead)
            {
                 $this->is_admin = true;
            }
        }
    }

    protected function addLinks()
    {
        $this->content['header']['sidebar'] = array();
        if($this->user === false || $this->user === null)
        {
            return;
        }
        $this->content['header']['sidebar']['Dashboard'] = array('icon' => 'fa-tachometer-alt', 'url' => 'index.php');
        if($this->isLead === false)
        {
            $this->content['header']['sidebar']['Events'] = array('icon' => 'fa-calendar-alt', 'url' => 'events.php');
            $this->content['header']['sidebar']['Departments'] = array('icon' => 'fa-building', 'url' => 'departments.php');
        }
        $charts_menu = array(
            'Shift Schedules' => 'shift_schedules.php',
        );
        $this->content['header']['sidebar']['Roles'] = array('icon' => 'fa-address-card', 'url' => 'roles.php');
        $this->content['header']['sidebar']['Shifts'] = array('icon' => 'fa-tshirt', 'url' => 'shifts.php');
        $this->content['header']['sidebar']['Reports'] = array('icon' => 'fa-chart-bar', 'menu' => $charts_menu);
    }
}
