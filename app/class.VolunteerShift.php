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
    protected $myStart = null;
    protected $myEnd = null;

    public function __construct($shiftID, $dbData = null)
    {
        parent::__construct($shiftID, $dbData, 'shifts', '_id');
    }

    public function __get($propName)
    {
        switch($propName)
        {
            case 'startTime':
                if($this->myStart === null)
                {
                    $this->myStart = new \DateTime($this->dbData['startTime']);
                }
                return $this->myStart;
            case 'endTime':
                if($this->myEnd === null)
                {
                    $this->myEnd = new \DateTime($this->dbData['endTime']);
                }
                return $this->myEnd;
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
        if($this->startTime >= $shift->startTime && $this->startTime < $shift->endTime)
        {
            return true;
        }
        if($this->endTime <= $shift->endTime && $this->endTime > $shift->startTime)
        {
            return true;
        }
        return false;
    }

    public function isFilled()
    {
         return isset($this->dbData['status']) && ($this->dbData['status'] === 'pending' || $this->dbData['status'] === 'filled');
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
}
