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

    function add_links()
    {
        if($this->is_admin)
        {
            $this->add_link('Admin', $this->ticket_root.'/_admin/');
        }
        if($this->is_data)
        {
            $this->add_link('Data Entry', $this->ticket_root.'/_admin/data.php');
        }
        parent::add_links();
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
}
?>
