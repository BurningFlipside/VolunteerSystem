<?php

use \Flipside\Data\Filter as DataFilter;
use \Flipside\ODataParams;
use \Volunteer\Schedules\SimplePDF as SimpleSchedulePDF;
use \Volunteer\Schedules\GridSchedule;

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

    /**
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    protected function canUpdate($request, $entity)
    {
        if(isset($entity['departmentID']))
        {
            return $this->canEditDept($request, $entity['departmentID']); 
        }
        return $this->canEditDept($request, false);
    }

    /**
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
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
                //Can the user fill any of the roles in the department even if it isn't public and they aren't an admin?
                $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'roles');
                $filter = new DataFilter("departmentID eq '".$entry['departmentID']."'");
                $roles = $dataTable->read($filter);
                if($roles === false)
                {
                    $roles = array();
                }
                $count = count($roles);
                for($i = 0; $i < $count; $i++)
                {
                    $requirements = array();
                    if(isset($roles[$i]['requirements']))
                    {
                        $requirements = $roles[$i]['requirements'];
                    }
                    if(isset($requirements['email_list']))
                    {
                        $emails = explode(",", str_replace(' ', '', $requirements['email_list']));
                        $userEmails = $this->user->mail;
                        if(is_string($this->user->mail))
                        {
                            $userEmails = array($this->user->mail);
                        }
                        $count2 = count($userEmails);
                        for($j = 0; $j < $count2; $j++)
                        {
                            if(in_array($userEmails[$j], $emails))
                            {
                                $entry['available'] = true;
                                return $entry;
                            }
                        }
                    }
                }
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
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'roles');
        $odata = $request->getAttribute('odata', new ODataParams(array()));
        $filter = new DataFilter("departmentID eq '$deptId'");
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
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $odata = $request->getAttribute('odata', new ODataParams(array()));
        $filter = $this->addRequiredFilter('departmentID', $deptId, $odata);
        if($filter === false)
        {
            return $response->withStatus(409);
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
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', $table);
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
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'roles');
        $filter = new DataFilter("departmentID eq '$deptId' and short_name eq '$roleId'");
        $entry = $dataTable->read($filter);
        if(empty($entry))
        {
            return $response->withStatus(404);
        }
        $obj = $this->getParsedBody($request);
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
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'departments');
        $departments = $dataTable->read(new DataFilter('departmentID eq '.$deptId));
        if(empty($departments))
        {
            return $response->withStatus(404);
        }
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $eventId = $request->getParam('eventID');
        $filter = new DataFilter('eventID eq '.$eventId.' and departmentID eq '.$deptId);
        $shifts = $dataTable->read($filter);
        if(empty($shifts))
        {
            return $response->withStatus(404);
        }
        switch($request->getParam('type'))
        {
            case 'simplePDF':
                return $this->generateSimplePDFSchedule($departments[0], $shifts, $response);
            case 'gridXLSX':
                return $this->generateGridSchedule($departments[0], $shifts, $response, 'XLSX');
            case 'gridXLSXWithCamps':
                return $this->generateGridSchedule($departments[0], $shifts, $response, 'XLSX', true);
            case 'gridPDF':
                return $this->generateGridSchedule($departments[0], $shifts, $response, 'PDF');
            case 'gridPDFWithCamps':
                return $this->generateGridSchedule($departments[0], $shifts, $response, 'PDF', true);
        }
        return $response->withJson($shifts);
    }

    public function generateSimplePDFSchedule($dept, $shifts, $response)
    {
        $pdf = new SimpleSchedulePDF($dept, $shifts);
        $response = $response->withHeader('Content-Type', 'application/pdf');
        $response->getBody()->write($pdf->toPDFBuffer());
        return $response;
    }

    /**
     * The boolean flag really is just a minor flag
     * @SuppressWarnings(PHPMD.BooleanArgumentFlag)
     */
    public function generateGridSchedule($dept, $shifts, $response, $type, bool $includeCampNames = false)
    {
        $spreadSheet = new GridSchedule($dept, $shifts, $includeCampNames);
        $data = $spreadSheet->getBuffer($type);
        $response = $response->withHeader('Content-Type', $data['content-type']);
        $response = $response->withHeader('Content-Disposition', 'attachment; filename='.$dept['departmentName'].$data['extension']);
        $response->getBody()->write($data['buffer']);
        return $response;
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
