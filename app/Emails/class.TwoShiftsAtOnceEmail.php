<?php
namespace Emails;

class TwoShiftsAtOnceEmail extends VolunteerEmail
{
    public function __construct($userProfile)
    {
        parent::__construct($userProfile);
    }

    public function getSubject()
    {
        return 'Burning Flipside: Volunteer Signed up for two shifts at once';
    }

    public function addLeads($leads)
    {
        $count = count($leads);
        for($i = 0; $i < $count; $i++)
        {
            $this->addToAddress($leads[$i]);
        }
    }

    protected function getApprovalLink()
    {
        $settings = \Settings::getInstance();
        $profilesUrl = $settings->getGlobalSetting('secure_url', 'https://secure.burningflipside.com');
        return $profilesUrl.'/fvs/_admin/pending.php';
    }

    public function getHTMLBody()
    {
        return 'You are recieving this message because you are a lead for a Burning Flipside department.<br/>
                A volunteer with the name '.$this->profile->getDisplayName('paperName').' has signed up for two shifts at once, at least one of which is in your department.<br/>
                This requires explicit approval or disapproval from you. You can provide that by following <a href="'.$this->getApprovalLink().'">this link</a>.<br/>
                If you take no action the shifts will remain in a pending state, which means no one else can sign up for them, but the volunteer is not sure if they have the shifts or not.<br/>
                Thank you,<br/>
                Burning Flipside Volunteer Team';
    }

    public function getTextBody()
    {
        return 'You are recieving this message because you are a lead for a Burning Flipside department.
                A volunteer with the name '.$this->profile->getDisplayName('paperName').' has signed up for two shifts at once, at least one of which is in your department.
                This requires explicit approval or disapproval from you. You can provide that by following the link below.
                '.$this->getApprovalLink().'
                If you take no action the shifts will remain in a pending state, which means no one else can sign up for them, but the volunteer is not sure if they have the shifts or not.
                Thank you,
                Burning Flipside Volunteer Team';
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
