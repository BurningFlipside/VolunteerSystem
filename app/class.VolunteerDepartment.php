<?php
class VolunteerDepartment
{
    protected $dbData;

    public function __construct($departmentID, $dbData = null)
    {
        if($dbData === null)
        {
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'departments');
            $filter = new \Data\Filter('departmentID eq '.$departmentID);
            $depts = $dataTable->read($filter);
            if(empty($depts))
            {
                throw new Exception('Unable to locate department with ID '.$departmentID);
            }
            $dbData = $depts[0];
        }
        $this->dbData = $dbData;
    }

    public function getLeadEmails()
    {
        $leadTitle = $dbData['lead'];
        $auth = \AuthProvider::getInstance();
        $users = $auth->getUsersByFilter(new \Data\Filter('title eq '.$leadTitle), array('mail'));
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
}
