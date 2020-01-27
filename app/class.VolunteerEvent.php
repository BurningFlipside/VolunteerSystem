<?php
class VolunteerEvent extends VolunteerObject
{
    public function __construct($departmentID, $dbData = null)
    {
        parent::__construct($departmentID, $dbData, 'events', '_id');
    }

    public function hasVolOnEEList($uid, $eeListIndex)
    {
        if($eeListIndex === 1 || $eeListIndex === 0)
        {
            //Check earlier EE lists too
            $val = $this->hasVolOnEEList($uid, $eeListIndex+1);
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
}
