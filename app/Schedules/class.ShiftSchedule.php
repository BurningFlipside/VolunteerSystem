<?php
namespace Schedules;

trait ShiftSchedule
{
    public function getRoleNameFromID($roleID)
    {
        static $roles = null;
        if($roles === null)
        {
            $dataTable = \DataSetFactory::getDataTableByNames('fvs', 'roles');
            $tmp = $dataTable->read();
            $roles = array();
            $count = count($tmp);
            for($i = 0; $i < $count; $i++)
            {
                if(isset($tmp[$i]['display_name']))
                {
                    $roles[$tmp[$i]['short_name']] = $tmp[$i]['display_name'];
                }
                else
                {
                    $roles[$tmp[$i]['short_name']] = $tmp[$i]['short_name'];
                }
            }
        }
        return $roles[$roleID];
    }
}
