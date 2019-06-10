<?php
class ShiftAPI extends Http\Rest\DataTableAPI
{
    public function __construct()
    {
        parent::__construct('fvs', 'shifts', '_id');
    }

    public function setup($app)
    {
        parent::setup($app);
        $app->post('/Actions/CreateGroup', array($this, 'createGroup'));
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
        //TODO give access to department lead
        return false;
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

    protected function genUUID()
    {
        return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            // 32 bits for "time_low"
            mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),

            // 16 bits for "time_mid"
            mt_rand( 0, 0xffff ),

            // 16 bits for "time_hi_and_version",
            // four most significant bits holds version number 4
            mt_rand( 0, 0x0fff ) | 0x4000,

            // 16 bits, 8 bits for "clk_seq_hi_res",
            // 8 bits for "clk_seq_low",
            // two most significant bits holds zero and one for variant DCE1.1
            mt_rand( 0, 0x3fff ) | 0x8000,

            // 48 bits for "node"
            mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
        );
    }

    public function createGroup($request, $response, $args)
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
            else if(!$this->canUpdate($request, $entity))
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
}
