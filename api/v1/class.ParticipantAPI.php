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
        $app->get('/{uid}/certs[/]', array($this, 'getCerts'));
        $app->post('/{uid}/certs/{certId}[/]', array($this, 'uploadCert'));
        $app->post('/{uid}/certs/{certId}/Actions/RejectCert', array($this, 'rejectCert'));
        $app->post('/{uid}/certs/{certId}/Actions/AcceptCert', array($this, 'acceptCert'));
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
        $format = $request->getAttribute('format', false);
        if($format === false || $format === 'text/calendar')
        {
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
        }
        else if($format === 'application/pdf')
        {
            $pdf = new \Schedules\SimplePDF('My', $shifts);
            $response = $response->withHeader('Content-Type', 'application/pdf');
            $response->getBody()->write($pdf->toPDFBuffer());
        }
        else
        {
            throw new \Exception('Unknown format '.$format);
        }
        return $response;
    }

    public function getCerts($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $uid = $args['uid'];
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
        $areas = $dataTable->read($filter, array('certs'), $odata->top,
                                  $odata->skip, $odata->orderby);
        if(empty($areas))
        {
            return $response->withStatus(404);
        }
        if(!isset($areas[0]['certs']))
        {
            return $response->withJson(array());
        }
        return $response->withJson($areas[0]['certs']);
    }

    public function uploadCert($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $uid = $args['uid'];
        if($uid === 'me')
        {
            $uid = $this->user->uid;
        }
        else if($uid !== $this->user->uid && $this->canRead($request) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($uid);
        $users = $dataTable->read($filter);
        if(empty($users))
        {
            return $response->withStatus(404);
        }
        $user = $users[0];
        if(!isset($user['certs']))
        {
             $user['certs'] = array();
        }
        $files = $request->getUploadedFiles();
        $file = $files['file'];
        $stream = $file->getStream();
        $cert = array('status'=>'pending', 'image'=>base64_encode($stream->getContents()), 'imageType'=>$file->getClientMediaType());
        $user['certs'][$args['certId']] = $cert;
        $ret = $dataTable->update($filter, $user);
        if($ret)
        {
            return $response->withStatus(200);
        }
        return $response->withStatus(500);
    }

    public function rejectCert($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $uid = $args['uid'];
        if($uid === 'me')
        {
            $uid = $this->user->uid;
        }
        else if($uid !== $this->user->uid && $this->canRead($request) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($uid);
        $users = $dataTable->read($filter);
        if(empty($users))
        {
            return $response->withStatus(404);
        }
        $user = $users[0];
        $certType = $args['certId'];
        if(!isset($user['certs']) || !isset($user['certs'][$certType]))
        {
            return $response->withStatus(404);
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
        $reason = 'Unknown';
        switch($obj['reason'])
        {
            case 'invalid':
                $reason = 'the image provided did not seem to show a valid certication of the type selected';
                break;
            case 'expired':
                $reason = 'the image provided was for a certification that had already expired';
                break;
        }
        unset($user['certs'][$certType]);
        $ret = $dataTable->update($filter, $user);
        if($ret)
        {
            $profile = new \VolunteerProfile(false, $user);
            $email = new \Emails\CertificationEmail($profile, 'certifcationRejected', $certType, array('reason'=>$reason));
            $emailProvider = \EmailProvider::getInstance();
            if($emailProvider->sendEmail($email) === false)
            {
                throw new \Exception('Unable to send email!');
            }
            return $response->withStatus(200);
        }
        return $response->withStatus(500);
    }

    public function acceptCert($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        $uid = $args['uid'];
        if($uid === 'me')
        {
            $uid = $this->user->uid;
        }
        else if($uid !== $this->user->uid && $this->canRead($request) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($uid);
        $users = $dataTable->read($filter);
        if(empty($users))
        {
            return $response->withStatus(404);
        }
        $user = $users[0];
        $certType = $args['certId'];
        $certType = $args['certId'];
        if(!isset($user['certs']) || !isset($user['certs'][$certType]))
        {
            return $response->withStatus(404);
        }
        $user['certs'][$certType]['status'] = 'current';
        $ret = $dataTable->update($filter, $user);
        if($ret)
        {
            $profile = new \VolunteerProfile(false, $user);
            $email = new \Emails\CertificationEmail($profile, 'certifcationAccepted', $certType);
            $emailProvider = \EmailProvider::getInstance();
            if($emailProvider->sendEmail($email) === false)
            {
                throw new \Exception('Unable to send email!');
            }
            return $response->withStatus(200);
        }
        return $response->withStatus(500);
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
