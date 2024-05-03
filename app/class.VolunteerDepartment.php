<?php
namespace Volunteer;

use \Flipside\Data\Filter as DataFilter;

class VolunteerDepartment extends VolunteerObject
{
    public function __construct($departmentID, $dbData = null)
    {
        parent::__construct($departmentID, $dbData, 'departments', 'departmentID');
    }

    public function getLeadEmails()
    {
        $leadTitle = $this->dbData['lead'];
        $auth = \Flipside\AuthProvider::getInstance();
        $users = $auth->getUsersByFilter(new DataFilter('title eq '.$leadTitle), array('mail'));
        if(empty($users))
        {
            return null;
        }
        $count = count($users);
        for($i = 0; $i < $count; $i++)
        {
            $users[$i] = $users[$i]['mail'];
        }
        return $users;
    }
    
    public function __get($propName)
    {
        switch($propName)
        {
            case 'verboseDataEmail':
                if(isset($this->dbData['verboseDataEmail']))
                {
                    return $this->dbData['verboseDataEmail'];
                }
                return '';
            default:
                return parent::__get($propName);
        }
    }

    public static function getPrivateDepartments() : array
    {
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'departments');
        $filter = new DataFilter('public eq false');
        $departments = $dataTable->read($filter);
        $res = array();
        if(empty($departments))
        {
            return $res;
        }
        $count = count($departments);
        for($i = 0; $i < $count; $i++)
        {
            array_push($res, $departments[$i]['departmentID']);
        }
        return $res;
    }
}
