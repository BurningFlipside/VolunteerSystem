<?php
class VolunteerEvent extends VolunteerObject
{
    public function __construct($departmentID, $dbData = null)
    {
        parent::__construct($departmentID, $dbData, 'events', '_id');
    }

    public function hasVolOnEEList($uid, $eeListIndex)
    {
        $uid = urlencode($uid);
        $uid = str_replace('.', '%2E', $uid);
        if($eeListIndex === 1 || $eeListIndex === 0)
        {
            //Check earlier EE lists too
            $val = $this->hasVolOnEEList($uid, $eeListIndex + 1);
            if($val === true)
            {
                return true;
            }
        }
        if(isset($this->dbData['eeLists']) && isset($this->dbData['eeLists'][$eeListIndex]))
        {
            $eeList = $this->dbData['eeLists'][$eeListIndex];
            if(isset($eeList[$uid]) && $eeList[$uid]['AAR'] === true && $eeList[$uid]['AF'] === true && $eeList[$uid]['Lead'] === true)
            {
                return true;
            }
        }
        return false;
    }

    public function addToEEList($uid, $eeListIndex)
    {
        $uid = urlencode($uid);
        $uid = str_replace('.', '%2E', $uid);
        if(!isset($this->dbData['eeLists']))
        {
            $this->dbData['eeLists'] = array();
        }
        if(!isset($this->dbData['eeLists'][$eeListIndex]))
        {
            $this->dbData['eeLists'][$eeListIndex] = array();
        }
        $eeList = $this->dbData['eeLists'][$eeListIndex];
        if(!isset($this->dbData['eeLists'][$eeListIndex][$uid]))
        {
            $this->dbData['eeLists'][$eeListIndex][$uid] = array('AAR'=>false, 'AF'=>false, 'Lead'=>false);
            $dt = $this->getDataTable();
            $filter = $this->getDataFilter();
            return $dt->update($filter, $this->dbData);
        }
        return true;
    }

    public function approveEE($uid, $eeListIndex, $type)
    {
        $ret = false;
        switch($type)
        {
            case 'aar':
                $this->dbData['eeLists'][$eeListIndex][$uid]['AAR'] = true;
                $ret = true;
                break;
            case 'af':
                $this->dbData['eeLists'][$eeListIndex][$uid]['AF'] = true;
                $ret = true;
                break;
            case 'lead':
                $this->dbData['eeLists'][$eeListIndex][$uid]['Lead'] = true;
                $ret = true;
                break;
        }
        if($ret)
        {
            $dt = $this->getDataTable();
            $filter = $this->getDataFilter();
            return $dt->update($filter, $this->dbData);
        }
        return $ret;
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
