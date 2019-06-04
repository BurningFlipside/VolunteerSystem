<?php
class EventAPI extends Http\Rest\DataTableAPI
{
    public function __construct()
    {
        parent::__construct('fvs', 'events', '_id');
    }

    public function setup($app)
    {
        parent::setup($app);
        $app->get('/{event}/shifts[/]', array($this, 'getShiftsForEvent'));
        $app->post('/{event}/shifts[/]', array($this, 'createShiftForEvent'));
    }

    protected function isVolunteerAdmin($request)
    {
        $this->validateLoggedIn($request);
        return $this->user->isInGroupNamed('VolunteerAdmins');
    }

    protected function canCreate($request)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        return false;
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

    public function getShiftsForEvent($request, $response, $args)
    {
        $eventId = $args['event'];
        if($this->canUpdate($request, null) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $filter = new \Data\Filter("eventID eq '$eventId'");
        $odata = $request->getAttribute('odata', new \ODataParams(array()));
        $shifts = $dataTable->read($filter, $odata->select, $odata->top,
                                  $odata->skip, $odata->orderby);
        if($shifts === false)
        {
            $shifts = array();
        }
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
}
