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

    protected function canUserDoRole($user, $role)
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
            return 'Shift is invite only.';
        }
        if($this->certCheck($requirements, $certs, 'ics100'))
        {
            return 'Shift requires ICS 100 and you do not have that certification';
        }
        if($this->certCheck($requirements, $certs, 'ics200'))
        {
            return 'Shift requires ICS 200 and you do not have that certification';
        }
        if($this->certCheck($requirements, $certs, 'bls'))
        {
            return 'Shift requires Basic Life Support certification and you do not have that certification';
        }
        return true;
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
            $entry['why'] = $canDoRole[$entry['roleID']];
        }
        return $entry;
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
