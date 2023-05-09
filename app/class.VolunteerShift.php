<?php
namespace Volunteer;

use \DateInterval as DateInterval;
use \DateTime  as DateTime;
use \Flipside\Data\Filter as DataFilter;

/**
 * A class to abstract access to a Volunteer System Shift.
 *
 * This class is the primary method to access shift information.
 *
 * @property string $_id The shift's ID
 * @property string $departmentID The shift's department
 * @property string $eventID The shift's event
 * @property string $roleID The shift's role
 * @property DateTime $startTime The shifts's starting time
 * @property DateTime $endTime The shifts's ending time
 * @property boolean $enabled Is the shift available for signup
 * @property string $earlyLate The shift's Early Entry/Late Stay status
 */
class VolunteerShift extends VolunteerObject
{
    protected static $deptCache = array();
    protected static $roleCache = array();
    protected static $eventCache = array();
    protected $mod = null;
    protected $myStart = null;
    protected $myEnd = null;
    protected $modStart = null;
    protected $modEnd = null;
    protected $participantObj = null;

    public function __construct($shiftID, $dbData = null)
    {
        parent::__construct($shiftID, $dbData, 'shifts', '_id');
    }

    protected function getModTime() : DateInterval
    {
        if($this->mod === null)
        {
            $this->mod = new DateInterval('PT0H');
            if($this->role->down_time !== 0)
            {
                $this->mod = new DateInterval('PT'.(string)(intval($this->role->down_time,10)-1).'H59M');   
            }
        }
        return $this->mod;
    }

    protected function getStartTime() : DateTime
    {
        if($this->myStart === null)
        {
            $this->myStart = new DateTime($this->dbData['startTime']);
        }
        return $this->myStart;
    }

    protected function getStartTimeWithModification() : DateTime
    {
        if($this->modStart === null)
        {
            $this->modStart = clone $this->startTime;
            $this->modStart->sub($this->modTime);
        }
        return $this->modStart;
    }

    protected function getEndTime() : DateTime
    {
        if($this->myEnd === null)
        {
            $this->myEnd = new DateTime($this->dbData['endTime']);
        }
        return $this->myEnd;
    }

    protected function getEndTimeWithModification() : DateTime
    {
        if($this->modEnd === null)
        {
            $this->modEnd = clone $this->endTime;
            $this->modEnd->add($this->modTime);
        }
        return $this->modEnd;
    }

    protected function getDepartment() : VolunteerDepartment
    {
        if(!isset(self::$deptCache[$this->dbData['departmentID']]))
        {
            self::$deptCache[$this->dbData['departmentID']] = new VolunteerDepartment($this->dbData['departmentID']);
        }
        return self::$deptCache[$this->dbData['departmentID']];
    }

    protected function getRole() : VolunteerRole
    {
        if(!isset(self::$roleCache[$this->dbData['roleID']]))
        {
            self::$roleCache[$this->dbData['roleID']] = new VolunteerRole($this->dbData['roleID']);
        }
        return self::$roleCache[$this->dbData['roleID']];
    }

    protected function getEvent() : VolunteerEvent
    {
        if(!isset(self::$eventCache[$this->dbData['eventID']]))
        {
            self::$eventCache[$this->dbData['eventID']] = new VolunteerEvent($this->dbData['eventID']);
        }
        return self::$eventCache[$this->dbData['eventID']];
    }

    protected function getParticipantObj() : VolunteerProfile|false
    {
        if($this->participantObj === null)
        {
            if(!isset($this->dbData['participant']) || $this->dbData['participant'] === '' || $this->dbData['participant'] === '/dev/null')
            {
                return false;
            }
            $this->participantObj = new VolunteerProfile($this->dbData['participant']);
        }
        return $this->participantObj;
    }

    protected function getParticipantName(string $type = 'webName')
    {
        $part = $this->getParticipantObj();
        if($part) 
        {
            return $part->getDisplayName($type);
        }
        return '';
    }

