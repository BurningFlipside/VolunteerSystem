<?php

class DepartmentAPI extends VolunteerAPI
{
    use Processor;

    public function __construct()
    {
        parent::__construct('departments', 'departmentID');
    }

    public function setup($app)
    {
        parent::setup($app);
        $app->get('/{dept}/roles[/]', array($this, 'getRolesForDepartment'));
        $app->post('/{dept}/roles[/]', array($this, 'createRoleForDepartment'));
        $app->patch('/{dept}/roles/{roleName}[/]', array($this, 'updateRoleForDepartment'));
        $app->get('/{dept}/shifts[/]', array($this, 'getShiftsForDepartment'));
        $app->post('/{dept}/shifts[/]', array($this, 'createShiftForDepartment'));
        $app->get('/{dept}/shifts/Actions/GenerateShiftSchedule', array($this, 'generateShiftSchedule'));
    }

    protected function canEditDept($request, $deptId, $dept = null)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        if($dept !== null)
        {
            return $this->isUserDepartmentLead2($dept, $this->user);
        }
        return $this->isUserDepartmentLead($deptId, $this->user);
    }

    protected function canUpdate($request, $entity)
    {
        return $this->canEditDept($request, false);
    }

    protected function canDelete($request, $entity)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        return false;
    }

    protected function processEntry($entry, $request)
    {
        $entry['available'] = true;
        $entry['isAdmin'] = $this->canEditDept($request, null, $entry);
        if(isset($entry['public']) && $entry['public'] === false)
        {
            if(!$this->isUserDepartmentLead2($entry, $this->user))
            {
                $entry['available'] = false;
                $entry['why'] = 'Not lead of department';
            }
            if(!$entry['available'] && !$entry['isAdmin'])
            {
                return null;
            }
        }
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
        $count = count($roles);
        for($i = 0; $i < $count; $i++)
        {
            $roles[$i] = $this->processRole($roles[$i], $request);
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
        if($odata->filter !== false)
        {
            $clause = $odata->filter->getClause('departmentID');
            if($clause !== null)
            {
                return $response->withStatus(409);
            }
            else
            {
                $filter->appendChild('and');
                $filter->appendChild($odata->filter);
            }
        }
        $shifts = $dataTable->read($filter, $odata->select, $odata->top,
                                   $odata->skip, $odata->orderby);
        if($shifts === false)
        {
            $shifts = array();
        }
        return $response->withJson($shifts);
    }

    protected function createEntityForDepartment($request, $response, $args, $table)
    {
        $deptId = $args['dept'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', $table);
        $obj = $request->getParsedBody();
        if($obj === null)
        {
            $obj = json_decode($request->getBody()->getContents(), true);
        }
        $obj['departmentID'] = $deptId;
        if($table === 'shifts')
        {
            if(isset($obj['unbounded']) && $obj['unbounded'])
            {
                if(!isset($obj['minShifts']) || $obj['minShifts'] === 0 || $obj['minShifts'] === '')
                {
                    $obj['minShifts'] = '1';
                }
            }
        }
        $ret = $dataTable->create($obj);
        return $response->withJson($ret);
    }

    public function createRoleForDepartment($request, $response, $args)
    {
        return $this->createEntityForDepartment($request, $response, $args, 'roles');
    }

    public function createShiftForDepartment($request, $response, $args)
    {
        return $this->createEntityForDepartment($request, $response, $args, 'shifts');
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

    public function generateShiftSchedule($request, $response, $args)
    {
        $deptId = $args['dept'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'departments');
        $depts = $dataTable->read(new \Data\Filter('departmentID eq '.$deptId));
        if(empty($depts))
        {
            return $response->withStatus(404);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $eventId = $request->getParam('eventID');
        $filter = new \Data\Filter('eventID eq '.$eventId.' and departmentID eq '.$deptId);
        $shifts = $dataTable->read($filter);
        if(empty($shifts))
        {
            return $response->withStatus(404);
        }
        switch($request->getParam('type'))
        {
            case 'simplePDF':
               return $this->generateSimplePDFSchedule($depts[0], $shifts, $response);
            case 'gridXLSX':
               return $this->generateGridSchedule($depts[0], $shifts, $response, 'XLSX');
            case 'gridPDF':
               return $this->generateGridSchedule($depts[0], $shifts, $response, 'PDF');
        }
        return $response->withJson($shifts);
    }

    public function generateSimplePDFSchedule($dept, $shifts, $response)
    {
        $pdf = new \Schedules\SimplePDF($dept, $shifts);
        $response = $response->withHeader('Content-Type', 'application/pdf');
        $response->getBody()->write($pdf->toPDFBuffer());
        return $response;
    }

    public function generateGridSchedule($dept, $shifts, $response, $type)
    {
        $ss = new \Schedules\GridSchedule($dept, $shifts);
        $data = $ss->getBuffer($type);
        $response = $response->withHeader('Content-Type', $data['content-type']);
        $response = $response->withHeader('Content-Disposition', 'attachment; filename='.$dept['departmentName'].$data['extension']);
        $response->getBody()->write($data['buffer']);
        return $response;
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
