<?php
class VolunteerObject
{
    protected $dbData;

    public function __construct($id, $dbData, $tableName, $index)
    {
        if($dbData === null)
        {
            $dataTable = DataSetFactory::getDataTableByNames('fvs', $tableName);
            $filter = new \Data\Filter($index.' eq '.$id);
            $objs = $dataTable->read($filter);
            if(empty($objs))
            {
                throw new Exception('Unable to locate object with ID '.$id);
            }
            $dbData = $objs[0];
        }
        $this->dbData = $dbData;
    }
}
