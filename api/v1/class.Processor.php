<?php
trait Processor
{
    protected function certCheck($requirements, $certs, $certType)
    {
        if(isset($requirements[$certType]) && $requirements[$certType])
        {
            return (!isset($certs[$certType]) || !$certs[$certType]);
        }
        return false;
    }

    public function canUserDoRole($user, $role)
    {
        if($role['publicly_visible'] === true)
        {
            return true;
        }
        $requirements = array();
        if(isset($role['requirements']))
        {
            $requirements = $role['requirements'];
        }
        $certs = array();
        if(isset($user['certs']))
        {
            $certs = $user['certs'];
        }
        if(count($requirements) === 0)
        {
            //Bugged role...
            return true;
        }
        if(isset($requirements['email_list']))
        {
            $emails = explode(',', $requirements['email_list']);
            if(isset($user['email']) && in_array($user['email'], $emails))
            {
                return true;
            }
            return array('whyClass' => 'INVITE', 'whyMsg' => 'Shift is invite only.');
        }
        if($this->certCheck($requirements, $certs, 'ics100'))
        {
            return array('whyClass' => 'CERT', 'whyMsg' => 'Shift requires ICS 100 and you do not have that certification');
        }
        if($this->certCheck($requirements, $certs, 'ics200'))
        {
            return array('whyClass' => 'CERT', 'whyMsg' => 'Shift requires ICS 200 and you do not have that certification');
        }
        if($this->certCheck($requirements, $certs, 'bls'))
        {
            return array('whyClass' => 'CERT', 'whyMsg' => 'Shift requires Basic Life Support certification and you do not have that certification');
        }
        return true;
    }

