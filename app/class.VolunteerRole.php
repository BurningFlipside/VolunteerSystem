<?php
class VolunteerRole extends VolunteerObject
{
    public function __construct($roleid, $dbData = null)
    {
        parent::__construct($roleid, $dbData, 'roles', 'short_name');
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
                return intval($this->dbData['down_time']);
            default:
                parent::__get($propName);
        }
    }
}
