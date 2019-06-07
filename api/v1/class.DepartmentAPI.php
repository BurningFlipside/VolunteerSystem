<?php
class DepartmentAPI extends Http\Rest\DataTableAPI
{
    protected $isAdmin = null;
    protected $isLead = null;

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
        $app->get('/{dept}/shifts[/]', array($this, 'getShiftsForDepartment'));
        $app->post('/{dept}/shifts[/]', array($this, 'createShiftForDepartment'));
    }

    protected function isVolunteerAdmin($request)
    {
        $this->validateLoggedIn($request);
        if($this->isAdmin === null)
        {
            $this->isAdmin = $this->user->isInGroupNamed('VolunteerAdmins');
        }
        return $this->isAdmin;
    }

    protected function canCreate($request)
    {
        return $this->isVolunteerAdmin($request);
    }

    protected function canEditDept($request, $deptId, $dept = null)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        if($this->isLead === null)
        {
            $this->isLead = $this->user->isInGroupNamed('Leads');
            if($dept['lead'] === $this->user->title[0])
            {
                return true;
            }
        }
        //TODO give access to department lead
        return false;
    }

    protected function canUpdate($request, $entity)
    {
        return $this->canEditDept($request, false);
    }

    protected function processEntry($entry, $request)
    {
        $entry['isAdmin'] = $this->canEditDept($request, null, $entry);
        return $entry;
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
        $roles = $dataTable->read($filter, $odata->select, $odata->top,
                                  $odata->skip, $odata->orderby);
        if($roles === false)
        {
            $roles = array();
        }
        return $response->withJson($roles);
    }

    public function getShiftsForDepartment($request, $response, $args)
    {
        $deptId = $args['dept'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $filter = new \Data\Filter("departmentID eq '$deptId'");
        $odata = $request->getAttribute('odata', new \ODataParams(array()));
        $shifts = $dataTable->read($filter, $odata->select, $odata->top,
                                  $odata->skip, $odata->orderby);
        if($shifts === false)
        {
            $shifts = array();
        }
        return $response->withJson($shifts);
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

    public function createShiftForDepartment($request, $response, $args)
    {
        $deptId = $args['dept'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
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

