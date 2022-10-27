<?php
class ShiftAPI extends VolunteerAPI
{
    use Processor;

    public function __construct()
    {
        parent::__construct('shifts');
    }

    public function setup($app)
    {
        $app->get('/PendingShifts', array($this, 'getPendingShifts'));
        parent::setup($app);
        $app->post('/Actions/CreateGroup', array($this, 'createGroup'));
        $app->post('/Actions/NewGroup', array($this, 'newGroup'));
        $app->post('/Actions/DeleteGroup', array($this, 'deleteGroup'));
        $app->post('/Actions/RemoveGroupSignupLink', array($this, 'removeGroupLink'));
        $app->post('/Actions/EventClone', array($this, 'eventClone'));
        $app->post('/{shift}/Actions/Signup[/]', array($this, 'signup'));
        $app->post('/{shift}/Actions/Abandon[/]', array($this, 'abandon'));
        $app->post('/{shift}/Actions/Approve[/]', array($this, 'approvePending'));
        $app->post('/{shift}/Actions/Disapprove[/]', array($this, 'disapprovePending')); 
        $app->post('/{shift}/Actions/StartGroupSignup', array($this, 'startGroupSignup'));
        $app->post('/{shift}/Actions/GenerateGroupLink', array($this, 'generateGroupLink'));
        $app->post('/{shift}/Actions/EmptyShift[/]', array($this, 'emptyShift'));
        $app->post('/{shift}/Actions/ForceShiftEmpty[/]', array($this, 'forceEmpty'));
        $app->post('/{shift}/Actions/Assign[/]', array($this, 'assign'));
    }

    protected function canCreate($request)
    {
        //Check is handled by validateCreate...
        return true;
    }

