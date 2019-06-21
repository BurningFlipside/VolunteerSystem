<?php
/**
 * A class to abstract access to a Volunter System Profile.
 *
 * This class is the primary method to access volunteer information.
 * 
 * @property string $uid The user's ID
 * @property string $email The user's email address
 * @property string $lastName The user's surname (last name)
 * @property string $firstName The user's given name (first name)
 * @property string $burnerName The user's nick name
 * @property array $certs Certifications possesed by the user
 */
class VolunteerProfile extends VolunteerObject
{
    protected $dbData;

    public function __construct($uid, $dbData = null)
    {
        parent::__construct($uid, $dbData, 'participants', 'uid');
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
