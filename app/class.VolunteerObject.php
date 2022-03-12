<?php
class VolunteerObject
{
    protected $tableName;
    protected $dbData;
    protected $index;
    protected $id;

    public function __construct($id, $dbData, $tableName, $index)
    {
        $this->tableName = $tableName;
        $this->index = $index;
        if($dbData === null)
        {
            $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', $tableName);
            $filter = new \Flipside\Data\Filter($index.' eq '.$id);
            $objs = $dataTable->read($filter);
            if(empty($objs))
            {
                throw new Exception('Unable to locate object with ID '.$id);
            }
            $dbData = $objs[0];
            $this->id = $id;
            $this->dbData = $dbData;
            return;
        }
        $this->id = $dbData[$index];
        $this->dbData = $dbData;
    }

    public function getDataTable()
    {
        return \Flipside\DataSetFactory::getDataTableByNames('fvs', $this->tableName);
    }

    public function getDataFilter()
    {
        return new \Flipside\Data\Filter($this->index.' eq '.$this->id);
    }

    public function __get($propName)
    {
        return $this->dbData[$propName];
    }
}