    protected function getParticipant()
    {
        if(isset($this->dbData['participant']))
        {
            return $this->dbData['participant'];
        }
        return '';
    }

    /**
     * @SuppressWarnings(PHPMD.CyclomaticComplexity)
     */
    public function __get($propName)
    {
        switch($propName)
        {
            case 'modTime':
                return $this->getModTime();
            case 'startTime':
                return $this->getStartTime();
            case 'startTimeWithMod':
                return $this->getStartTimeWithModification();
            case 'endTime':
                return $this->getEndTime();
            case 'endTimeWithMod':
                return $this->getEndTimeWithModification();
            case 'department':
                return $this->getDepartment();
            case 'role':
                return $this->getRole();
            case 'event':
                return $this->getEvent();
            case 'participantObj':
                return $this->getParticipantObj();
            case 'webParticipantName':
                return $this->getParticipantName();
            case 'scheduleParticipantName':
                return $this->getParticipantName('paperName');
            case 'participant':
                return $this->getParticipant();
            default:
                return $this->dbData[$propName];
        }
    }

    public function isSame($shift)
    {
        return (string)$this->dbData['_id'] === (string)$shift->dbData['_id'];
    }

    private function doShiftsOverlap($moreDown, $lessDown)
    {
        if($moreDown->startTimeWithMod >= $lessDown->startTime && $moreDown->startTimeWithMod <= $lessDown->endTime)
        {
            return true;
        }
        if($moreDown->endTimeWithMod <= $lessDown->endTime && $moreDown->endTimeWithMod > $lessDown->startTime)
        {
            return true;
        }
        return false;
    }

    public function overlaps($shift)
    {
        if($this->isSame($shift))
        {
            return false;
        }
        //Does this shift or the other have a bigger down time requirement...
        if($this->role->down_time > $shift->role->down_time)
        {
            return $this->doShiftsOverlap($this, $shift);
        }
        return $this->doShiftsOverlap($shift, $this);
    }

    public function isFilled()
    {
        return isset($this->dbData['status']) && ($this->dbData['status'] === 'pending' || $this->dbData['status'] === 'filled' || $this->dbData['status'] === 'groupPending');
    }

    public function findAllOverlaps($uid) : array
    {
        static $userShifts = null;
        static $lastUid = null;
        static $count = 0;
        if($lastUid !== $uid)
        {
            $userShifts = null;
        }
        if($userShifts === null)
        {
            $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
            $filter = new DataFilter("participant eq '$uid'");
            $userShifts = $dataTable->read($filter);
            $count = count($userShifts);
            for($i = 0; $i < $count; $i++)
            {
                $userShifts[$i] = new VolunteerShift(false, $userShifts[$i]);
            }
            $lastUid = $uid;
        }
        $res = array();
        for($i = 0; $i < $count; $i++)
        {
            if($this->overlaps($userShifts[$i]))
            {
                array_push($res, $userShifts[$i]);
            }
        }
        return $res;
    }

    public function doAnyOverlap($uid) : bool
    {
        static $userShifts = null;
        static $lastUid = null;
        static $count = 0;
        if($lastUid !== $uid)
        {
            $userShifts = null;
        }
        if($userShifts === null)
        {
            $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
            $filter = new DataFilter("participant eq '$uid'");
            $userShifts = $dataTable->read($filter);
            $count = count($userShifts);
            for($i = 0; $i < $count; $i++)
            {
                $userShifts[$i] = new VolunteerShift(false, $userShifts[$i]);
            }
            $lastUid = $uid;
        }
        for($i = 0; $i < $count; $i++)
        {
            if($this->overlaps($userShifts[$i]))
            {
                return true;
            }
        }
        return false;
    }

    public function makeCopy($dataTable)
    {
        $tmp = $this->dbData;
        unset($tmp['_id']);
        $dataTable->create($tmp);
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