    protected function getParticipantDiplayName($uid)
    {
        static $uids = array();
        static $dataTable = null;
        if($dataTable === null)
        {
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'participants');
        }
        if(!isset($uids[$uid]))
        {
            $filter = new \Data\Filter("uid eq '$uid'");
            $profile = $dataTable->read($filter);
            if(empty($profile))
            {
                $uids[$uid] = $uid;
                return $uid;
            }
            $profile = $profile[0];
            switch($profile['webName'])
            {
                case 'anonymous':
                    $uids[$uid] = 'Anonymous';
                    break;
                case 'full':
                    $uids[$uid] = $profile['firstName'].' "'.$profile['burnerName'].'" '.$profile['lastName'];
                    break;
                case 'burnerLast':
                    $uids[$uid] = $profile['burnerName'].' '.$profile['lastName'];
                    break;
                case 'firstBurner':
                    $uids[$uid] = $profile['firstName'].' '.$profile['burnerName'];
                    break;
                case 'burner':
                    $uids[$uid] = $profile['burnerName'];
                    break;
            }
        }
        return $uids[$uid];
    }

    public function shiftOverlaps($shift, $uid)
    {
        static $userShifts = null;
        if($userShifts === null)
        {
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
            $filter = new \Data\Filter("participant eq '$uid'");
            $userShifts = $dataTable->read($filter);
        }
        $count = count($userShifts);
        if($count === 0)
        {
            return false;
        }
        $ret = false;
        $shiftStart = new \DateTime($shift['startTime']);
        $shiftEnd = new \DateTime($shift['endTime']);
        for($i = 0; $i < $count; $i++)
        {
            //Can't overlap with itself
            if($userShifts[$i]['_id']->{'$id'} === $shift['_id']->{'$id'})
            {
                return false;
            }
            $otherStart = new \DateTime($userShifts[$i]['startTime']);
            $otherEnd = new \DateTime($userShifts[$i]['endTime']);
            if($shiftStart >= $otherStart && $shiftStart < $otherEnd)
            {
                $ret = true;
            }
            else if($shiftEnd <= $otherEnd && $shiftEnd > $otherStart)
            {
                $ret = true;
            }
        }
        return $ret;
    }

    public function findOverlaps($shift, $uid)
    {
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $filter = new \Data\Filter("participant eq '$uid'");
        $userShifts = $dataTable->read($filter);
        $res = array();
        $count = count($userShifts);
        $shiftStart = new \DateTime($shift['startTime']);
        $shiftEnd = new \DateTime($shift['endTime']);
        for($i = 0; $i < $count; $i++)
        {
            if($userShifts[$i]['_id']->{'$id'} === $shift['_id']->{'$id'})
            {
                continue;
            }
            $otherStart = new \DateTime($userShifts[$i]['startTime']);
            $otherEnd = new \DateTime($userShifts[$i]['endTime']);
            if($shiftStart >= $otherStart && $shiftStart < $otherEnd)
            {
                array_push($res, $userShifts[$i]);
            }
            else if($shiftEnd <= $otherEnd && $shiftEnd > $otherStart)
            {
                array_push($res, $userShifts[$i]);
            }
        }
        return $res;
    }

    protected function processShift($entry, $request)
    {
        static $profile = null;
        static $eeAvailable = false;
        static $privateDepts = array();
        static $canDoRole = array();
        static $roles = array();
        if($profile === null)
        {
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'participants');
            $uid = $this->user->uid;
            $filter = new \Data\Filter("uid eq '$uid'");
            $profile = $dataTable->read($filter);
            if(empty($profile) && !$this->isVolunteerAdmin($request))
            {
                return null;
            }
            $profile = $profile[0];
            if(isset($profile['firstName']) && isset($profile['lastName']))
            {
                $eeAvailable = true;
            }
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'departments');
            $filter = new \Data\Filter('public eq false');
            $depts = $dataTable->read($filter);
            foreach($depts as $dept)
            {
                array_push($privateDepts, $dept['departmentID']);
            }
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'roles');
            $tmp = $dataTable->read();
            foreach($tmp as $role)
            {
               $roles[$role['short_name']] = $role;
            }
        }
        $entry['isAdmin'] = $this->canUpdate($request, $entry);
        $entry['overlap'] = $this->shiftOverlaps($entry, $this->user->uid);
        if(in_array($entry['departmentID'], $privateDepts) && !$entry['isAdmin'])
        {
            return null;
        }
        $entry['available'] = true;
        $endTime = new DateTime($entry['endTime']);
        $startTime = new DateTime($entry['startTime']);
        $now = new DateTime();
        if($startTime < $now)
        {
            $entry['available'] = false;
            $entry['why'] = 'Shift already started';
        }
        if($endTime < $now)
        {
            $entry['available'] = false;
            $entry['why'] = 'Shift already ended';
        }
        if($entry['earlyLate'] != -1 && !$eeAvailable)
        {
            $entry['available'] = false;
            $entry['why'] = 'Shift requires early entry or late stay and you have not provided your legal name';
        }
        if(!isset($canDoRole[$entry['roleID']]))
        {
            $canDoRole[$entry['roleID']] = $this->canUserDoRole($profile, $roles[$entry['roleID']]);
        }
        if($canDoRole[$entry['roleID']] !== true)
        {
            $entry['available'] = false;
            $entry['why'] = $canDoRole[$entry['roleID']]['whyMsg'];
            $entry['whyClass'] = $canDoRole[$entry['roleID']]['whyClass'];
        }
        if(isset($entry['participant']))
        {
            $entry['volunteer'] = $this->getParticipantDiplayName($entry['participant']);
            if($entry['participant'] === $profile['uid'])
            {
                $entry['available'] = false;
                $entry['why'] = 'Shift is already taken, by you';
                $entry['whyClass'] = 'MINE';
            }
            else
            {
                $entry['available'] = false;
                $entry['why'] = 'Shift is already taken';
                $entry['whyClass'] = 'TAKEN';
            }
            if(!$entry['isAdmin'])
            {
                unset($entry['participant']);
            }
        }
        return $entry;
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
