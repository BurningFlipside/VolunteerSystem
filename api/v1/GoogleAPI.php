<?php
use Volunteer\VolunteerDepartment;
use Volunteer\VolunteerEvent;
use Volunteer\VolunteerProfile;
use Volunteer\VolunteerRole;
use Volunteer\VolunteerShift;
use \Volunteer\Schedules\SimpleGDoc;

class GoogleAPI extends \Flipside\Http\Rest\RestAPI
{
    protected $client;
    protected $token = null;

    public function GoogleAPI()
    {
    }

    public function setup($app)
    {
        $app->get('/loginLink', array($this, 'getLoginLink'));
        $app->get('/loginStatus', array($this, 'getLoginStatus'));
        $app->get('/oauth2callback', array($this, 'OAuth2Callback'));
        $app->get('/spreadsheets', array($this, 'getSpreadsheets'));
        $app->get('/spreadsheets/{id}', array($this, 'getSpreadsheet'));
        $app->get('/spreadsheets/{id}/{sheetTitle}', array($this, 'getSpreadsheetSheet'));
        $app->get('/spreadsheets/{id}/{sheetTitle}/{row}', array($this, 'getSpreadsheetSheet'));
        $app->get('/spreadsheets/{id}/{sheetTitle}/{row}/{col}', array($this, 'getSpreadsheetSheet'));
        $app->post('/Actions/ExportShifts', array($this, 'exportShifts'));
        $app->post('/Actions/ImportShifts', array($this, 'importShifts'));
        $app->post('/Actions/SaveShiftSchedule', array($this, 'generateShiftScheduleToDrive'));
    }

    protected function encryptValue($value)
    {
        $settings = \Flipside\Settings::getInstance();
        $key = hex2bin($settings->getGlobalSetting('tokenEncryptionKey'));
        $nonceSize = openssl_cipher_iv_length('aes-256-ctr');
        $nonce = openssl_random_pseudo_bytes($nonceSize);
        $cipherText = openssl_encrypt($value, 'aes-256-ctr', $key, OPENSSL_RAW_DATA, $nonce);
        return base64_encode($nonce.$cipherText);
    }

    protected function decryptValue($value)
    {
        $settings = \Flipside\Settings::getInstance();
        $key = hex2bin($settings->getGlobalSetting('tokenEncryptionKey'));
        $value = base64_decode($value);
        $nonceSize = openssl_cipher_iv_length('aes-256-ctr');
        $nonce = mb_substr($value, 0, $nonceSize, '8bit');
        $cipherText = mb_substr($value, $nonceSize, null, '8bit');
        return openssl_decrypt($cipherText, 'aes-256-ctr', $key, OPENSSL_RAW_DATA, $nonce);
    }

