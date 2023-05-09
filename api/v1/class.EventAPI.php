<?php

use \DateTime as DateTime;
use \Flipside\ODataParams;
use \Flipside\Data\Filter as DataFilter;

use Volunteer\VolunteerAuditLog;
use Volunteer\VolunteerEvent;
use Volunteer\VolunteerShift;

class EventAPI extends VolunteerAPI
{
    private $logger;

    use Processor;

    public function __construct()
    {
        $this->logger = new VolunteerAuditLog();
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
        return new DataFilter($this->primaryKeyName." eq '$value' or alias eq '$value'");
    }

    /**
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    protected function canUpdate($request, $entity)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }       
        return false;
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
        //See if there are any shifts for this event...
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $id = $entry['_id'];
        $filter = new DataFilter("eventID eq '$id'");
        $count = $dataTable->count($filter);
        $entry['hasShifts'] = $count !== 0;
        return $entry;
    }

    public function getShiftsForEvent($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $eventId = $args['event'];
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $odata = $request->getAttribute('odata', new ODataParams(array()));
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
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $obj = $request->getParsedBody();
        if($obj == NULL)
        {
            $obj = json_decode($request->getBody()->getContents(), true);
        }
        $obj['eventID'] = $eventId;
        $ret = $dataTable->create($obj);
        return $response->withJson($ret);
    }

    private function getFilterString($eventId, $obj)
    {
        $filter = array('eventID' => $eventId);
        $filter['status'] = 'filled';
        if(isset($obj['includePending']))
        {
            $filter['status'] = array('$exists' => true, '$ne' => 'unfilled');
        }
        $filter['earlyLate'] = array('$ne' => '-1');
        if(isset($obj['earlyLate']))
        {
            $filter['earlyLate'] = (string)$obj['earlyLate'];
        }
        if(isset($obj['department']))
        {
            $filter['departmentID'] = $obj['department'];
        }
        return $filter;
    }

    public function getTicketStatusForVol($vol)
    {
        if($vol === false || method_exists($vol, 'getTicketStatus') === false) {
            return array('str'=>'No');
        }
        $ticket = $vol->getTicketStatus();
        $ticketStr = array('str'=>'No');
        if(isset($ticket['request']) && $ticket['request'] === true)
        {
            $ticketStr = array('str'=>'Requested');
        }
        else if($ticket['ticket'] === true)
        {
            $ticketStr = array('str' => 'Yes', 'code' => $ticket['shortCode']);
        }
        return $ticketStr;
    }

    public function getEEShiftReportForEvent($request, $response, $args)
    {
        $eventId = $args['event'];
        if($this->isVolunteerAdmin($request) === false && $this->user->isInGroupNamed('Leads') === false)
        {
            return $response->withStatus(401);
        }
        $shiftDataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $obj = $request->getParsedBody();
        if($obj == NULL)
        {
            $obj = json_decode($request->getBody()->getContents(), true);
        }
        if($request->getQueryParam('includePending'))
        {
            $obj['includePending'] = true;
        }
        if($request->getQueryParam('department'))
        {
            $obj['department'] = $request->getQueryParam('department');
        }
        $filter = $this->getFilterString($eventId, $obj);
        if($this->isVolunteerAdmin($request) === false)
        {
            //Only get shifts for this lead's department(s)...
            $deptDataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'departments');
            $departments = $deptDataTable->read(array('lead'=>array('$in'=>$this->user->title)));
            if(empty($departments))
            {
                return $response->withStatus(404);
            }
            $filter['departmentID'] = $departments[0]['departmentID'];
        }
        $shifts = $shiftDataTable->read($filter);
        $ret = array();
        $count = count($shifts);
        $dedupe = array();
        for($i = 0; $i < $count; $i++)
        {
            $shift = new VolunteerShift(false, $shifts[$i]);
            $vol = $shift->participantObj;
            if($vol === false)
            {
                $vol = (object)array('uid'=>$shift->participant , 'firstName' => $shift->participant, 'lastName'=>'', 'email'=>$shift->participant);
            }
            $role = $shift->role;
            if(!isset($dedupe[$vol->uid]))
            {
                $dedupe[$vol->uid] = array();
            }
            if(!isset($dedupe[$vol->uid][$shift->departmentID]))
            {
                $dedupe[$vol->uid][$shift->departmentID] = array();
            }
            if(!isset($dedupe[$vol->uid][$shift->departmentID][$role->short_name]))
            {
                $dedupe[$vol->uid][$shift->departmentID][$role->short_name] = -1;
            }
            if($dedupe[$vol->uid][$shift->departmentID][$role->short_name] < $shift->earlyLate)
            {
                $dedupe[$vol->uid][$shift->departmentID][$role->short_name] = $shift->earlyLate;
                $ticketStatus = $this->getTicketStatusForVol($vol);
                $entry = array('name' => $vol->firstName.' '.$vol->lastName, 'email'=> $vol->email, 'dept'=> $shift->department->departmentName, 'role' => $role->display_name, 'earlyLate'=>$shift->earlyLate, 'ticket'=>$ticketStatus['str']);
                if(isset($ticketStatus['code']))
                {
                    $entry['ticketCode'] = $ticketStatus['code'];
                }
                array_push($ret, $entry);
            }
            else if($shift->earlyLate === -2)
            {
                $ticketStatus = $this->getTicketStatusForVol($vol);
                $entry = array('name' => $vol->firstName.' '.$vol->lastName, 'email'=> $vol->email, 'dept'=> $shift->department->departmentName, 'role' => $role->display_name, 'earlyLate'=>$shift->earlyLate, 'ticket'=>$ticketStatus['str']);
                if(isset($ticketStatus['code']))
                {
                    $entry['ticketCode'] = $ticketStatus['code'];
                }
                array_push($ret, $entry);
            }
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
                //Allow AAR to approve in leu of AFs
                return ($this->user->isInGroupNamed('AFs') || $this->user->isInGroupNamed('AAR'));
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
        if($this->canUpdate($request, null) === false && $this->user->isInGroupNamed('Leads') === false)
        {
            return $response->withStatus(401);
        }
        $event = new VolunteerEvent($eventId);
        $obj = $this->getParsedBody($request);
        //First make sure the current user can do the auth they are trying...
        if($this->userCanAuth($obj['approvalType']) === false)
        {
            $this->logger->writeEntry($this->user->uid, false, 'tried to approve EE not allowed to', $request->getServerParam('REMOTE_ADDR'), 'Early Entry', $obj);
            return $response->withStatus(401);
        }
        $eeList = $event->eeLists[(int)$obj['eeList']];
        $uid = $obj['uid'];
        if(!isset($eeList[$uid]))
        {
            $uid = urlencode($uid);
            $uid = str_replace('.', '%2E', $uid);
            if(!isset($eeList[$uid]))
            {
                return $response->withStatus(404);
            }
        }
        $ret = $event->approveEE($uid, (int)$obj['eeList'], $obj['approvalType']);
        $this->logger->writeEntry($this->user->uid, $ret, 'Approved EE', $request->getServerParam('REMOTE_ADDR'), 'Early Entry', $obj);
        return $response->withJson($ret);
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
