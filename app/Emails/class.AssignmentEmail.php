<?php
namespace Emails;

class AssignmentEmail extends VolunteerEmail
{
    protected $shift;
    protected $assigner; 

    public function __construct($userProfile, $shift, $assigner)
    {
        parent::__construct($userProfile);
        $this->addToAddress($this->profile->email);
        $this->shift = $shift;
        $this->assigner = $assigner;
    }

    public function getSubject()
    {
        return 'Burning Flipside: Assigned to shift';
    }

    public function getHTMLBody()
    {
        return $this->profile->firstName.',<br/>
               You have been assigned to the '.$this->shift->role->display_name.' shift starting '.$this->shift->startTime->format('r').' and ending '.$this->shift->endTime->format('r').' by '.$this->assigner->mail.'.<br/>
               If you feel this was a mistake please reach out to them or the department lead.<br/>
               Thank you,<br/>
               Burning Flipside Volunteer Team';
    }

    public function getTextBody()
    {
        return $this->profile->firstName.',
               You have been assigned to the '.$this->shift->role->display_name.' shift starting '.$this->shift->startTime->format('r').' and ending '.$this->shift->endTime->format('r').' by '.$this->assigner->mail.'.
               If you feel this was a mistake please reach out to them or the department lead.
               Thank you,
               Burning Flipside Volunteer Team';
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
