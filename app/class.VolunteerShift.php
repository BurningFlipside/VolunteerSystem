<?php
/**
 * A class to abstract access to a Volunter System Shift.
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
    protected $webParticipantName = null;

    public function __construct($shiftID, $dbData = null)
    {
        parent::__construct($shiftID, $dbData, 'shifts', '_id');
    }

    public function __get($propName)
    {
        switch($propName)
        {
            case 'modTime':
                if($this->mod === null)
                {
                    $this->mod = new \DateInterval('PT'.strval($this->role->down_time).'H');
                }
                return $this->mod;
            case 'startTime':
                if($this->myStart === null)
                {
                    $this->myStart = new \DateTime($this->dbData['startTime']);
                }
                return $this->myStart;
            case 'startTimeWithMod':
                if($this->modStart === null)
                {
                    $this->modStart = clone $this->startTime;
                    $this->modStart->sub($this->modTime);
                }
                return $this->modStart;
            case 'endTime':
                if($this->myEnd === null)
                {
                    $this->myEnd = new \DateTime($this->dbData['endTime']);
                }
                return $this->myEnd;
            case 'endTimeWithMod':
                if($this->modEnd === null)
                {
                    $this->modEnd = clone $this->endTime;
                    $this->modEnd->add($this->modTime);
                }
                return $this->modEnd;
            case 'department':
                if(!isset(self::$deptCache[$this->dbData['departmentID']]))
                {
                    self::$deptCache[$this->dbData['departmentID']] = new \VolunteerDepartment($this->dbData['departmentID']);
                }
                return self::$deptCache[$this->dbData['departmentID']];
            case 'role':
                if(!isset(self::$roleCache[$this->dbData['roleID']]))
                {
                    self::$roleCache[$this->dbData['roleID']] = new \VolunteerRole($this->dbData['roleID']);
                }
                return self::$roleCache[$this->dbData['roleID']];
            case 'event':
                if(!isset(self::$eventCache[$this->dbData['eventID']]))
                {
                    self::$eventCache[$this->dbData['eventID']] = new \VolunteerEvent($this->dbData['eventID']);
                }
                return self::$eventCache[$this->dbData['eventID']];
            case 'participantObj':
                if($this->participantObj === null)
                {
                    if(isset($this->dbData['participant']) && $this->dbData['participant'] !== '' && $this->dbData['participant'] !== '/dev/null')
                    {
                        $this->participantObj = new \VolunteerProfile($this->dbData['participant']);
                    }
                    else
                    {
                        $this->participantObj = false;
                    }
                }
                return $this->participantObj;
            case 'webParticipantName':
                if($this->webParticipantName === null)
                {
                    if(isset($this->dbData['participant']))
                    {
                        $tmp = new \VolunteerProfile($this->dbData['participant']);
                        $this->webParticipantName = $tmp->getDisplayName();
                    }
                    else
                    {
                        $this->webParticipantName = "";
                    }
                }
                return $this->webParticipantName;
            case 'scheduleParticipantName':
                if($this->scheduleParticipantName === null)
                {
                    if(isset($this->dbData['participant']))
                    {
                        $tmp = new \VolunteerProfile($this->dbData['participant']);
                        $this->scheduleParticipantName = $tmp->getDisplayName('paperName');
                    }
                    else
                    {
                        $this->scheduleParticipantName = "";
                    }
                }
                return $this->scheduleParticipantName;
            default:
                return $this->dbData[$propName];
        }
    }

    public function isSame($shift)
    {
        return $this->dbData['_id'] === $shift->dbData['_id'];
    }

    public function overlaps($shift)
    {
        if($this->isSame($shift))
        {
            return false;
        }
        if($this->startTimeWithMod > $shift->startTimeWithMod && $this->startTimeWithMod < $shift->endTimeWithMod)
        {
            return true;
        }
        if($this->endTimeWithMod < $shift->endTimeWithMod && $this->endTimeWithMod > $shift->startTimeWithMod)
        {
            return true;
        }
        return false;
    }

    public function isFilled()
    {
        return isset($this->dbData['status']) && ($this->dbData['status'] === 'pending' || $this->dbData['status'] === 'filled' || $this->dbData['status'] === 'groupPending');
    }

    public function findOverlaps($uid, $shortCircuit = false)
    {
        static $userShifts = null;
        static $count = 0;
        if($userShifts === null)
        {
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
            $filter = new \Data\Filter("participant eq '$uid'");
            $userShifts = $dataTable->read($filter);
            $count = count($userShifts);
            for($i = 0; $i < $count; $i++)
            {
                $userShifts[$i] = new VolunteerShift(false, $userShifts[$i]);
            }
        }
        $res = array();
        for($i = 0; $i < $count; $i++)
        {
            if($this->overlaps($userShifts[$i]))
            {
                if($shortCircuit === true)
                {
                    return true;
                }
                array_push($res, $userShifts[$i]);
            }
        }
        if($shortCircuit === true)
        {
            return false;
        }
        return $res;
    }

    public function makeCopy($dataTable)
    {
        $tmp = $this->dbData;
        unset($tmp['_id']);
        $dataTable->create($tmp);
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
