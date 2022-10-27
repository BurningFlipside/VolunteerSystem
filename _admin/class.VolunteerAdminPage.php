<?php
require_once('../app/VolunteerAutoload.php');
require_once('../../class.SecurePage.php');
class VolunteerAdminPage extends \Flipside\Http\FlipAdminPage
{
    use SecureWebPage;

    public $isLead;
    public $isAuthorized;
    public $secure_root;

    public function __construct($title)
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
        $this->addJS('../js/dialog.js');
        $this->secure_root = $this->getSecureRoot();
        $this->content['loginUrl'] = $this->secure_root.'api/v1/login';
        $split = explode('/', $_SERVER["REQUEST_URI"]);
        $page = end($split);
        $noExt = pathinfo($page, PATHINFO_FILENAME);
        $this->addLink('Help <i class="fas fa-question"></i>', '../docs/admin_help.html#'.$noExt);
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
                return;
            }
            //Is this user the assistant for a department?
            $uid = $this->user->uid;
            $email = $this->user->mail;
            $filter = new \Flipside\Data\Filter("others eq $uid or others eq $email");
            $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'departments');
            $depts = $dataTable->read($filter);
            $this->isLead = !empty($depts);
            $this->is_admin = true;
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
        $chartsMenu = array(
            'Shift Schedules' => 'shift_schedules.php',
            'Shift Stats' => 'shift_stats.php',
            'T-Shirts' => 'tshirts.php',
            'Participant Shifts' => 'vol_shifts.php',
            'Volunteers without Shifts' => 'no_shifts.php',
            'Volunteers without Tickets' => 'report_no_ticket.php',
            'Empty Shifts' => 'report_empty_shifts.php'
        );
        if($this->user->isInGroupNamed('Leads') || $this->user->isInGroupNamed('VolunteerAdmins'))
        {
            $chartsMenu['Early Entry'] = 'report_early_entry.php';
        }
        $shiftsMenu = array(
            'Add/Edit Shifts' => 'shifts.php',
            'Pending Shifts' => 'pending.php',
            'Early Entry/Late Stay Approval' => 'ee.php',
            'Copy from prior event' => 'copy_shifts.php'
        );
        $certBadge = $this->getCertBadge();
        $this->content['header']['sidebar']['Roles'] = array('icon' => 'fa-address-card', 'url' => 'roles.php');
        $this->content['header']['sidebar']['Shifts'] = array('icon' => 'fa-tshirt', 'menu' => $shiftsMenu);
        $this->content['header']['sidebar']['Volunteers'] = array('icon' => 'fa-user', 'url' => 'volunteers.php');
        $this->content['header']['sidebar']['Certification Approval '.$certBadge] = array('icon' => 'fa-stamp', 'url' => 'cert_approval.php');
        $this->content['header']['sidebar']['Reports'] = array('icon' => 'fa-chart-bar', 'menu' => $chartsMenu);
        $this->content['header']['sidebar']['Contact'] = array('icon' => 'fa-envelope', 'url' => 'contact.php');
        if($this->user && $this->user->isInGroupNamed('VolunteerAdmins'))
        {
            $adminMenu = array(
                'Email Text' => 'emails.php',
                'Certifications' => 'certs.php'
            );
            $this->content['header']['sidebar']['Admin'] = array('icon' => 'fa-cog', 'menu' => $adminMenu);
        }
    }

    private function getCertBadge()
    {
        $certApprovalCount = 0;
        $certTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'certifications');
        $userTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'participants');
        $certs = $certTable->read();
        if($certs !== false)
        {
            $count = count($certs);
            for($i = 0; $i < $count; $i++)
            {
                $filter = new \Flipside\Data\Filter('certs.'.$certs[$i]['certID'].'.status eq pending');
                $users = $userTable->read($filter);
                $certApprovalCount += count($users);
            }
        }
        $certBadge = '';
        if($certApprovalCount > 0)
        {
            $certBadge = '<span class="badge badge-secondary">'.$certApprovalCount.'</span>';
        }
        return $certBadge;
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
