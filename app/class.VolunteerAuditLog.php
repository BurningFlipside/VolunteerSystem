<?php
namespace Volunteer;

class VolunteerAuditLog
{
    protected $dataTable;

    public function __construct() 
    {
        $this->dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'auditLog');
    }

    public function writeEntry($user, $success, $msg, $ip, $category, $data) : void
    {
        $this->dataTable->create(array('user'=>$user, 'success'=>$success, 'message'=>$msg, 'ip'=>$ip, 'category'=>$category, 'data'=>$data, 'timestamp'=>time()));
    }
}

function doSingleAuditWrite($user, $success, $msg, $ip, $category, $data) : void
{
    $log = new VolunteerAuditLog();
    $log->write($user, $success, $msg, $ip, $category, $data);
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */