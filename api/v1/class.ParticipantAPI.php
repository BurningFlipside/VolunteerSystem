<?php
class ParticipantAPI extends VolunteerAPI
{
    public function __construct()
    {
        parent::__construct('participants', 'uid');
    }

    public function setup($app)
    {
        parent::setup($app);
        $app->get('/me/shifts[/]', array($this, 'getMyShifts'));
    }

    protected function canCreate($request)
    {
        $this->validateLoggedIn($request);
        return true;
    }

    protected function canRead($request)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        //TODO give access to department leads
        return true;
    }

    protected function canUpdate($request, $entity)
    {
 	if($this->isVolunteerAdmin($request))
        {
            return true;
        }       
        //TODO give access to department lead
        return false;
    }

    protected function canDelete($request, $entity)
    {
        return $this->canUpdate($request, $entity);
    }

    protected function validateCreate(&$obj, $request)
    {
        if(isset($obj['uid']))
        {
            return false;
        }
        $uid = $this->user->uid;
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($uid);
        $users = $dataTable->read($filter);
        if(!empty($users))
        {
            //User is already created...
            return false;
        }
        $obj['uid'] = $uid;
        return true;
    }

    protected function getFilterForPrimaryKey($value)
    {
        if($value === 'me')
        {
            $value = $this->user->uid;
        }
        return parent::getFilterForPrimaryKey($value);
    }

    public function readEntry($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $uid = $args['name'];
        if($uid === 'me')
        {
            $uid = $this->user->uid;
        }
        else if($uid !== $this->user->uid && $this->canRead($request) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = $this->getDataTable();
        $odata = $request->getAttribute('odata', new \ODataParams(array()));
        $filter = $this->getFilterForPrimaryKey($uid);
        $areas = $dataTable->read($filter, $odata->select, $odata->top,
                                  $odata->skip, $odata->orderby);
        if(empty($areas))
        {
            return $response->withStatus(404);
        }
        return $response->withJson($areas[0]);
    }

    public function getMyShifts($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $uid = $this->user->uid;
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $filter = new \Data\Filter("participant eq '$uid'");
        $shifts = $dataTable->read($filter);
        $text = "BEGIN:VCALENDAR\r\n";
        $text.= "VERSION:2.0\r\n";
        $text.= "PRODID:-//hacksw/handcal//NONSGML v1.0//EN\r\n";
        $count = count($shifts);
        for($i = 0; $i < $count; $i++)
        {
            $text.= "BEGIN:VEVENT\r\n";
            $text.= "UID:".$this->user->mail."\r\n";
            $d = new DateTime($shifts[$i]['startTime']);
            $d->setTimezone(new \DateTimeZone('UTC'));
            $text.= "DTSTAMP:".$d->format('Ymd\THis\Z')."\r\n";
            $text.= "DTSTART:".$d->format('Ymd\THis\Z')."\r\n";
            $d = new DateTime($shifts[$i]['endTime']);
            $d->setTimezone(new \DateTimeZone('UTC'));
            $text.= "DTEND:".$d->format('Ymd\THis\Z')."\r\n";
            $text.= "SUMMARY:".$shifts[$i]['roleID'].' '.$shifts[$i]['name']."\r\n";
            $text.= "END:VEVENT\r\n";
        }
        $text.= "END:VCALENDAR\r\n";
        $response = $response->withHeader('Content-type', 'text/calendar');
        $response = $response->withHeader('Content-Disposition', 'attachment; filename="MyShifts.ics"');
        $body = $response->getBody();
        $body->write($text);
        return $response;
    }
}
