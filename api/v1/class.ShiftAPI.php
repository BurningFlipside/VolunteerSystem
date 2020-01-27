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
        parent::setup($app);
        $app->post('/Actions/CreateGroup', array($this, 'createGroup'));
        $app->post('/Actions/NewGroup', array($this, 'newGroup'));
        $app->post('/Actions/DeleteGroup', array($this, 'deleteGroup'));
        $app->post('/{shift}/Actions/Signup[/]', array($this, 'signup'));
        $app->post('/{shift}/Actions/Abandon[/]', array($this, 'abandon'));
        $app->post('/{shift}/Actions/Approve[/]', array($this, 'approvePending'));
        $app->post('/{shift}/Actions/Disapprove[/]', array($this, 'disapprovePending')); 
        $app->post('/{shift}/Actions/StartGroupSignup', array($this, 'startGroupSignup'));
        $app->post('/{shift}/Actions/GenerateGroupLink', array($this, 'generateGroupLink'));
        $app->post('/{shift}/Actions/EmptyShift[/]', array($this, 'emptyShift'));
        $app->post('/{shift}/Actions/ForceShiftEmpty[/]', array($this, 'forceEmpty'));
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
            $emailProvider = \EmailProvider::getInstance();
            if($emailProvider->sendEmail($email) === false)
            {
                throw new \Exception('Unable to send email!');
            }
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
            $emailProvider = \EmailProvider::getInstance();
            if($emailProvider->sendEmail($email) === false)
            {
                throw new \Exception('Unable to send email!');
            } 
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
        else
        {
            return $response->withJson(array('res'=>$myRet, 'errors'=>$errors));
        }
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
        $shift['endTime'] = $data['groupEndTime'];
        $shift['eventID'] = $data['groupEvent'];
        $shift['name'] = $data['groupName'];
        $shift['startTime'] = $data['groupStartTime'];
        $dataTable = $this->getDataTable();
        $ret = true;
        foreach($data['roles'] as $role=>$count)
        {
            $count = intval($count);
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
        $filter = new \Data\Filter('groupID eq '.$data['groupID']);
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
            if(!$event->hasVolOnEEList($uid, intval($entity['earlyLate'])))
            {
                $status = 'pending';
                $entity['needEEApproval'] = true;
                $event->addToEEList($uid, intval($entity['earlyLate']));
            }
        }
        $entity['participant'] = $uid;
        $entity['status'] = $status;
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
                $tmp = new \Data\Filter('_id eq '.$overlaps[$i]->{'_id'});
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
            $emailProvider = \EmailProvider::getInstance();
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
        print_r($entity); die();
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
        $emailProvider = \EmailProvider::getInstance();
        if($emailProvider->sendEmail($email) === false)
        {
            throw new \Exception('Unable to send duplicate email!');
        }
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
        $filter = new \Data\Filter('groupID eq '.$entity['groupID'].' and enabled eq true');
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
        $myShift = $data['myshift'];
        $roles = array();
        foreach($data as $key => $value)
        {
            if(substr($key, 0, 6) === "roles.")
            {
                $roles[substr($key, 6)] = $value;
            }
        }
        $filter = new \Data\Filter('groupID eq '.$entity['groupID'].' and enabled eq true');
        $entities = $dataTable->read($filter);
        $count = count($entities);
        $uuid = $this->genUUID();
        for($i = 0; $i < $count; $i++)
        {
            if(isset($entities[$i]['status']) && ($entities[$i]['status'] === 'filled' || $entities[$i]['status'] === 'pending'))
            {
                $entities[$i] = false;
                continue;
            }
            if((string)$entities[$i]['_id'] === (string)new \MongoDB\BSON\ObjectId($myShift))
            {
                $entities[$i]['participant'] = $this->user->uid;
                $entities[$i]['status'] = 'filled';
                $entities[$i]['signupLink'] = $uuid;
            }
            else if(isset($roles[$entities[$i]['roleID']]))
            {
                $entities[$i]['status'] = 'groupPending';
                $entities[$i]['signupLink'] = $uuid;
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
            $filter = new \Data\Filter('_id eq '.$entities[$i]['_id']);
            $res = $dataTable->update($filter, $entities[$i]);
            if($res === false)
            {
                throw new \Exception('Not able to save shift '.$entities[$i]['_id']);
            }
        }
        return $response->withJSON(array('uuid' => $uuid));
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
            $emailProvider = \EmailProvider::getInstance();
            if($emailProvider->sendEmail($email) === false)
            {
                throw new \Exception('Unable to send email!');
            }
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
}
