<?php
class DepartmentAPI extends Http\Rest\DataTableAPI
{
    public function __construct()
    {
        parent::__construct('fvs', 'departments', 'departmentID');
    }

    public function setup($app)
    {
        parent::setup($app);
        $app->get('/{dept}/roles[/]', array($this, 'getRolesForDepartment'));
        $app->post('/{dept}/roles[/]', array($this, 'createRoleForDepartment'));
        $app->patch('/{dept}/roles/{roleName}[/]', array($this, 'updateRoleForDepartment'));
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

    protected function canEditDept($request, $deptId)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        //TODO give access to department lead
        return false;
    }

    protected function canUpdate($request, $entity)
    {
        return $this->canEditDept($request, false);;
    }

    public function getRolesForDepartment($request, $response, $args)
    {
        $deptId = $args['dept'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'roles');
        $filter = new \Data\Filter("departmentID eq '$deptId'");
        $odata = $request->getAttribute('odata', new \ODataParams(array()));
        $roles = $dataTable->read($odata->filter, $odata->select, $odata->top,
                                  $odata->skip, $odata->orderby);
        if($roles === false)
        {
            $roles = array();
        }
        return $response->withJson($roles);
    }

    public function createRoleForDepartment($request, $response, $args)
    {
        $deptId = $args['dept'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'roles');
        $obj = $request->getParsedBody();
        if($obj == NULL)
        {
            $obj = json_decode($request->getBody()->getContents(), true);
        }
        $obj['departmentID'] = $deptId;
        $ret = $dataTable->create($obj);
        return $response->withJson($ret);
    }

    public function updateRoleForDepartment($request, $response, $args)
    {
        $deptId = $args['dept'];
        $roleId = $args['roleName'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'roles');
        $filter = new \Data\Filter("departmentID eq '$deptId' and short_name eq '$roleId'");
        $entry = $dataTable->read($filter);
        if(empty($entry))
        {
            return $response->withStatus(404);
        }
        if(count($entry) === 1 && isset($entry[0]))
        {
            $entry = $entry[0];
        }
        $obj = $request->getParsedBody();
        if($obj === null)
        {
            $request->getBody()->rewind();
            $obj = $request->getBody()->getContents();
            $tmp = json_decode($obj, true);
            if($tmp !== null)
            {
                $obj = $tmp;
            }
        }
        $ret = $dataTable->update($filter, $obj);
        return $response->withJson($ret);
    }
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

