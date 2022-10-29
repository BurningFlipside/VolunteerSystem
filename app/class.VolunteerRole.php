<?php
namespace Volunteer;

class VolunteerRole extends VolunteerObject
{
    public function __construct($roleId, $dbData = null)
    {
        parent::__construct($roleId, $dbData, 'roles', 'short_name');
    }

    public function __get($propName)
    {
        switch($propName)
        {
            case 'down_time':
                if(!isset($this->dbData['down_time']))
                {
                    return 0;
                }
                return (int)$this->dbData['down_time'];
            default:
                return parent::__get($propName);
        }
    }
}
