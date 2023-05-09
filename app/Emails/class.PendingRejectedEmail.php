<?php
namespace Volunteer\Emails;

class PendingRejectedEmail extends VolunteerEmail
{
    public function __construct($userProfile)
    {
        parent::__construct($userProfile);
        $this->addToAddress($userProfile->email);
    }

    public function getSubject()
    {
        return 'Burning Flipside: Volunteer Shift removed';
    }

    public function setShift($shift)
    {
        $this->shift = $shift;
    }

    public function getHTMLBody()
    {
        return 'You are recieving this message because your pending shift for '.$this->shift['roleID'].' starting at '.$this->shift['startTime'].' has been removed.<br/>
                Thank you for your interest in this shift, but we could not accomidate your request for this shift at this time.<br/>
                Thank you,<br/>
                Burning Flipside Volunteer Team';
    }

    public function getTextBody()
    {
        return 'You are recieving this message because your pending shift for '.$this->shift['roleID'].' starting at '.$this->shift['startTime'].' has been removed.
                Thank you for your interest in this shift, but we could not accomidate your request for this shift at this time.
                Thank you,
                Burning Flipside Volunteer Team';
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
