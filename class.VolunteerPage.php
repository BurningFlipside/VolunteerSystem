<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
if(file_exists('../SecurePage.php'))
{
    require_once('../SecurePage.php');
}
require_once('app/VolunteerAutoload.php');
class VolunteerPage extends \Flipside\Secure\SecurePage
{
    public  $volunteerRoot;

    /**
     * @SuppressWarnings(PHPMD.Superglobals)
     */
    public function __construct($title)
    {
        parent::__construct($title);
        $root = $_SERVER['DOCUMENT_ROOT'];
        $scriptDir = dirname(__FILE__);
        $this->volunteerRoot = substr($scriptDir, strlen($root));
        $this->addJS($this->volunteerRoot.'/js/volunteer.js');
        $this->addTemplateDir(dirname(__FILE__).'/templates', 'Volunteer');
        $this->setTemplateName('@Volunteer/main.html');
        $this->addCSS('https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.7/css/select2.min.css');
        $this->addJS('https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.7/js/select2.min.js', false);
        if($this->isAdmin() || $this->isLead())
        {
            $this->addLink('Admin', '_admin/');
        }
        if($this->user !== false && $this->user !== null)
        {
            $this->addLink('Settings', 'settings.php');
        }
        $split = explode('/', $_SERVER["REQUEST_URI"]);
        $page = end($split);
        $noExt = pathinfo($page, PATHINFO_FILENAME);
        $this->addLink('Help <i class="fas fa-question"></i>', 'docs/help.html#'.$noExt);

        $browser = get_browser();
        if(strpos($browser->parent, 'IE') !== false)
        {
            header('Location: /badBrowser.php');
            exit;
        }
    }

    public function printPage()
    {
        if($this->user === false || $this->user === null)
        {
            $this->body = '
<div id="content">
    <h1>You must <a href="https://profiles.burningflipside.com/login.php?return='.$this->currentURL().'">log in <span class="fa fa-sign-in-alt"></span></a> to access the Burning Flipside Volunteer system!</h1>
</div>';
	}
        parent::printPage();
    }

    public function isAdmin()
    {
        if($this->user === false || $this->user === null)
        {
            return false;
        }
        return $this->user->isInGroupNamed('VolunteerAdmins');
    }

    public function isLead()
    {
        if($this->user === false || $this->user === null)
        {
            return false;
        }
        if($this->user->isInGroupNamed('Leads'))
        {
            return true;
        }
        return false;
    }
}
