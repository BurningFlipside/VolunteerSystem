<?php
class DepartmentAPI extends Http\Rest\DataTableAPI
{
    public function __construct()
    {
        parent::__construct('fvs', 'departments', 'departmentID');
    }

    protected function isVolunteerAdmin($request)
    {
        $this->validateLoggedIn($request);
        return $this->user->isInGroupNamed('VolunteerAdmins');
    }

    protected function canCreate($request)
    {
        return $this->isVolunteerAdmin($request);
    }
}

function deptGroup()
{
    global $app;
    $app->get('/:id/shifts(/)', 'getShiftsForDepartment');
    $app->get('/:id/roles(/)', 'getRolesForDepartment');
}

function getDepartmentByID($id, $select = false)
{
    global $app;
    if(!$app->user)
    {
        throw new Exception('Must be logged in', ACCESS_DENIED);
    }
    $dataTable = DataSetFactory::getDataTableByNames('fvs', 'departments');
    $filter = new \Data\Filter("departmentID eq '$id'");
    $ret = $dataTable->read($filter, $select);
    if(empty($ret))
    {
        return false;
    }
    if($ret[0]['public'])
    {
        return $ret[0];
    }
    if($app->user->isInGroupNamed('VolunteerAdmins'))
    {
        return $ret[0];
    }
    //TODO Give lead access to department
    return false;
}

function getShiftsForDepartment($id)
{
    global $app;
    $dept = getDepartmentByID($id);
    if($dept === false)
    {
        $app->notFound();
    }
    $filter = new \Data\Filter('departmentID eq '.$dept['departmentID']);
    $dataSet = DataSetFactory::getDataSetByName('fvs');
    $dataTable = $dataSet['shifts'];
    $ret = $dataTable->read($filter, $app->odata->select);
    if($ret === false || !isset($ret[0]))
    {
        $ret = array();
    }
    echo json_encode($ret);
}

function getRolesForDepartment($id)
{
    global $app;
    $dept = getDepartmentByID($id);
    if($dept === false)
    {
        $app->notFound();
    }
    $filter = new \Data\Filter('departmentID eq '.$dept['departmentID']);
    $dataSet = DataSetFactory::getDataSetByName('fvs');
    $dataTable = $dataSet['roles'];
    $ret = $dataTable->read($filter, $app->odata->select);
    if($ret === false || !isset($ret[0]))
    {
        $ret = array();
    }
    echo json_encode($ret);
}

