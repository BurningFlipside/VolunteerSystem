<?php

use \DateTime as DateTime;
use \DateTimeZone as DateTimeZone;
use \Exception as Exception;

use \Flipside\ODataParams;
use \Flipside\Data\Filter as DataFilter;

use Volunteer\VolunteerProfile;
use Volunteer\Emails\CertificationEmail;
use Volunteer\Schedules\SimplePDF as SimpleSchedulePDF;

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
        $app->get('/{uid}/ticketStatus', array($this, 'getTicketStatus'));
        $app->post('/Actions/BulkTicketStatus', array($this, 'bulkTicketStatus'));
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
        if($this->user->isInGroupNamed('Leads'))
        {
            return true;
        }
        //Lt's get access as well
        if($this->isLt($this->user))
        {
            return true;
        }
        return false;
    }

    protected function isLt($user)
    {
        $emailList = array();
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'departments');
        $departments = $dataTable->read();
        $count = count($departments);
        for($i = 0; $i < $count; $i++)
        {
            if(isset($departments[$i]['others']))
            {
                $others = $departments[$i]['others'];
                $others = explode(',', str_replace(' ', '', $departments[$i]['others']));
                $emailList = array_merge($emailList, $others);
            }
        }
        return in_array($user->mail, $emailList);
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
        //TODO give access to department lead
        return false;
    }

    protected function canDelete($request, $entity)
    {
        return $this->canUpdate($request, $entity);
    }

    /**
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    protected function validateCreate(&$obj, $request)
    {
        if(isset($obj['uid']))
        {
            return false;
        }
        $uid = $this->user->uid;
        if(!isset($obj['email']))
        {
            $obj['email'] = $this->user->mail;
        }
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
        $odata = $request->getAttribute('odata', new ODataParams(array()));
        $filter = $this->getFilterForPrimaryKey($uid);
        $areas = $dataTable->read($filter, $odata->select, $odata->top,
                                    $odata->skip, $odata->orderby);
        if(empty($areas))
        {
            return $response->withStatus(404);
        }
        return $response->withJson($areas[0]);
    }

    private function getSingleEntry($entry) : mixed
    {
        if(count($entry) === 1 && isset($entry[0]))
        {
            $entry = $entry[0];
        }
        return $entry;
    }

    public function updateEntry($request, $response, $args)
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
        $filter = $this->getFilterForPrimaryKey($uid);
        $dataTable = $this->getDataTable();
        $entry = $dataTable->read($filter);
        if(empty($entry))
        {
            return $response->withStatus(404);
        }
        $entry = $this->getSingleEntry($entry);
        if($uid !== $this->user->uid && $this->canUpdate($request, $entry) === false)
        {
            return $response->withStatus(401);
        }
        $obj = $this->getParsedBody($request);
        if($this->validateUpdate($obj, $request, $entry) === false)
        {
            return $response->withStatus(400);
        }
        $ret = $dataTable->update($filter, $obj);
        return $response->withJson($ret);
    }

    public function getMyShifts($request, $response)
    {
        $this->validateLoggedIn($request);
        $uid = $this->user->uid;
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $filter = new DataFilter("participant eq '$uid'");
        $shifts = $dataTable->read($filter);
        $format = $request->getAttribute('format', false);
        if($format === false || $format === 'text/calendar')
        {
            $text = "BEGIN:VCALENDAR\r\n";
            $text .= "VERSION:2.0\r\n";
            $text .= "PRODID:-//hacksw/handcal//NONSGML v1.0//EN\r\n";
            $count = count($shifts);
            for($i = 0; $i < $count; $i++)
            {
                $text .= "BEGIN:VEVENT\r\n";
                $text .= "UID:".$this->user->mail."\r\n";
                $dateTime = new DateTime($shifts[$i]['startTime']);
                $dateTime->setTimezone(new DateTimeZone('UTC'));
                $text .= "DTSTAMP:".$dateTime->format('Ymd\THis\Z')."\r\n";
                $text .= "DTSTART:".$dateTime->format('Ymd\THis\Z')."\r\n";
                $dateTime = new DateTime($shifts[$i]['endTime']);
                $dateTime->setTimezone(new DateTimeZone('UTC'));
                $text .= "DTEND:".$dateTime->format('Ymd\THis\Z')."\r\n";
                $text .= "SUMMARY:".$shifts[$i]['roleID'].' '.$shifts[$i]['name']."\r\n";
                $text .= "END:VEVENT\r\n";
            }
            $text .= "END:VCALENDAR\r\n";
            $response = $response->withHeader('Content-type', 'text/calendar');
            $response = $response->withHeader('Content-Disposition', 'attachment; filename="MyShifts.ics"');
            $body = $response->getBody();
            $body->write($text);
            return $response;
        }
        else if($format === 'application/pdf')
        {
            $pdf = new SimpleSchedulePDF('My', $shifts);
            $response = $response->withHeader('Content-Type', 'application/pdf');
            $response->getBody()->write($pdf->toPDFBuffer());
            return $response;
        }
        else if($format === 'json')
        {
            return $response->withJSON($shifts);
        }
        throw new Exception('Unknown format '.$format);
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
        $odata = $request->getAttribute('odata', new ODataParams(array()));
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

    private function sendCertificationEmail($user, $emailTypeSource, $certType, $other = array())
    {
        $profile = new VolunteerProfile(false, $user);
        $email = new CertificationEmail($profile, $emailTypeSource, $certType, $other);
        $emailProvider = \Flipside\EmailProvider::getInstance();
        if($emailProvider->sendEmail($email) === false)
        {
            throw new Exception('Unable to send email!');
        }
    }

    private function getRejectReason($reasonCode) : string
    {
        switch($reasonCode)
        {
            case 'invalid':
                return 'the image provided did not seem to show a valid certification of the type selected';
            case 'expired':
                return 'the image provided was for a certification that had already expired';
            default:
                return 'Unknown';
        }
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
        $obj = $this->getParsedBody($request);
        $reason = $this->getRejectReason($obj['reason']);
        unset($user['certs'][$certType]);
        $ret = $dataTable->update($filter, $user);
        if($ret)
        {
            $this->sendCertificationEmail($user, 'certificationRejected', $certType, array('reason'=>$reason));
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
        if(!isset($user['certs']) || !isset($user['certs'][$certType]))
        {
            return $response->withStatus(404);
        }
        $user['certs'][$certType]['status'] = 'current';
        $obj = $this->getParsedBody($request);
        if(isset($obj['expiresOn']))
        {
            $user['certs'][$certType]['expiresOn'] = $obj['expiresOn'];
        }
        $ret = $dataTable->update($filter, $user);
        if($ret)
        {
            $this->sendCertificationEmail($user, 'certificationAccepted', $certType);
            return $response->withStatus(200);
        }
        return $response->withStatus(500);
    }

    public function getTicketStatus($request, $response, $args)
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
        $vol = new VolunteerProfile(false, $user);
        return $vol->getTicketStatus();
    }

    private function getTicketsFromTicketTable($ticketTable, $user, string $email, $year) : array
    {
        if(isset($user['ticketCode']))
        {
            $code = $user['ticketCode'];
            $tickets = $ticketTable->read(new DataFilter("contains(hash,$code) and year eq $year"));
            if(!empty($tickets))
            {
                return $tickets;
            }
        }
        return $ticketTable->read(new DataFilter("email eq '$email' and year eq $year"));
    }

    function bulkTicketStatus($request, $response)
    {
        $this->validateLoggedIn($request);
        if($this->canRead($request) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = $this->getDataTable();
        $obj = $this->getParsedBody($request);
        if(!isset($obj['uids']))
        {
            return $response->withStatus(400);
        }
        $ret = array();
        $data = $dataTable->read(array('uid'=>array('$in'=>$obj['uids'])), array('email','ticketCode','uid'));
        $settingsTable = \Flipside\DataSetFactory::getDataTableByNames('tickets', 'Variables');
        $settings = $settingsTable->read(new DataFilter('name eq \'year\''));
        $year = $settings[0]['value'];
        $ticketTable = \Flipside\DataSetFactory::getDataTableByNames('tickets', 'Tickets');
        $requestTable = \Flipside\DataSetFactory::getDataTableByNames('tickets', 'TicketRequest');
        $count = count($data);
        for($i = 0; $i < $count; $i++)
        {
            $user = $data[$i];
            $email = $user['email'];
            $tickets = $this->getTicketsFromTicketTable($ticketTable, $user, $email, $year);
            if(!empty($tickets))
            {
                $ret[$user['uid']] = array('ticket' => true);
                continue;
            }
            $requests = $requestTable->read(new DataFilter("mail eq '$email' and year eq $year"));
            if(empty($requests))
            {
                $ret[$user['uid']] = array('ticket' => false, 'request' => false);
                continue;
            }
            if($requests[0]['status'] === '1')
            {
                $ret[$user['uid']] = array('ticket' => false, 'request' => true, 'requestReceived' => true);
            }
            $ret[$user['uid']] = array('ticket' => false, 'request' => true);
        }
        return $response->withJson($ret);
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
