<?php
namespace Emails;
require_once('Autoload.php');

class VolunteerEmail extends \Email\Email
{
    protected $profile;

    public function __construct($profile)
    {
        parent::__construct();
        $this->profile = $profile;
    }

    public function getFromAddress()
    {
        return 'Burning Flipside Volunteer System <volunteerinfo@burningflipside.com>';
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
