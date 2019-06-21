<?php
class VolunteerProfile
{
    protected $dbData;

    public function __construct($uid, $dbData = null)
    {
        if($dbData === null)
        {
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'participants');
            $filter = new \Data\Filter("uid eq '$uid'");
            $profile = $dataTable->read($filter);
            if(empty($profile))
            {
                throw new Exception('Unable to locate user with ID '.$uid);
            }
            $dbData = $profile[0];
        }
        $this->dbData = $dbData;
    }

    public function __get($propName)
    {
        switch($propName)
        {
            case 'certs':
                if(!isset($this->dbData['certs']))
                {
                    return array();
                }
                return $this->dbData['certs'];
            default:
                return $this->dbData[$propName];
        }
    }

    public function getDisplayName($type = 'webName')
    {
        switch($this->dbData[$type])
        {
            case 'anonymous':
                return 'Anonymous';
            case 'full':
                return $this->dbData['firstName'].' "'.$this->dbData['burnerName'].'" '.$this->dbData['lastName'];
            case 'burnerLast':
                return $this->dbData['burnerName'].' '.$this->dbData['lastName'];
            case 'firstBurner':
                return $this->dbData['firstName'].' '.$this->dbData['burnerName'];
            case 'burner':
                return $this->dbData['burnerName'];
        }
    }

    public function isEEAvailable()
    {
        return isset($this->dbData['firstName']) && isset($this->dbData['lastName']);
    }

    public function userInEmailList($list)
    {
        if(!isset($this->dbData['email']))
        {
            return false;
        }
        if(in_array($this->dbData['email'], $list))
        {
            return true;
        }
        return false;
    }
}