    protected function canUpdate($request, $entity)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        return $this->isUserDepartmentLead($entity['departmentID'], $this->user);
    }

    protected function canDelete($request, $entity)
    {
        return $this->canUpdate($request, $entity);
    }

    protected function getFutureEventIDList()
    {
        $eventDB = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'events');
        $now = new DateTime();
        $events = $eventDB->read(array('endTime' => array('$gte'=>$now->format('Y-m-d\TG:i'))));
        $ids = array();
        $count = count($events);
        if($count > 0) {
            for($i = 0; $i < $count; $i++)
            {
                array_push($ids, (string)$events[$i]['_id']);
            }
        }
        return $ids;
    }

    protected function manipulateParameters($request, &$odata)
    {
        if($odata->filter === false)
        {
            //By default only get shifts for events that are from this point forward
            $ids = $this->getFutureEventIDList();
            if(!empty($ids)) {
                $odata->filter = array('eventID'=>array('$in'=>$ids));
            }
        }
        else if($request->getQueryParam('futureOnly'))
        {
            //Despite filtering only get future events...
            $ids = $this->getFutureEventIDList();
            if(!empty($ids)) {
                $filter = $odata->filter->to_mongo_filter();
                $filter['eventID'] = array('$in'=>$ids);
                $odata->filter = $filter;
            }
        }
        return false;
    }

    protected function validateCreate(&$obj, $request)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        if(!isset($obj['departmentID']))
        {
             return false;
        }
        if(isset($obj['unbounded']) && $obj['unbounded'])
        {
            if(!isset($obj['minShifts']) || $obj['minShifts'] === 0 || $obj['minShifts'] === '')
            {
                 $obj['minShifts'] = '1';
            }
        }
        return $this->isUserDepartmentLead($obj['departmentID'], $this->user);
    }

    protected function processEntry($entry, $request)
    {
        return $this->processShift($entry, $request);
    }

    protected function postUpdateAction($newObj, $request, $oldObj)
    {
        $oldShift = new \VolunteerShift(false, $oldObj);
        if($oldShift->isFilled() && ($oldObj['startTime'] != $newObj['startTime'] || $oldObj['endTime'] != $newObj['endTime']))
        {
            $email = new \Emails\ShiftEmail($oldShift, 'shiftChangedSource');
            $this->sendEmail($email);
        }
        return true;
    }

    protected function postDeleteAction($entry)
    {
        if(empty($entry))
        {
            return true;
        }
        $shift = new \VolunteerShift(false, $entry[0]);
        if($shift->isFilled())
        {
            $email = new \Emails\ShiftEmail($shift, 'shiftCanceledSource');
            $this->sendEmail($email);
            //Back these up so that I can undo the delete later if needs be
            $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shiftBackup');
            $dataTable->create($entry[0]);
        }
        return true;
    }

    protected function genUUID()
    {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            // 32 bits for "time_low"
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),

            // 16 bits for "time_mid"
            mt_rand(0, 0xffff),

            // 16 bits for "time_hi_and_version",
            // four most significant bits holds version number 4
            mt_rand(0, 0x0fff) | 0x4000,

            // 16 bits, 8 bits for "clk_seq_hi_res",
            // 8 bits for "clk_seq_low",
            // two most significant bits holds zero and one for variant DCE1.1
            mt_rand(0, 0x3fff) | 0x8000,

            // 48 bits for "node"
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    public function getPendingShifts($request, $response)
    {
        $dept = $request->getQueryParam('dept');
        if($dept === null && $this->isVolunteerAdmin($request) === false)
        {
            return $response->withStatus(401);
        }
        if($this->isVolunteerAdmin($request) === false && $this->isUserDepartmentLead($dept, $this->user) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = $this->getDataTable();
        $ids = $this->getFutureEventIDList();
        $filter = array('status'=>'pending', 'eventID'=>array('$in'=>$ids));
        if($dept !== null)
        {
            $filter['departmentID'] = $dept;
        }
        $shifts = $dataTable->read($filter);
        $pendingShifts = array();
        $count = count($shifts);
        for($i = 0; $i < $count; $i++)
        {
            $shift = $shifts[$i];
            if(!isset($shift['needEEApproval']) || $shift['needEEApproval'] === false || $shift['approvalNeeded'] === true)
            {
                //Easy this shift needs approval...
                array_push($pendingShifts, $shift);
                continue;
            }
            //This shift needs EE approval, but might be an overlap or something
            $objShift = new \VolunteerShift((string)$shift['_id'], $shift);
            if($objShift->findOverlaps($objShift->participant, true))
            {
                //User has an overlap despite being EE... show this here too...
                array_push($pendingShifts, $shift);
                continue;
            }
        }
        return $response->withJson($pendingShifts);
    }

    public function createGroup($request, $response)
    {
        $array = $request->getParsedBody();
        $count = count($array);
        $entArray = array();
        $uuid = $this->genUUID();
        $dataTable = $this->getDataTable();
        //User must be able to edit all shifts
        for($i = 0; $i < $count; $i++)
        {
            $filter = $this->getFilterForPrimaryKey($array[$i]);
            $entity = $dataTable->read($filter);
            if($entity === false || !isset($entity[0]))
            {
                return $response->withStatus(404);
            }
            $entity = $entity[0];
            if(!$this->canUpdate($request, $entity))
            {
                return $response->withStatus(401);
            }
            $entity['groupID'] = $uuid;
            array_push($entArray, $entity);
        }
        //If we got here we can update them all
        $myRet = true;
        $errors = array();
        for($i = 0; $i < $count; $i++)
        {
            $filter = $this->getFilterForPrimaryKey($array[$i]);
            $ret = $dataTable->update($filter, $entArray[$i]);
            if($ret === false)
            {
               $myRet = false;
               array_push($errors, $array[$i]);
            }
        }
        if($myRet)
        {
            return $response->withJson($myRet);
        }
        return $response->withJson(array('res'=>$myRet, 'errors'=>$errors));
    }

    public function newGroup($request, $response)
    {
        if(!$this->canCreate($request))
        {
            return $response->withStatus(401);
        }
        $data = $request->getParsedBody();
        $shift = array();
        $shift['groupID'] = $this->genUUID();
        $shift['departmentID'] = $data['groupDepartmentID'];
        $shift['earlyLate'] = $data['groupEarlyLate'];
        $shift['enabled'] = $data['groupEnabled'];
        $shift['approvalNeeded'] = $data['groupApprovalNeeded'];
        $shift['endTime'] = $data['groupEndTime'];
        $shift['eventID'] = $data['groupEvent'];
        $shift['name'] = $data['groupName'];
        $shift['startTime'] = $data['groupStartTime'];
        $dataTable = $this->getDataTable();
        $ret = true;
        foreach($data['roles'] as $role=>$count)
        {
            $count = (int)$count;
            for($i = 0; $i < $count; $i++)
            {
                $shift['roleID'] = $role;
                if($dataTable->create($shift) === false)
                {
                    $ret = false;
                }
            }
        }
        return $response->withJSON($ret);
    }

    public function deleteGroup($request, $response)
    {
        $data = $request->getParsedBody();
        $dataTable = $this->getDataTable();
        $filter = new \Flipside\Data\Filter('groupID eq '.$data['groupID']);
        $entities = $dataTable->read($filter);
        if(empty($entities))
        {
            return $response->withStatus(404);
        }
        if(!$this->canUpdate($request, $entities[0]))
        {
            return $response->withStatus(401);
        }
        $res = $dataTable->delete($filter);
        if($res)
        {
            return $response->withJSON($res);
        }
        return $response->withJSON($res, 500);
    }

    protected function doSignup($uid, $status, $entity, $filter, $dataTable)
    {
        if(isset($entity['earlyLate']) && $entity['earlyLate'] !== '-1')
        {
            $event = new \VolunteerEvent($entity['eventID']);
            if(!$event->hasVolOnEEList($uid, (int)$entity['earlyLate']))
            {
                $status = 'pending';
                $entity['needEEApproval'] = true;
                $event->addToEEList($uid, (int)$entity['earlyLate']);
            }
        }
        else if(isset($entity['approvalNeeded']) && $entity['approvalNeeded'])
        {
            $status = 'pending';
        }
        $entity['participant'] = $uid;
        $entity['status'] = $status;
        $entity['signupTime'] = date('c');
        return $dataTable->update($filter, $entity);
    }

    public function signup($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $shiftId = $args['shift'];
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($shiftId);
        $entity = $dataTable->read($filter);
        if(empty($entity))
        {
            return $response->withStatus(404);
        }
        $entity = $entity[0];
        if(isset($entity['participant']) && strlen($entity['participant']) > 0)
        {
            return $response->withStatus(401);
        }
        $shift = new \VolunteerShift($shiftId, $entity);
        $entity = $this->processShift($entity, $request);
        if(isset($entity['minShifts']) && $entity['minShifts'] > 0)
        {
          $shift->makeCopy($dataTable);
        }
        if(isset($entity['overlap']) && $entity['overlap'])
        {
            $overlaps = $shift->findOverlaps($this->user->uid);
            $count = count($overlaps);
            $leads = array();
            for($i = 0; $i < $count; $i++)
            {
                $dept = new \VolunteerDepartment($overlaps[$i]->departmentID);
                $leads = array_merge($leads, $dept->getLeadEmails());
                $overlaps[$i]->status = 'pending';
                $tmp = new \Flipside\Data\Filter('_id eq '.$overlaps[$i]->{'_id'});
                $res = $dataTable->update($tmp, $overlaps[$i]);
                if($res === false)
                {
                    return $response->withJSON(array('err'=>'Unable to update overlap with id '.$overlaps[$i]->{'_id'}));
                }
            }
            $dept = new \VolunteerDepartment($entity['departmentID']);
            $leads = array_merge($leads, $dept->getLeadEmails());
            $leads = array_unique($leads);
            $ret = $this->doSignup($this->user->uid, 'pending', $entity, $filter, $dataTable);
            $profile = new \VolunteerProfile($this->user->uid);
            $email = new \Emails\TwoShiftsAtOnceEmail($profile);
            $email->addLeads($leads);
            $emailProvider = \Flipside\EmailProvider::getInstance();
            if($emailProvider->sendEmail($email) === false)
            {
                throw new \Exception('Unable to send duplicate email!');
            }
            return $response->withJSON($ret);
        }
        if(isset($entity['available']) && $entity['available'])
        {
            $ret = $this->doSignup($this->user->uid, 'filled', $entity, $filter, $dataTable);
            return $response->withJSON($ret);
        }
        if(isset($entity['status']) && $entity['status'] === 'groupPending')
        {
            $ret = $this->doSignup($this->user->uid, 'filled', $entity, $filter, $dataTable);
            return $response->withJSON($ret);
        }
        //print_r($entity); die();
        throw new \Exception('Unable to signup! Unhandled case!');
    }

    public function assign($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $shiftId = $args['shift'];
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($shiftId);
        $entity = $dataTable->read($filter);
        if(empty($entity))
        {
            return $response->withStatus(404);
        }
        $entity = $entity[0];
        $shift = new \VolunteerShift($shiftId, $entity);
        if(!$this->isVolunteerAdmin($request) && !$this->isUserDepartmentLead($shift->departmentID, $this->user))
        {
            return $response->withStatus(401);
        }
        if(isset($entity['participant']) && strlen($entity['participant']) > 0)
        {
            return $response->withJSON(array('message'=>'Shift is already taken. Can only assign and empty shift!'), 400);
        }
        $entity = $this->processShift($entity, $request);
        $data = $request->getParsedBody();
        if(!isset($data['email']) || strlen($data['email']) < 2)
        {
            return $response->withStatus(400);
        }
        $partDataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'participants');
        $partFilter = array('email'=>array('$regex'=>new \MongoDB\BSON\Regex(trim($data['email']), 'i')));
        //$partFilter = new \Flipside\Data\Filter("email eq '".$data['email']."'");
        $parts = $partDataTable->read($partFilter);
        $count = count($parts);
        if($count === 0 && (!isset($data['force']) || $data['force'] !== true))
        {
            return $response->withJSON(array('message'=>'No participant with that email exists! Are you sure?!', 'canOverride'=>true), 400);
        }
        else if($count > 1)
        {
            return $response->withJSON(array('message'=>'Found multiple participants with that email address! This should not happen!'), 400);
        }
        else if($count === 0 && isset($data['force']) && $data['force'] === true)
        {
            $fakePart = array('uid'=> $data['email'],'firstName'=>$data['email'], 'email'=>$data['email']);
            $parts = array($fakePart);
        }
        $part = $parts[0];
        if(isset($entity['overlap']) && $entity['overlap'] && (!isset($data['force']) || $data['force'] !== true))
        {
            return $response->withJSON(array('message'=>'Shift overlaps with another!', 'canOverride'=>true), 409);
        }
        if(isset($entity['minShifts']) && $entity['minShifts'] > 0)
        {
            $shift->makeCopy($dataTable);
        }
        $ret = $this->doSignup($part['uid'], 'filled', $entity, $filter, $dataTable);
        if($ret === false)
        {
            return $response->withJSON($ret);
        }
        $email = new \Emails\AssignmentEmail(new \VolunteerProfile($part['uid'], $part), $shift, $this->user);
        $emailProvider = \Flipside\EmailProvider::getInstance();
        if($emailProvider->sendEmail($email) === false)
        {
            throw new \Exception('Unable to send assignment email!');
        }
        return $response->withJSON($ret);
    }

    public function abandon($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $shiftId = $args['shift'];
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($shiftId);
        $entity = $dataTable->read($filter);
        if(empty($entity))
        {
            return $response->withStatus(404);
        }
        $entity = $entity[0];
        if(!isset($entity['participant']) || $entity['participant'] !== $this->user->uid)
        {
            return $response->withStatus(401);
        }
        $entity['participant'] = '';
        $entity['status'] = 'unfilled';
        $entity['signupTime'] = '';
        if(isset($entity['needEEApproval']))
        {
          unset($entity['needEEApproval']);
        }
        return $response->withJSON($dataTable->update($filter, $entity));
    }

    public function approvePending($request, $response, $args)
    {
        if(!$this->canCreate($request))
        {
            return $response->withStatus(401);
        }
        $shiftId = $args['shift'];
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($shiftId);
        $entity = $dataTable->read($filter);
        if(empty($entity))
        {
            return $response->withStatus(404);
        }
        $entity = $entity[0];
        $entity['status'] = 'filled';
        return $response->withJSON($dataTable->update($filter, $entity));
    }

    public function disapprovePending($request, $response, $args)
    {
        if(!$this->canCreate($request))
        {
            return $response->withStatus(401);
        }
        $shiftId = $args['shift'];
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($shiftId);
        $entity = $dataTable->read($filter);
        if(empty($entity))
        {
            return $response->withStatus(404);
        }
        $entity['participant'] = '';
        $entity['status'] = 'unfilled';
        $profile = new \VolunteerProfile($this->user->uid);
        $email = new \Emails\PendingRejectedEmail($profile);
        $email->setShift($entity);
        $this->sendEmail($email);
        return $response->withJSON($dataTable->update($filter, $entity));
    }

    public function startGroupSignup($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $shiftId = $args['shift'];
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($shiftId);
        $entity = $dataTable->read($filter);
        if(empty($entity))
        {
            return $response->withStatus(404);
        }
        $entity = $entity[0];
        if(isset($entity['participant']) && strlen($entity['participant']) > 0)
        {
            return $response->withStatus(401);
        }
        $filter = new \Flipside\Data\Filter('groupID eq '.$entity['groupID'].' and enabled eq true');
        $entities = $dataTable->read($filter);
        $count = count($entities);
        $dept = new \VolunteerDepartment($entity['departmentID']);
        $res = array();
        $res['department'] = $dept->departmentName;
        $res['earlyLate'] = $entity['earlyLate'];
        $res['endTime'] = $entity['endTime'];
        $res['eventID'] = $entity['eventID'];
        $res['name'] = $entity['name'];
        $res['startTime'] = $entity['startTime'];
        $res['groupID'] = $entity['groupID'];
        $res['shifts'] = array();
        $roles = array();
        for($i = 0; $i < $count; $i++)
        {
            if(isset($entities[$i]['status']) && ($entities[$i]['status'] === 'filled' || $entities[$i]['status'] === 'pending'))
            {
                continue;
            }
            if(!isset($roles[$entities[$i]['roleID']]))
            {
                $roles[$entities[$i]['roleID']] = new \VolunteerRole($entities[$i]['roleID']);
            }
            $role = $roles[$entities[$i]['roleID']];
            $entities[$i]['role'] = $role->display_name;
            array_push($res['shifts'], $entities[$i]);
        }
        return $response->withJSON($res);
    }

    public function generateGroupLink($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $shiftId = $args['shift'];
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($shiftId);
        $entity = $dataTable->read($filter);
        if(empty($entity))
        {
            return $response->withStatus(404);
        }
        $entity = $entity[0];
        if(isset($entity['participant']) && strlen($entity['participant']) > 0)
        {
            return $response->withStatus(401);
        }
        $data = $request->getParsedBody();
        $myShift = null;
        if(isset($data['myshift']))
        {
            $myShift = $data['myshift'];
        }
        if($myShift === null && $this->isVolunteerAdmin($request) === false && $this->isUserDepartmentLead($entity['departmentID'], $this->user) === false)
        {
            return $response->withStatus(400);
        }
        $roles = array();
        foreach($data as $key => $value)
        {
            if(substr($key, 0, 6) === "roles.")
            {
                $roles[substr($key, 6)] = $value;
            }
        }
        $filter = new \Flipside\Data\Filter('groupID eq '.$entity['groupID'].' and enabled eq true');
        if($myShift === null) 
        {
            $filter = new \Flipside\Data\Filter('groupID eq '.$entity['groupID']);
        }
        $entities = $dataTable->read($filter);
        $count = count($entities);
        $uuid = $this->genUUID();
        $time = date('c');
        for($i = 0; $i < $count; $i++)
        {
            if(isset($entities[$i]['status']) && ($entities[$i]['status'] === 'filled' || $entities[$i]['status'] === 'pending'))
            {
                $entities[$i] = false;
                continue;
            }
            if($myShift !== null && (string)$entities[$i]['_id'] === (string)new \MongoDB\BSON\ObjectId($myShift))
            {
                $entities[$i]['participant'] = $this->user->uid;
                $entities[$i]['status'] = 'filled';
                $entities[$i]['signupLink'] = $uuid;
                $entities[$i]['groupLinkCreated'] = $time;
                $entities[$i]['signupOn'] = $time;
            }
            else if(isset($roles[$entities[$i]['roleID']]))
            {
                $entities[$i]['status'] = 'groupPending';
                $entities[$i]['signupLink'] = $uuid;
                $entities[$i]['groupLinkCreated'] = $time;
                $roles[$entities[$i]['roleID']]--;
                if($roles[$entities[$i]['roleID']] === 0)
                {
                    unset($roles[$entities[$i]['roleID']]);
                }
            }
            else
            {
                $entities[$i] = false;
            }
            if(isset($entity[$i]['minShifts']) && $entity[$i]['minShifts'] > 0)
            {
                $shift = new \VolunteerShift($shiftId, $entity);
                $shift->makeCopy($dataTable);
            }
        }
        if(count($roles) !== 0)
        {
            throw new \Exception('Not enough shifts to fullfill requests');
        }
        for($i = 0; $i < $count; $i++)
        {
            if($entities[$i] === false)
            {
                continue;
            }
            $filter = new \Flipside\Data\Filter('_id eq '.$entities[$i]['_id']);
            $res = $dataTable->update($filter, $entities[$i]);
            if($res === false)
            {
                throw new \Exception('Not able to save shift '.$entities[$i]['_id']);
            }
        }
        return $response->withJSON(array('uuid' => $uuid));
    }

    public function removeGroupLink($request, $response)
    {
        if(!$this->canCreate($request))
        {
            return $response->withStatus(401);
        }
        $data = $this->getParsedBody($request);
        if(!isset($data['groupID']))
        {
            return $response->withStatus(400);
        }
        $groupID = $data['groupID'];
        $dataTable = $this->getDataTable();
        $filter = new \Flipside\Data\Filter("groupID eq '$groupID'");
        $entity = $dataTable->read($filter);
        if(empty($entity))
        {
            return $response->withStatus(404);
        }
        $count = count($entity);
        $res = true;
        for($i = 0; $i < $count; $i++)
        {
            $entity[$i]['signupLink'] = '';
            if($entity[$i]['status'] === 'groupPending')
            {
                $entity[$i]['status'] = 'unfilled';
            }
            $entity[$i]['groupLinkCreated'] = '';
            $upFilter = new \Flipside\Data\Filter('_id eq '.$entity[$i]['_id']);
            $tmp = $dataTable->update($upFilter, $entity[$i]);
            if($tmp === false)
            {
                $res = false;
            }
        }
        return $response->withJSON($res);
    }

    function emptyShift($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $shiftId = $args['shift'];
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($shiftId);
        $entity = $dataTable->read($filter);
        if(empty($entity))
        {
            return $response->withStatus(404);
        }
        $entity = $entity[0];
        if(!$this->canUpdate($request, $entity))
        {
            return $response->withStatus(401);
        }
        $shift = new \VolunteerShift(false, $entity);
        $entity['participant'] = '';
        $entity['status'] = 'unfilled';
        if(isset($entity['needEEApproval']))
        {
          unset($entity['needEEApproval']);
        }
        $ret = $dataTable->update($filter, $entity);
        if($ret)
        {
            $email = new \Emails\ShiftEmail($shift, 'shiftEmptiedSource');
            $this->sendEmail($email);
        }
        return $response->withJSON($ret);
    }

    function forceEmpty($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $shiftId = $args['shift'];
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($shiftId);
        $entity = $dataTable->read($filter);
        if(empty($entity))
        {
            return $response->withStatus(404);
        }
        $entity = $entity[0];
        if(!$this->canUpdate($request, $entity))
        {
            return $response->withStatus(401);
        }
        $entity['participant'] = '';
        $entity['status'] = 'unfilled';
        if(isset($entity['needEEApproval']))
        {
          unset($entity['needEEApproval']);
        }
        return $response->withJSON($dataTable->update($filter, $entity));
    }

    function eventClone($request, $response)
    {
        $this->validateLoggedIn($request);
        $data = $request->getParsedBody();
        if(!isset($data['dept']) || !isset($data['dst']) || !isset($data['src']))
        {
            return $response->withStatus(400);
        }
        if($this->isVolunteerAdmin($request) === false && $this->isUserDepartmentLead($data['dept'], $this->user) === false)
        {
            return $response->withStatus(401);
        }
        //Let's get all the shifts for the source event...
        $dataTable = $this->getDataTable();
        $filter = array('eventID'=>$data['src'], 'departmentID'=>$data['dept']);
        $shifts = $dataTable->read($filter);
        if(empty($shifts))
        {
            return $response->withJSON(array('msg'=>'Unable to find shifts for provided source event and department'))->withStatus(404);
        }
        $evtDataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'events');
        $events = $evtDataTable->read(new \Flipside\Data\Filter('_id eq '.$data['src']));
        if(empty($events))
        {
            return $response->withStatus(404);
        }
        $srcEvent = $events[0];
        $events = $evtDataTable->read(new \Flipside\Data\Filter('_id eq '.$data['dst']));
        if(empty($events))
        {
            return $response->withStatus(404);
        }
        $dstEvent = $events[0];
        $groupTrans = array();
        $srcStart = new \DateTimeImmutable($srcEvent['startTime']);
        $srcStartMidnight = $srcStart->setTime(0, 0, 1);
        $dstStart = new \DateTimeImmutable($dstEvent['startTime']);
        $count = count($shifts);
        //Strip out or replace data...
        for($i = 0; $i < $count; $i++)
        {
            unset($shifts[$i]['_id']);
            if(isset($shifts[$i]['groupID']))
            {
                //This needs to change to new unique ID
                $oldGID = $shifts[$i]['groupID'];
                if(isset($groupTrans[$oldGID]))
                {
                    $shifts[$i]['groupID'] = $groupTrans[$oldGID];
                }
                else
                {
                    $groupTrans[$oldGID] = $this->genUUID();
                    $shifts[$i]['groupID'] = $groupTrans[$oldGID];
                }
            }
            $shifts[$i]['eventID'] = $data['dst'];
            if(isset($shifts[$i]['participant']))
            {
                unset($shifts[$i]['participant']);
            }
            if(isset($shifts[$i]['status']))
            {
                unset($shifts[$i]['status']);
            }
            if(isset($shifts[$i]['signupTime']))
            {
                unset($shifts[$i]['signupTime']);
            }
            if(isset($shifts[$i]['isAdmin']))
            {
                unset($shifts[$i]['isAdmin']);
            }
            if(isset($shifts[$i]['overlap']))
            {
                unset($shifts[$i]['overlap']);
            }
            if(isset($shifts[$i]['available']))
            {
                unset($shifts[$i]['available']);
            }
            if(isset($shifts[$i]['needEEApproval']))
            {
                unset($shifts[$i]['needEEApproval']);
            }
            if(!isset($shifts[$i]['minShifts']))
            {
                $shifts[$i]['minShifts'] = "";
            }
            if(!isset($shifts[$i]['approvalNeeded']))
            {
                $shifts[$i]['approvalNeeded'] = false;
            }
            //Ok this next bit is tricky... What I want to do is keep the time of day and keep the number of days from the beginning of the event...
            $shiftStartTime = new \DateTime($shifts[$i]['startTime']);
            $shiftEndTime = new \DateTime($shifts[$i]['endTime']);
            $startDiff = $srcStartMidnight->diff($shiftStartTime);
            $shiftLen = $shiftStartTime->diff($shiftEndTime);
            $dayDiff = new \DateInterval('P'.$startDiff->d.'D');
            $newShiftEndTime = $dstStart->add($dayDiff);
            $newShiftEndTime = $newShiftEndTime->setTime((int)$shiftStartTime->format('H'), (int)$shiftStartTime->format('i'));
            $newShiftStartTime = clone $newShiftEndTime;
            $newShiftEndTime = $newShiftEndTime->add($shiftLen);
            $shifts[$i]['startTime'] = $newShiftStartTime->format('c');
            $shifts[$i]['endTime'] = $newShiftEndTime->format('c');
        }
        $success = 0;
        $fail = 0;
        for($i = 0; $i < $count; $i++)
        {
            $data = $dataTable->create($shifts[$i]);
            if($data === false)
            {
                $fail++;
            }
            else
            {
                $success++;
            }
        }
        return $response->withJSON(array('success'=>$success, 'fail'=>$fail));
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
