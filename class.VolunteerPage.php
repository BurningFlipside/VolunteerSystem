<?php
require_once('class.SecurePage.php');
require_once('class.FlipSession.php');
require_once('app/VolunteerAutoload.php');
class VolunteerPage extends SecurePage
{
    public  $volunteerRoot;

    function __construct($title)
    {
        parent::__construct($title);
        $root = $_SERVER['DOCUMENT_ROOT'];
        $script_dir = dirname(__FILE__);
        $this->volunteerRoot = substr($script_dir, strlen($root));
        $this->addJSByURI($this->volunteerRoot.'/js/volunteer.js', false);
    }

    function print_page($header=true)
    {
        if($this->user === false || $this->user === null)
        {
            $this->body = '
<div id="content">
    <h1>You must <a href="https://profiles.burningflipside.com/login.php?return='.$this->current_url().'">log in <span class="fa fa-sign-in"></span></a> to access the Burning Flipside Volunteer system!</h1>
</div>';
            $this->add_login_form();
        }
        parent::print_page($header);
    }

    function isAdmin()
    {
        if($this->user === false || $this->user === null)
        {
            return false;
        }
        return $this->user->isInGroupNamed('VolunteerAdmins');
    }

    function isLead()
    {
        if($this->user === false || $this->user === null)
        {
            return false;
        }
        return $this->user->isInGroupNamed('Leads');
    }
}
?>
