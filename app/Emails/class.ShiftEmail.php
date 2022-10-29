<?php
namespace Volunteer\Emails;

class ShiftEmail extends VolunteerEmail
{
    protected $shift;
    protected $text;

    public function __construct($shift, $emailTypeSource)
    {
        parent::__construct($shift->participantObj);
        $this->shift = $shift;
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'longText');
        $entries = $dataTable->read(new \Flipside\Data\Filter("id eq $emailTypeSource"));
        if(empty($entries))
        {
            throw new \Exception("Could not locate email with source type $emailTypeSource");
        }
        if(isset($entries['value']))
        {
            $this->text = $entries['value'];
        }
        else if(isset($entries[0]['value']))
        {
            $this->text = $entries[0]['value'];
        }
        $this->addToAddress($this->profile->email);
    }

    public function getSubject()
    {
        return 'Shift Change Notification - Burning Flipside Volunteer System';
    }

    protected function getBody($html = true)
    {
        $firstName = $this->profile->firstName;
        $lastName = $this->profile->lastName;
        $paperName = $this->profile->getDisplayName('paperName');
        $webName = $this->profile->getDisplayName('webName');
        $department = $this->shift->department->departmentName;
        $role = $this->shift->role->display_name;
        $event = $this->shift->event->name;
        $start = $this->shift->startTime->format('r');
        $end = $this->shift->endTime->format('r');
        $vars = array(
                '{$firstName}' => $firstName,
                '{$lastName}' => $lastName,
                '{$paperName}' => $paperName,
                '{$webName}' => $webName,
                '{$department}' => $department,
                '{$role}' => $role,
                '{$event}' => $event,
                '{$start}' => $start,
                '{$end}' => $end
                );
        if(strpos($this->text, '{$newStart}') !== false || strpos($this->text, '{$newEnd}') !== false)
        {
            $newShift = new \VolunteerShift($this->shift->{'_id'});
            $newStart = $newShift->startTime->format('r');
            $newEnd = $newShift->endTime->format('r');
            $vars['{$newStart}'] = $newStart;
            $vars['{$newEnd}'] = $newEnd;
        }
        if($html === true)
        {
            $text = strtr($this->text, $vars);
            return $text;
        }
        $rawText = $this->text;
        $index = strpos($rawText, "<script");
        if($index !== false)
        {
            $end = strpos($rawText, "</script>");
            if($index === 0)
            {
                $rawText = substr($rawText, $end + 9);
            }
        }
        return strtr(strip_tags($rawText), $vars);
    }

    public function getHTMLBody()
    {
        $body = $this->getBody();
        return $body;
    }

    public function getTextBody()
    {
        $body = $this->getBody(false);
        return $body;
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
