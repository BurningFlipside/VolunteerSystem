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

    protected function isUserDepartmentLead($departmentID, $user)
    {
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'departments');
        $filter = new \Data\Filter('departmentID eq '.$departmentID);
        $depts = $dataTable->read($filter);
        if(empty($depts))
        {
            return false;
        }
        return $this->isUserDepartmentLead2($depts[0], $user);
    }

    protected function isUserDepartmentLead2($dept, $user)
    {
        if($user->isInGroupNamed('Leads'))
        {
            if(in_array($dept['lead'], $user->title))
            {
                return true;
            }
        }
        if(!isset($dept['others']))
        {
            return false;
        }
        $email = $user->mail;
        $otherAdmins = explode(',', $dept['others']);
        return in_array($email, $otherAdmins);
    }

    public function isAdminForShift($shift, $user)
    {
        if($this->isAdmin)
        {
            return true;
        }
        if($this->isUserDepartmentLead($shift['departmentID'], $user))
        {
            return true;
        }
        return false;
    }

    public function isAdminForRole($role, $user)
    {
        //Shift and Role use the same key for department ID...
        return $this->isAdminForShift($role, $user);
    }

    protected function shouldShowDepartment($deptId, $isAdmin)
    {
        static $privateDepts = null;
        if($privateDepts === null)
        {
            $privateDepts = VolunteerDepartment::getPrivateDepartments();
        }
        if($isAdmin)
        {
            return true;
        }
        return !in_array($deptId, $privateDepts);
    }

    protected function getParticipantProfile($uid)
    {
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'participants');
        $filter = new \Data\Filter("uid eq '$uid'");
        $profile = $dataTable->read($filter);
        if(empty($profile))
        {
            return null;
        }
        return $profile[0];
    }

    protected function processShift($entry)
    {
        static $profile = null;
        static $eeAvailable = false;
        static $canDoRole = array();
        static $roles = array();
        if($profile === null)
        {
            $profile = $this->getParticipantProfile($this->user->uid);
            if(isset($profile['firstName']) && isset($profile['lastName']))
            {
                $eeAvailable = true;
            }
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'roles');
            $tmp = $dataTable->read();
            foreach($tmp as $role)
            {
               $roles[$role['short_name']] = $role;
            }
        }
        $shift = new \VolunteerShift(false, $entry);
        $entry['isAdmin'] = $this->isAdminForShift($entry, $this->user);
        $entry['overlap'] = $shift->findOverlaps($this->user->uid, true);
        if(!$this->shouldShowDepartment($entry['departmentID'], $entry['isAdmin']))
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
        if($shift->isFilled())
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

    protected function processRole($entry, $request)
    {
        $entry['isAdmin'] = $this->isAdminForRole($entry, $this->user);
        return $entry;
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
