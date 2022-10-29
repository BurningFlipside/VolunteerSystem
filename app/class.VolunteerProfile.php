<?php
namespace Volunteer;

use \Flipside\Data\Filter as DataFilter;

/**
 * A class to abstract access to a Volunteer System Profile.
 *
 * This class is the primary method to access volunteer information.
 * 
 * @property string $uid The user's ID
 * @property string $email The user's email address
 * @property string $lastName The user's surname (last name)
 * @property string $firstName The user's given name (first name)
 * @property string $burnerName The user's nick name
 * @property array $certs Certifications possessed by the user
 */
class VolunteerProfile extends VolunteerObject
{
    protected $dbData;

    public function __construct($uid, $dbData = null)
    {
        if($uid === '/dev/null')
        {
            return;
        }
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

    public function getDisplayName(string $type = 'webName')
    {
        if($this->dbData === null) {
            return 'Anonymous';
        }
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

    private function getTicketsFromTicketTable($ticketTable, string $email, $year) : array
    {
        if(isset($this->dbData['ticketCode']))
        {
            $code = $this->dbData['ticketCode'];
            $tickets = $ticketTable->read(new DataFilter("contains(hash,$code) and year eq $year"));
            if(!empty($tickets))
            {
                return $tickets;
            }
        }
        return $ticketTable->read(new DataFilter("email eq '$email' and year eq $year"));
    }

    public function getTicketStatus()
    {
        $settingsTable = \Flipside\DataSetFactory::getDataTableByNames('tickets', 'Variables');
        $settings = $settingsTable->read(new DataFilter('name eq \'year\''));
        $year = $settings[0]['value'];
	    $ticketTable = \Flipside\DataSetFactory::getDataTableByNames('tickets', 'Tickets');
	    $email = $this->dbData['email'];
        $tickets = $this->getTicketsFromTicketTable($ticketTable, $email, $year);
        if(empty($tickets))
        {
            $requestTable = \Flipside\DataSetFactory::getDataTableByNames('tickets', 'TicketRequest');
            $requests = $requestTable->read(new DataFilter("mail eq '$email' and year eq $year"));
            if(empty($requests))
            {
                return array('ticket' => false, 'request' => false);
            }
            if($requests[0]['status'] === '1')
            {
                return array('ticket' => false, 'request' => true, 'requestReceived' => true);
            }
            return array('ticket' => false, 'request' => true);
        }
        return array('ticket' => true);
    }
}