    protected function removeTokenFromDB()
    {
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'google');
        $filter = new \Flipside\Data\Filter('email eq \''.$this->user->mail.'\'');
        $dataTable->delete($filter);
    }

    protected function storeTokenInDB($token)
    {
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'google');
        $filter = new \Flipside\Data\Filter('email eq \''.$this->user->mail.'\'');
        $entries = $dataTable->read($filter);
        $myToken = $token;
        if($entries !== false && count($entries) !== 0)
        {
            $myToken['access_token'] = $this->encryptValue($myToken['access_token']);
            $myToken['refresh_token'] = $this->encryptValue($myToken['refresh_token']);
            $dataTable->update($filter, $myToken);
            return;
        }
        $myToken['access_token'] = $this->encryptValue($myToken['access_token']);
        $myToken['refresh_token'] = $this->encryptValue($myToken['refresh_token']);
        $myToken['email'] = $this->user->mail;
        $dataTable->create($myToken);
    }

    protected function getTokenFromDB()
    {
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'google');
        $filter = new \Flipside\Data\Filter('email eq \''.$this->user->mail.'\'');
        $entries = $dataTable->read($filter);
        if($entries === false || count($entries) !== 1)
        {
            return null;
        }
        $settings = \Flipside\Settings::getInstance();
        $key = hex2bin($settings->getGlobalSetting('tokenEncryptionKey'));
        $entry = $entries[0];
        $access_token = $this->decryptValue($entry['access_token']);
        $refresh_token = $this->decryptValue($entry['refresh_token']);
        $token = $entry;
        $token['access_token'] = $access_token;
        $token['refresh_token'] = $refresh_token;
        return $token;
    }


    protected function doGoogleClientSetup()
    {
        $this->client = new \Google_Client();
        $this->client->setAuthConfigFile('/var/www/secure_settings/volunteer-system.json');
        $this->client->setAccessType('offline'); // Need this to get a refresh token
        $this->client->setPrompt('consent');
        $this->client->setApprovalPrompt("consent");
        $this->client->addScope(array(\Google_Service_Oauth2::USERINFO_PROFILE, \Google_Service_Oauth2::USERINFO_EMAIL, \Google_Service_Sheets::SPREADSHEETS, \Google_Service_Drive::DRIVE, \Google_Service_Docs::DOCUMENTS));
        $this->token = $this->getTokenFromDB();
        if ($this->token !== null && $this->client->isAccessTokenExpired()) {
            // Try the access token first...
            $this->client->setAccessToken($this->token);
            if(!$this->client->isAccessTokenExpired())
            {
                // Don't need to do anything, the access token is still valid.
                return true;
            }
            if(!isset($this->token['refresh_token']))
            {
                var_dump('Did not have a refresh token');
                return false;
            }
            $res = $this->client->fetchAccessTokenWithRefreshToken($this->token['refresh_token']);
            $this->token = $this->client->getAccessToken();
            if($this->token)
            {
                $this->storeTokenInDB($this->token);
            }
        }
        return !$this->client->isAccessTokenExpired();
    }

    public function getLoginLink($request, $response, $args)
    {
        // Ignore the return code cause if we are asking this we don't care if we are already logged in or not
        $this->validateLoggedIn($request);
        if(!$this->user->isInGroupNamed('VolunteerAdmins'))
        {
            return $response->withStatus(401);
        }
        $this->doGoogleClientSetup();
        $ret = array('uri' => $this->client->createAuthUrl());
        return $response->withJson($ret);
    }

    public function OAuth2Callback($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        if(!$this->user->isInGroupNamed('VolunteerAdmins'))
        {
            return $response->withStatus(401);
        }
        // Cleanup any tokens before we start a new session with Google
        $this->removeTokenFromDB();
        $this->doGoogleClientSetup();
        $this->client->authenticate($request->getQueryParam('code'));
        $this->token = $this->client->getAccessToken();
        if($this->token === null)
        {
            return $response->withStatus(500);
        }
        $this->storeTokenInDB($this->token);
        return $response->withRedirect('/fvs/_admin/google.php');
    }

    public function getLoginStatus($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        if(!$this->user->isInGroupNamed('VolunteerAdmins'))
        {
            return $response->withStatus(401);
        }
        $res = array('loggedIn' => $this->doGoogleClientSetup());
        if($res['loggedIn'] === true)
        {
            $oauth2Service = new \Google_Service_Oauth2($this->client);
            $res['user'] = $oauth2Service->userinfo->get();
        }
        return $response->withJson($res);
    }

    public function getSpreadsheets($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        if(!$this->user->isInGroupNamed('VolunteerAdmins'))
        {
            return $response->withStatus(401);
        }
        if(!$this->doGoogleClientSetup())
        {
            return $response->withStatus(402);
        }
        $service = new \Google_Service_Drive($this->client);
        $files = $service->files->listFiles(array('q' => 'mimeType=\'application/vnd.google-apps.spreadsheet\' and trashed=false', 'fields' => 'files(id, name)'));
        $ret = array();
        $files = $files->getFiles();
        foreach($files as $file)
        {
            $ret[] = array('id' => $file->getId(), 'name' => $file->getName());
        }
        return $response->withJson($ret);
    }

    public function getSpreadsheet($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        if(!$this->user->isInGroupNamed('VolunteerAdmins'))
        {
            return $response->withStatus(401);
        }
        if(!$this->doGoogleClientSetup())
        {
            return $response->withStatus(402);
        }
        $service = new \Google_Service_Sheets($this->client);
        $spreadsheet = $service->spreadsheets->get($args['id']);
        return $response->withJson($spreadsheet);
    }

    public function getSpreadsheetSheet($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        if(!$this->user->isInGroupNamed('VolunteerAdmins'))
        {
            return $response->withStatus(401);
        }
        if(!$this->doGoogleClientSetup())
        {
            return $response->withStatus(402);
        }
        $service = new \Google_Service_Sheets($this->client);
        if(!isset($args['sheetTitle']))
        {
            return $response->withStatus(400);
        }
        $startRow = 1;
        $endRow = 1000;
        $startCol = 'A';
        $endCol = 'Z';
        if(isset($args['row']) && is_numeric($args['row']))
        {
            $startRow = $args['row'];
            $endRow = $args['row'];
        }
        if(isset($args['col']))
        {
            $startCol = $args['col'];
            $endCol = $args['col'];
        }
        $range = $args['sheetTitle'].'!'.$startCol.$startRow.':'.$endCol.$endRow;
        $googleResponse = $service->spreadsheets_values->get($args['id'], $range);
        return $response->withJson($googleResponse->getValues());
    }

    public function exportShifts($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        if(!$this->user->isInGroupNamed('VolunteerAdmins'))
        {
            return $response->withStatus(401);
        }
        if(!$this->doGoogleClientSetup())
        {
            return $response->withStatus(402);
        }
        $obj = $this->getParsedBody($request);
        if(!isset($obj['department']) || !isset($obj['event']))
        {
            return $response->withStatus(400);
        }
        $dept = new \Volunteer\VolunteerDepartment($obj['department']);
        if(!$dept)
        {
            return $response->withStatus(404);
        }
        $event = new \Volunteer\VolunteerEvent($obj['event']);
        if(!$event)
        {
            return $response->withStatus(404);
        }
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $shifts = $dataTable->read(new \Flipside\Data\Filter('eventID eq '.$event->_id.' and departmentID eq '.$dept->departmentID));
        if($shifts === false)
        {
            return $response->withStatus(204);
        }
        $service = new \Google_Service_Sheets($this->client);
        $name = $event->name.' '.$dept->departmentName.' Shifts Export '.date('Y-m-d H:i:s');
        $spreadsheet = new \Google_Service_Sheets_Spreadsheet([
            'properties' => [
                'title' => $name
                ]
        ]);
        $spreadsheet = $service->spreadsheets->create($spreadsheet, [
                'fields' => 'spreadsheetId'
        ]);
        $values = [
            ['DepartmentID', 'StartDay', 'StartTime', 'EndDay', 'EndTime', 'Name', 'RoleID', 'Group?', 'Early Entry Window', 'Needs Approval?', 'Participant Email', 'Participant Name', 'Create more shifts when one is filled?']
        ];
        $count = count($shifts);
        for($i = 0; $i < $count; $i++)
        {
            $shifts[$i] = new \Volunteer\VolunteerShift($shifts[$i]['_id'], $shifts[$i]);
        }
        $days = array();
        usort($shifts, array($this, 'shiftTimeSort'));
        for($i = 0; $i < $count; $i++)
        {
            $shift = $shifts[$i];
            $startDateString = $shift->startTime->format('Y-m-d');
            $weekday = $shift->startTime->format('l');
            if(!isset($days[$startDateString]))
            {
                if(array_search($weekday, $days) !== false)
                {
                    $weekday = $weekday.'Next';
                }
                $days[$startDateString] = $weekday;
            }
            $startWeekday = $days[$startDateString];
            $startTime = $shift->startTime->format('H:i:s');
            $endDateString = $shift->endTime->format('Y-m-d');
            $weekday = $shift->endTime->format('l');
            if(!isset($days[$endDateString]))
            {
                if(array_search($weekday, $days) !== false)
                {
                    $weekday = $weekday.'Next';
                }
                $days[$endDateString] = $weekday;
            }
            $endWeekday = $days[$endDateString];
            $endTime = $shift->endTime->format('H:i:s');
            $group = "No";
            if(strlen($shift->groupID) > 0)
            {
                $group = "Yes";
            }
            $eeShift = "";
            switch($shift->earlyLate)
            {
                case '2':
                    $eeShift = "Tuesday Infrastructure";
                    break;
                case '1':
                    $eeShift = "Wednesday Infrastructure";
                    break;
                case '0':
                    $eeShift = "Theme Camp/Art Early Entry";
                    break;
                case '-1':
                    $eeShift = "No";
                    break;
            }
            $approval = "No";
            if($shift->approvalNeeded)
            {
                $approval = "Yes";
            }
            $unbound = "No";
            if($shift->unbounded)
            {
                $unbound = "Yes";
            }
            $participant = $shift->participantObj;
            $email = '';
            if($participant)
            {
                $email = $participant->email;
            }
            $name = '';
            if($participant)
            {
                $name = $participant->getDisplayName('paperName');
            }
            $values[] = [$shift->departmentID, $startWeekday, $startTime, $endWeekday, $endTime, $shift->name, $shift->roleID, $group, $eeShift, $approval, $email, $name, $unbound];
        }
        $range = 'Sheet1!A1:M'.$count+1;
        $body = new \Google_Service_Sheets_ValueRange([
            'values' => $values
        ]);
        $params = [
            'valueInputOption' => 'RAW'
        ];
        $result = $service->spreadsheets_values->update($spreadsheet->spreadsheetId, $range, $body, $params);
        // Bold the top row
        $format = array('textFormat' => array('bold' => true));
        $sheets = $spreadsheet->getSheets();
        $requests = [
            new \Google_Service_Sheets_Request([
                'repeatCell' => [
                    'range' => [
                        'sheetId' => 0,
                        'startRowIndex' => 0,
                        'endRowIndex' => 1,
                        'startColumnIndex' => 0,
                        'endColumnIndex' => 6
                    ],
                    'cell' => [
                        'userEnteredFormat' => $format
                    ],
                    'fields' => 'userEnteredFormat'
                ]
                ])
        ];
        $batchUpdateRequest = new Google_Service_Sheets_BatchUpdateSpreadsheetRequest([
            'requests' => $requests
        ]);
        $result = $service->spreadsheets->batchUpdate($spreadsheet->spreadsheetId, $batchUpdateRequest);
        return $response->withJson(array('id' => $spreadsheet->spreadsheetId));
    }

    public function shiftTimeSort($a, $b)
    {
        $aInt = $a->startTime->getTimestamp();
        $bInt = $b->startTime->getTimestamp();
        return $aInt - $bInt;
    }

    public function importShifts($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        if(!$this->user->isInGroupNamed('VolunteerAdmins'))
        {
            return $response->withStatus(401);
        }
        if(!$this->doGoogleClientSetup())
        {
            return $response->withStatus(402);
        }
        $obj = $this->getParsedBody($request);
        $event = new \Volunteer\VolunteerEvent($obj['event']);
        if(!$event)
        {
            return $response->withStatus(404);
        }
        $dates = $event->getDateForDays();
        $range = $obj['tab'].'!A1:Z1000';
        $service = new \Google_Service_Sheets($this->client);
        $googleResponse = $service->spreadsheets_values->get($obj['sheet'], $range);
        $values = $googleResponse->getValues();
        $headers = array_shift($values);
        $index = array_search('Create more shifts when one is filled?', $headers);
        if($index !== false)
        {
            $headers[$index] = 'unbounded';
        }
        $count = count($values);
        for($i = 0; $i < $count; $i++)
        {
            $row = $values[$i];
            $row = array_combine($headers, $row);
            if(!isset($dates[$row['StartDay']]) || !isset($dates[$row['EndDay']]))
            {
                return $response->withJson(array('error' => 'Cannot Import. Missing a day needed for the event.'))->withStatus(400);
            }
            $shiftStartTime = $dates[$row['StartDay']];
            $shiftEndTime = $dates[$row['EndDay']];
            $interval = date_parse_from_format('H:i:s', $row['StartTime']);
            $shiftStartTime = $shiftStartTime->setTime($interval['hour'], $interval['minute'], $interval['second']);
            if($shiftStartTime->getTimestamp() < $event->startTime->getTimestamp())
            {
                if(!isset($obj['forceStart']) || $obj['forceStart'] !== true)
                {
                    return $response->withJson(array('error' => 'Cannot Import. Shift starts before the new event.', 'code' => 'beforeStart'))->withStatus(400);
                }
                $shiftStartTime = $event->startTime;
            }
            $interval = date_parse_from_format('H:i:s', $row['EndTime']);
            $shiftEndTime = $shiftEndTime->setTime($interval['hour'], $interval['minute'], $interval['second']);
            if($shiftEndTime->getTimestamp() > $event->endTime->getTimestamp())
            {
                if(!isset($obj['forceEnd']) || $obj['forceEnd'] !== true)
                {
                    return $response->withJson(array('error' => 'Cannot Import. Shift ends after the new event.', 'code' => 'afterEnd'))->withStatus(400);
                }
                $shiftEndTime = $event->endTime;
            }
            $row['startDT'] = $shiftStartTime;
            $row['endDT'] = $shiftEndTime;
            unset($row['StartDay']);
            unset($row['EndDay']);
            unset($row['StartTime']);
            unset($row['EndTime']);
            unset($row['Participant Name']);
            if(!isset($obj['importParticipants']) || !$obj['importParticipants'])
            {
                unset($row['Participant Email']);
            }
            $values[$i] = $row;
        }
        // Ok if we got here we passed basic sanity checks. Now we need to create the shifts
        $successCount = 0;
        $failCount = 0;
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $prevInGroup = null;
        foreach($values as $row)
        {
            $shift = array();
            $shift['departmentID'] = $row['DepartmentID'];
            $shift['startTime'] = $row['startDT']->format(\DateTimeInterface::W3C);
            $shift['endTime'] = $row['endDT']->format(\DateTimeInterface::W3C);
            $shift['name'] = $row['Name'];
            $shift['eventID'] = $obj['event'];
            $shift['roleID'] = $row['RoleID'];
            switch($row['Early Entry Window'])
            {
                case 'Tuesday Infrastructure':
                    $shift['earlyLate'] = '2';
                    break;
                case 'Wednesday Infrastructure':
                    $shift['earlyLate'] = '1';
                    break;
                case 'Theme Camp/Art Early Entry':
                    $shift['earlyLate'] = '0';
                    break;
                default:
                    $shift['earlyLate'] = '-1';
                    break;
            }
            if(isset($row['Participant Email']) && strlen($row['Participant Email']) > 0)
            {
                $participant = $this->getParticipantByEmail($row['Participant Email']);
                if($participant === null)
                {
                    // This means they don't have a profile. Go ahead and assign them the shift anyway...
                    $shift['participant'] = $row['Participant Email'];
                }
                else
                {
                    $shift['participant'] = $participant->uid;
                }
                $shift['status'] = 'filled';
            }
            $shift['enabled'] = true;
            $shift['approvalNeeded'] = $row['Needs Approval?'] == 'Yes';
            $shift['unbounded'] = false;
            if(isset($row['unbounded']) && $row['unbounded'] == 'Yes')
            {
                $shift['unbounded'] = true;
            }
            if($row['Group?'] == 'Yes')
            {
                if($prevInGroup === null || $prevInGroup['startTime'] !== $shift['startTime'])
                {
                    $shift['groupID'] = $this->genUUID();
                    $prevInGroup = $shift;
                }
                else
                {
                    $shift['groupID'] = $prevInGroup['groupID'];
                }
            }
            $ret = $dataTable->create($shift);
            if($ret === false)
            {
                $failCount++;
            }
            else
            {
                $successCount++;
            }
        }
        return $response->withJson(array('success' => $successCount, 'fail' => $failCount));
    }

    protected function getParticipantByEmail($email)
    {
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'participants');
        $filter = new \Flipside\Data\Filter('email eq \''.$email.'\'');
        $entries = $dataTable->read($filter);
        if($entries === false || count($entries) !== 1)
        {
            return null;
        }
        return new \Volunteer\VolunteerProfile($entries[0]['_id'], $entries[0]);
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

    public function generateShiftScheduleToDrive($request, $response, $args)
    {
        $this->validateLoggedIn($request);
        if(!$this->user->isInGroupNamed('VolunteerAdmins'))
        {
            return $response->withStatus(401);
        }
        if(!$this->doGoogleClientSetup())
        {
            return $response->withStatus(402);
        }
        $obj = $this->getParsedBody($request);
        if(!isset($obj['department']) || !isset($obj['event']))
        {
            return $response->withStatus(400);
        }
        $dept = new \Volunteer\VolunteerDepartment($obj['department']);
        if(!$dept)
        {
            return $response->withStatus(404);
        }
        $event = new \Volunteer\VolunteerEvent($obj['event']);
        if(!$event)
        {
            return $response->withStatus(404);
        }
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $shifts = $dataTable->read(new \Flipside\Data\Filter('eventID eq '.$event->_id.' and departmentID eq '.$dept->departmentID));
        if($shifts === false)
        {
            return $response->withStatus(204);
        }
        switch($request->getParam('type'))
        {
            case 'simple':
                return $this->generateSimpleSchedule($dept, $shifts, $response);
        }
        return $response->withJson($shifts);
    }

    public function generateSimpleSchedule($dept, $shifts, $response)
    {
        $gdoc = new SimpleGDoc($dept, $shifts, $this->client);
        return $response->withJson(array('documentID' => $gdoc->docID));
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
