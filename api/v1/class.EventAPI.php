<?php
class EventAPI extends VolunteerAPI
{
    use Processor;

    public function __construct()
    {
        parent::__construct('events');
    }

    public function setup($app)
    {
        parent::setup($app);
        $app->get('/{event}/shifts[/]', array($this, 'getShiftsForEvent'));
        $app->post('/{event}/shifts[/]', array($this, 'createShiftForEvent'));
        $app->get('/{event}/Actions/GetEEShiftReport', array($this, 'getEEShiftReportForEvent'));
        $app->post('/{event}/Actions/GetEEShiftReport', array($this, 'getEEShiftReportForEvent'));
        $app->post('/{event}/Actions/ApproveEE', array($this, 'approveEEForEvent'));
    }

    protected function getFilterForPrimaryKey($value)
    {
        return new \Data\Filter($this->primaryKeyName." eq '$value' or alias eq '$value'");
    }

    protected function canUpdate($request, $entity)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }       
        return false;
    }

    protected function canDelete($request, $entity)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        return false;
    }

    public function processEntry($entry, $request)
    {
        $entry['available'] = true;
        $endTime = new DateTime($entry['endTime']);
        $now = new DateTime();
        if($endTime < $now)
        {
            $entry['available'] = false;
            $entry['why'] = 'Event is in the past';
        }
        if(isset($entry['volList']) && !is_array($entry['volList']))
        {
            $entry['volList'] = explode(',', $entry['volList']);
            $count = count($entry['volList']);
            for($i = 0; $i < $count; $i++)
            {
                $entry['volList'][$i] = trim($entry['volList'][$i]);
            }
        }
        if($entry['private'] && !in_array($this->user->mail, $entry['volList']))
        {
            $entry['available'] = false;
            $entry['why'] = 'Event is private and you are not invited';
        }
        if(!$entry['available'] && !$this->isVolunteerAdmin($request) && !$this->userIsLeadCached($this->user))
        {
            return null;
        }
        if(!$this->isVolunteerAdmin($request) && !$this->userIsLeadCached($this->user) && isset($entry['eeLists']))
        {
            unset($entry['eeLists']);
        }
        return $entry;
    }

    public function getShiftsForEvent($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $eventId = $args['event'];
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $odata = $request->getAttribute('odata', new \ODataParams(array()));
        $filter = $this->addRequiredFilter('eventID', $eventId, $odata);
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
        $count = count($shifts);
        for($i = 0; $i < $count; $i++)
        {
            $shifts[$i] = $this->processShift($shifts[$i], $request);
        }
        $shifts = array_values(array_filter($shifts));
        return $response->withJson($shifts);
    }

    public function createShiftForEvent($request, $response, $args)
    {
        $eventId = $args['event'];
        if($this->canUpdate($request, null) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $obj = $request->getParsedBody();
        if($obj == NULL)
        {
            $obj = json_decode($request->getBody()->getContents(), true);
        }
        $obj['eventID'] = $eventId;
        $ret = $dataTable->create($obj);
        return $response->withJson($ret);
    }

    public function getEEShiftReportForEvent($request, $response, $args)
    {
        $eventId = $args['event'];
        if($this->canUpdate($request, null) === false)
        {
            return $response->withStatus(401);
        }
        $shiftDataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $obj = $request->getParsedBody();
        if($obj == NULL)
        {
            $obj = json_decode($request->getBody()->getContents(), true);
        }
        $filterStr = 'eventID eq '.$eventId.' and status eq filled';
        if(isset($obj['earlyLate']))
        {
            $filterStr .= ' and earlyLate eq \''.$obj['earlyLate'].'\'';
        }
        else
        {
            $filterStr .= " and earlyLate ne '-1'";
        }
        $filter = new \Data\Filter($filterStr);
        $shifts = $shiftDataTable->read($filter);
        $ret = array();
        $count = count($shifts);
        for($i = 0; $i < $count; $i++)
        {
            $shift = new \VolunteerShift(false, $shifts[$i]);
            $vol = $shift->participantObj;
            $role = $shift->role;
            $entry = array('name' => $vol->getDisplayName('paperName'), 'email'=> $vol->email, 'dept'=> $shift->departmentID, 'role' => $role->display_name, 'earlyLate'=>$shift->earlyLate);
            array_push($ret, $entry);
        }
        return $response->withJson($ret);
    }

    protected function userCanAuth($type)
    {
        switch($type)
        {
            case 'aar':
                return $this->user->isInGroupNamed('AAR');
            case 'af':
                return $this->user->isInGroupNamed('AFs');
            case 'lead':
                return $this->user->isInGroupNamed('Leads');
            default:
                error_log('Unknown auth type: '.$type);
                return false;
        }
    }

    public function approveEEForEvent($request, $response, $args)
    {
        $eventId = $args['event'];
        if($this->canUpdate($request, null) === false)
        {
            return $response->withStatus(401);
        }
        $event = new \VolunteerEvent($eventId);
        $obj = $this->getParsedBody($request);
        //First make sure the current user can do the auth they are trying...
        if($this->userCanAuth($obj['approvalType']) === false)
        {
            return $response->withStatus(401);
        }
        $eeList = $event->eeLists[intval($obj['eeList'])];
        if(!isset($eeList[$obj['uid']]))
        {
            return $response->withStatus(404);
        }
        $ret = $event->approveEE($obj['uid'], intval($obj['eeList']), $obj['approvalType']);
        return $response->withJson($ret);
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
