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

    protected abstract function isVolunteerAdmin($request);

    public function canUserDoRole($user, $role)
    {
        static $certs = null;
        static $certCount = 0;
        if($certs === null)
        {
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'certifications');
            $certs = $dataTable->read();
            $certCount = count($certs);
        }
        if($role['publicly_visible'] === true)
        {
            return true;
        }
        $requirements = array();
        if(isset($role['requirements']))
        {
            $requirements = $role['requirements'];
        }
        $userCerts = $user->certs;
        if(count($requirements) === 0)
        {
            //Bugged role...
            return true;
        }
        if(isset($requirements['email_list']))
        {
            $emails = explode(',', $requirements['email_list']);
            if(!$user->userInEmailList($emails))
            {
                return array('whyClass' => 'INVITE', 'whyMsg' => 'Shift is invite only.');
            }
        }
        for($i = 0; $i < $certCount; $i++)
        {
            if($this->certCheck($requirements, $userCerts, $certs[$i]['certID']))
            {
                return array('whyClass' => 'CERT', 'whyMsg' => 'Shift requires '.$certs[$i]['name'].' and you do not have that certification');
            }
        }
        return true;
    }

    protected function getParticipantDiplayName($uid)
    {
        static $uids = array();
        if(!isset($uids[$uid]))
        {
            try
            {
                $profile = new \VolunteerProfile($uid);
                $uids[$uid] = $profile->getDisplayName();
            }
            catch(Exception $e)
            {
                $uids[$uid] = $uid;
            }
        }
        return $uids[$uid];
    }

    protected function isUserDepartmentLead($departmentID, $user)
    {
        static $deptCache = array();
        if(!isset($deptCache[$departmentID]))
        {
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'departments');
            $filter = new \Data\Filter('departmentID eq '.$departmentID);
            $depts = $dataTable->read($filter);
            if(empty($depts))
            {
                return false;
            }
            $deptCache[$departmentID] = $depts[0];
        }
        return $this->isUserDepartmentLead2($deptCache[$departmentID], $user);
    }

    protected function userIsLeadCached($user)
    {
        static $userIsLead = null;
        if($userIsLead === null)
        {
            $userIsLead = $user->isInGroupNamed('Leads');
        }
        return $userIsLead;
    }

    protected function isUserDepartmentLead2($dept, $user)
    {
        static $depts = array();
        if(!isset($depts[$dept['departmentID']]))
        {
            $depts[$dept['departmentID']] = array();
        }
        $deptCache = $depts[$dept['departmentID']];
        $uid = $user->uid;
        if(!isset($deptCache[$uid]))
        {
            if(isset($dept['lead']) && $this->userIsLeadCached($user) && is_array($user->title) && in_array($dept['lead'], $user->title))
            {
                $deptCache[$uid] = true;
            }
            else if(!isset($dept['others']))
            {
                $deptCache[$uid] = false;
            }
            else
            {
                $email = $user->mail;
                $otherAdmins = $dept['others'];
                if(!is_array($dept['others']))
                {
                    $otherAdmins = explode(',', $dept['others']);
                }
                $deptCache[$uid] = in_array($email, $otherAdmins);
            }
        }
        return $deptCache[$uid];
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

    protected function doShiftTimeChecks($shift, &$entry)
    {
        $now = new DateTime();
        if($shift->startTime < $now)
        {
            $entry['available'] = false;
            $entry['why'] = 'Shift already started';
        }
        if($shift->endTime < $now)
        {
            $entry['available'] = false;
            $entry['why'] = 'Shift already ended';
        }
        if(strpbrk($entry['startTime'], 'Z+') === false)
        {
            $entry['startTime'] = $shift->startTime->format('c');
            $entry['endTime'] = $shift->endTime->format('c');
        }
    }

    protected function cleanupNonDBFields(&$entry)
    {
        if(isset($entry['volunteer']))
        {
            unset($entry['volunteer']);
        }
        if(isset($entry['why']))
        {
            unset($entry['why']);
        }
        if(isset($entry['whyClass']))
        {
            unset($entry['whyClass']);
        }
    }

    protected function processShift($entry, $request)
    {
        static $profile = null;
        static $eeAvailable = false;
        static $canDoRole = array();
        static $roles = array();
        if($this->isAdmin === null)
        {
            $this->isVolunteerAdmin($request);
        }
        if($profile === null)
        {
            $profile = new \VolunteerProfile($this->user->uid);
            $eeAvailable = $profile->isEEAvailable();
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'roles');
            $tmp = $dataTable->read();
            foreach($tmp as $role)
            {
                $roles[$role['short_name']] = $role;
            }
        }
        $this->cleanupNonDBFields($entry);
        $shift = new \VolunteerShift(false, $entry);
        $entry['isAdmin'] = $this->isAdminForShift($entry, $this->user);
        $entry['overlap'] = $shift->findOverlaps($this->user->uid, true);
        if(!$this->shouldShowDepartment($entry['departmentID'], $entry['isAdmin']))
        {
            return null;
        }
        $entry['available'] = true;
        $this->doShiftTimeChecks($shift, $entry);
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
            if(isset($entry['participant']) && ($entry['participant'] !== '/dev/null' || $entry['participant'] !== ''))
            {
                $entry['volunteer'] = $this->getParticipantDiplayName($entry['participant']);
            }
            if(isset($entry['participant']) && $entry['participant'] === $profile->uid)
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
        if($this->isAdmin === null)
        {
            $this->isVolunteerAdmin($request);
        }
        $entry['isAdmin'] = $this->isAdminForRole($entry, $this->user);
        return $entry;
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
