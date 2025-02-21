<?php
namespace Volunteer\Schedules;

trait ShiftSchedule
{
    public function getRoleNameFromID($roleID)
    {
        static $roles = null;
        if($roles === null)
        {
            $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'roles');
            $tmp = $dataTable->read();
            $roles = array();
            $count = count($tmp);
            for($i = 0; $i < $count; $i++)
            {
                if(isset($tmp[$i]['display_name']))
                {
                    $roles[$tmp[$i]['short_name']] = $tmp[$i]['display_name'];
                    continue;
                }
                $roles[$tmp[$i]['short_name']] = $tmp[$i]['short_name'];
            }
        }
        return $roles[$roleID];
    }

    public function shiftSort($a, $b)
    {
        return strcmp($this->getRoleNameFromID($a['roleID']), $this->getRoleNameFromID($b['roleID']));
    }

    public function shiftTimeSort($a, $b)
    {
        $aDateTime = $a['startTime'];
        if(is_string($a['startTime']))
        {
            $aDateTime = new \DateTime($a['startTime']);
        }
        $bDateTime = $b['startTime'];
        if(is_string($b['startTime']))
        {
            $bDateTime = new \DateTime($b['startTime']);
        }
        $interval = $aDateTime->diff($bDateTime);
        if($interval->invert === 0)
        {
            if($interval->h || $interval->i)
            {
                return -1;
            }
            return 0;
        }
        else if($interval->invert === 1 && ($interval->h || $interval->days))
        {
            return 1;
        }
        //print_r($interval);
        //die();
    }

    public function getStringBetween($string, $start, $end)
    {
        $index = strpos($string, $start);
        if($index === false)
        {
            return $string;
        }
        $index++;
        $len = strpos($string, $end, $index) - $index;
        return substr($string, $index, $len);
    }

    public function daySort($a, $b)
    {
        $aDate = $this->getStringBetween($a, '(', ')');
        $bDate = $this->getStringBetween($b, '(', ')'); 
        return strcasecmp($aDate, $bDate);
    }

    public function groupSort($a, $b)
    {
        $aArr = explode(' ', $a);
        $bArr = explode(' ', $b);
        if($aArr[1] === 'PM' && $bArr[1] === 'AM')
        {
            return 1;
        }
        else if($aArr[1] === 'AM' && $bArr[1] === 'PM')
        {
            return -1;
        }
        return strcmp($a, $b);
    }
}
