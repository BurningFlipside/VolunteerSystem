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
        $app->get('/{dept}/shifts/Actions/GenerateShiftSchedule', array($this, 'generateShiftSchedule'));
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
               return $this->generateSimplePDFSchedule($depts[0], $shifts, $request, $response);
        }
        return $response->withJson($shifts);
    }

    public function getRoleNameFromID($roleID)
    {
        static $roles = null;
        if($roles === null)
        {
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'roles');
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

    public function generateSimplePDFSchedule($dept, $shifts, $request, $response)
    {
        $pdf = new \PDF\PDF();
        $html = '<body>';
        $html.= '<style type="text/css">table {border-collapse: collapse;} table, th, td {border: 1px solid black;}</style>';
        $html.= '<h1 style="text-align: center;">'.$dept['departmentName'].' Shift Schedule</h1>';
        //Group shifts by day...
        $days = array();
        $count = count($shifts);
        for($i = 0; $i < $count; $i++)
        {
            $start = new DateTime($shifts[$i]['startTime']);
            $end = new DateTime($shifts[$i]['endTime']);
            $shifts[$i]['startTime'] = $start;
            $shifts[$i]['endTime'] = $end;
            $dateStr = $start->format('l (n/j/Y)');
            $timeStr = $start->format('g:i A').' till '.$end->format('g:i A');
            if(strlen($shifts[$i]['name']) > 0)
            {
                $timeStr.=' - <i>'.$shifts[$i]['name'].'</i>';
            }
            if(!isset($days[$dateStr]))
            {
                $days[$dateStr] = array();
            }
            if(!isset($days[$dateStr][$timeStr]))
            {
                $days[$dateStr][$timeStr] = array();
            }
            array_push($days[$dateStr][$timeStr], $shifts[$i]);
        }
        ksort($days);
        foreach($days as $dateStr=>$day)
        {
            $html.='<h2>'.$dateStr.'</h2>';
            ksort($day);
            foreach($day as $shiftStr=>$shifts)
            {
                usort($shifts, array($this, 'shiftSort'));
                $html.='<h3>'.$shiftStr.'</h3>';
                $html.='<table width="100%"><tr><th style="width: 20%">Role</th><th>Volunteer Name</th><th>Volunteer Camp</th></tr>';
                foreach($shifts as $shift)
                {
                    //TODO Volunteer info for shift...
                    $html.='<tr><td>'.$this->getRoleNameFromID($shift['roleID']).'</td><td></td><td></td></tr>';
                }
                $html.='</table>';
            }
        }
        $html.='</body>';
        $pdf->setPDFFromHTML($html);
        $response = $response->withHeader('Content-Type', 'application/pdf');
        $response->getBody()->write($pdf->toPDFBuffer());
        return $response;
    }

    public function shiftSort($a, $b)
    {
        return strcmp($this->getRoleNameFromID($a['roleID']), $this->getRoleNameFromID($b['roleID']));
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

