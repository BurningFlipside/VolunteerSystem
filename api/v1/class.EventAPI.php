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
        if($entry['private'] && !in_array($this->user->mail, $entry['volList']))
        {
            $entry['available'] = false;
            $entry['why'] = 'Event is private and you are not invited';
        }
        if(!$entry['available'] && !$this->isVolunteerAdmin($request))
        {
            return null;
        }
        return $entry;
    }

    public function getShiftsForEvent($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $eventId = $args['event'];
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $filter = new \Data\Filter("eventID eq '$eventId'");
        $odata = $request->getAttribute('odata', new \ODataParams(array()));
        if($odata->filter !== false)
        {
            $clause = $odata->filter->getClause('eventID');
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
}
