<?php
namespace Volunteer;

class VolunteerEvent extends VolunteerObject
{
    public function __construct($departmentID, $dbData = null)
    {
        parent::__construct($departmentID, $dbData, 'events', '_id');
    }

    private function allEEApproved($eeList, $uid) : bool
    {
        if(isset($eeList[$uid]) && $eeList[$uid]['AAR'] === true && $eeList[$uid]['AF'] === true && $eeList[$uid]['Lead'] === true)
        {
            return true;
        }
        return false;
    }

    public function hasVolOnEEList($uid, $eeListIndex) : bool
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
            return $this->allEEApproved($eeList, $uid);
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
        if(!isset($this->dbData['eeLists'][$eeListIndex][$uid]))
        {
            $this->dbData['eeLists'][$eeListIndex][$uid] = array('AAR'=>false, 'AF'=>false, 'Lead'=>false);
            $dataTable = $this->getDataTable();
            $filter = $this->getDataFilter();
            return $dataTable->update($filter, $this->dbData);
        }
        return true;
    }

    private function getOtherEETypesThatInclude(int $eeType) : array
    {
        switch($eeType)
        {
            case -2: //Late Stay doesn't include others
            default:
                return array();
            case 0:
                return array(-2);
            case 1:
                //Wednesday Morning includes Wednesday Afternoon
                return array(0, -2);
            case 2:
                return array(1, 0, -2);

        }
    }

    private function setOtherType($uid, $eeListIndex, $type)
    {
        if(isset($this->dbData['eeLists'][$eeListIndex][$uid]))
        {
            return $this->approveEE($uid, $eeListIndex, $type);
        }
        return true; //This is fine, skip it
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
            $dataTable = $this->getDataTable();
            $filter = $this->getDataFilter();
            $ret = $dataTable->update($filter, $this->dbData);
            if($ret)
            {
                $otherTypes = $this->getOtherEETypesThatInclude($eeListIndex);
                $count = count($otherTypes);
                for($i = 0; $i < $count; $i++)
                {
                    $ret = $this->setOtherType($uid, $otherTypes[$i], $type);
                    if($ret === false)
                    {
                        return $ret;
                    }
                }
                return $ret;
            }
        }
        return $ret;
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
