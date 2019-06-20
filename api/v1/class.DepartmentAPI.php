<?php

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Writer\Pdf\Mpdf;

class DepartmentAPI extends Http\Rest\DataTableAPI
{
    use Processor;

    protected $isAdmin = null;
    protected $isLead = null;

    public function __construct()
    {
        parent::__construct('fvs', 'departments', 'departmentID');
    }

    public function setup($app)
    {
        parent::setup($app);
        $app->get('/{dept}/roles[/]', array($this, 'getRolesForDepartment'));
        $app->post('/{dept}/roles[/]', array($this, 'createRoleForDepartment'));
        $app->patch('/{dept}/roles/{roleName}[/]', array($this, 'updateRoleForDepartment'));
        $app->get('/{dept}/shifts[/]', array($this, 'getShiftsForDepartment'));
        $app->post('/{dept}/shifts[/]', array($this, 'createShiftForDepartment'));
        $app->get('/{dept}/shifts/Actions/GenerateShiftSchedule', array($this, 'generateShiftSchedule'));
    }

    protected function isVolunteerAdmin($request)
    {
        $this->validateLoggedIn($request);
        if($this->isAdmin === null)
        {
            $this->isAdmin = $this->user->isInGroupNamed('VolunteerAdmins');
        }
        return $this->isAdmin;
    }

    protected function canCreate($request)
    {
        return $this->isVolunteerAdmin($request);
    }

    protected function canEditDept($request, $deptId, $dept = null)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        if($dept !== null)
        {
            return $this->isUserDepartmentLead2($dept, $this->user);
        }
        return $this->isUserDepartmentLead($deptId, $this->user);
    }

    protected function canUpdate($request, $entity)
    {
        return $this->canEditDept($request, false);
    }

    protected function canDelete($request, $entity)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        return false;
    }

    protected function processEntry($entry, $request)
    {
        $entry['available'] = true;
        $entry['isAdmin'] = $this->canEditDept($request, null, $entry);
        if(isset($entry['public']) && $entry['public'] === false)
        {
            if(!$this->isUserDepartmentLead2($entry, $this->user))
            {
                $entry['available'] = false;
                $entry['why'] = 'Not lead of department';
            }
            if(!$entry['available'] && !$entry['isAdmin'])
            {
                return null;
            }
        }
        return $entry;
    }

    public function getRolesForDepartment($request, $response, $args)
    {
        $deptId = $args['dept'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'roles');
        $filter = new \Data\Filter("departmentID eq '$deptId'");
        $odata = $request->getAttribute('odata', new \ODataParams(array()));
        $roles = $dataTable->read($filter, $odata->select, $odata->top,
                                  $odata->skip, $odata->orderby);
        if($roles === false)
        {
            $roles = array();
        }
        return $response->withJson($roles);
    }

    public function getShiftsForDepartment($request, $response, $args)
    {
        $deptId = $args['dept'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $filter = new \Data\Filter("departmentID eq '$deptId'");
        $odata = $request->getAttribute('odata', new \ODataParams(array()));
        $shifts = $dataTable->read($filter, $odata->select, $odata->top,
                                  $odata->skip, $odata->orderby);
        if($shifts === false)
        {
            $shifts = array();
        }
        return $response->withJson($shifts);
    }

    public function createRoleForDepartment($request, $response, $args)
    {
        $deptId = $args['dept'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'roles');
        $obj = $request->getParsedBody();
        if($obj == NULL)
        {
            $obj = json_decode($request->getBody()->getContents(), true);
        }
        $obj['departmentID'] = $deptId;
        $ret = $dataTable->create($obj);
        return $response->withJson($ret);
    }

    public function createShiftForDepartment($request, $response, $args)
    {
        $deptId = $args['dept'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $obj = $request->getParsedBody();
        if($obj == NULL)
        {
            $obj = json_decode($request->getBody()->getContents(), true);
        }
        $obj['departmentID'] = $deptId;
        $ret = $dataTable->create($obj);
        return $response->withJson($ret);
    }

    public function updateRoleForDepartment($request, $response, $args)
    {
        $deptId = $args['dept'];
        $roleId = $args['roleName'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'roles');
        $filter = new \Data\Filter("departmentID eq '$deptId' and short_name eq '$roleId'");
        $entry = $dataTable->read($filter);
        if(empty($entry))
        {
            return $response->withStatus(404);
        }
        if(count($entry) === 1 && isset($entry[0]))
        {
            $entry = $entry[0];
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
        $ret = $dataTable->update($filter, $obj);
        return $response->withJson($ret);
    }

    public function generateShiftSchedule($request, $response, $args)
    {
        $deptId = $args['dept'];
        if($this->canEditDept($request, $deptId) === false)
        {
            return $response->withStatus(401);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'departments');
        $depts = $dataTable->read(new \Data\Filter('departmentID eq '.$deptId));
        if(empty($depts))
        {
            return $response->withStatus(404);
        }
        $dataTable = DataSetFactory::getDataTableByNames('fvs', 'shifts');
        $eventId = $request->getParam('eventID');
        $filter = new \Data\Filter('eventID eq '.$eventId.' and departmentID eq '.$deptId);
        $shifts = $dataTable->read($filter);
        if(empty($shifts))
        {
            return $response->withStatus(404);
        }
        switch($request->getParam('type'))
        {
            case 'simplePDF':
               return $this->generateSimplePDFSchedule($depts[0], $shifts, $request, $response);
            case 'gridXLSX':
               return $this->generateGridSchedule($depts[0], $shifts, $request, $response, 'XLSX');
            case 'gridPDF':
               return $this->generateGridSchedule($depts[0], $shifts, $request, $response, 'PDF');
        }
        return $response->withJson($shifts);
    }

    public function getRoleNameFromID($roleID)
    {
        static $roles = null;
        if($roles === null)
        {
            $dataTable = DataSetFactory::getDataTableByNames('fvs', 'roles');
            $tmp = $dataTable->read();
            $roles = array();
            $count = count($tmp);
            for($i = 0; $i < $count; $i++)
            {
                if(isset($tmp[$i]['display_name']))
                {
                    $roles[$tmp[$i]['short_name']] = $tmp[$i]['display_name'];
                }
                else
                {
                    $roles[$tmp[$i]['short_name']] = $tmp[$i]['short_name'];
                }
            }
        }
        return $roles[$roleID];
    }

    public function generateSimplePDFSchedule($dept, $shifts, $request, $response)
    {
        $pdf = new \PDF\PDF();
        $html = '<body>';
        $html.= '<style type="text/css">table {border-collapse: collapse;} table, th, td {border: 1px solid black;}</style>';
        $html.= '<h1 style="text-align: center;">'.$dept['departmentName'].' Shift Schedule</h1>';
        //Group shifts by day...
        $days = array();
        $count = count($shifts);
        for($i = 0; $i < $count; $i++)
        {
            $start = new DateTime($shifts[$i]['startTime']);
            $end = new DateTime($shifts[$i]['endTime']);
            $shifts[$i]['startTime'] = $start;
            $shifts[$i]['endTime'] = $end;
            $dateStr = $start->format('l (n/j/Y)');
            $timeStr = $start->format('g:i A').' till '.$end->format('g:i A');
            if(strlen($shifts[$i]['name']) > 0)
            {
                $timeStr.=' - <i>'.$shifts[$i]['name'].'</i>';
            }
            if(!isset($days[$dateStr]))
            {
                $days[$dateStr] = array();
            }
            if(!isset($days[$dateStr][$timeStr]))
            {
                $days[$dateStr][$timeStr] = array();
            }
            array_push($days[$dateStr][$timeStr], $shifts[$i]);
        }
        ksort($days);
        foreach($days as $dateStr=>$day)
        {
            $html.='<h2>'.$dateStr.'</h2>';
            uksort($day, array($this, 'groupSort'));
            foreach($day as $shiftStr=>$shifts)
            {
                usort($shifts, array($this, 'shiftSort'));
                $html.='<h3>'.$shiftStr.'</h3>';
                $html.='<table width="100%"><tr><th style="width: 20%">Role</th><th>Volunteer Name</th><th>Volunteer Camp</th></tr>';
                foreach($shifts as $shift)
                {
                    //TODO Volunteer info for shift...
                    $html.='<tr><td>'.$this->getRoleNameFromID($shift['roleID']).'</td><td></td><td></td></tr>';
                }
                $html.='</table>';
            }
        }
        $html.='</body>';
        $pdf->setPDFFromHTML($html);
        $response = $response->withHeader('Content-Type', 'application/pdf');
        $response->getBody()->write($pdf->toPDFBuffer());
        return $response;
    }

    public function generateGridSchedule($dept, $shifts, $request, $response, $type)
    {
        $ssheat = new Spreadsheet();
        $sheat = $ssheat->getActiveSheet();
        $sheat->setCellValue('A1', $dept['departmentName']);
        $count = count($shifts);
        $days = array();
        $roles = array();
        $roles2 = array();
        for($i = 0; $i < $count; $i++)
        {
            $start = new DateTime($shifts[$i]['startTime']);
            $end = new DateTime($shifts[$i]['endTime']);
            $shifts[$i]['startTime'] = $start;
            $shifts[$i]['endTime'] = $end;
            $startDateStr = $start->format('l (n/j/Y)');
            $endDateStr = $end->format('l (n/j/Y)');
            $days[$startDateStr] = 1;
            $days[$endDateStr] = 1;
            $diff = $start->diff($end);
            $shifts[$i]['length'] = $diff->h;
            if(!isset($roles[$shifts[$i]['roleID']]))
            {
                 $roles[$shifts[$i]['roleID']] = $shifts[$i]['length'];
                 $roles2[$shifts[$i]['roleID']] = array();
            }
            else
            {
                 if($roles[$shifts[$i]['roleID']] < $shifts[$i]['length'])
                 {
                     $roles[$shifts[$i]['roleID']] = $shifts[$i]['length'];
                 }
            }
            array_push($roles2[$shifts[$i]['roleID']], array('start'=>$start, 'end'=>$end));
        }
        arsort($roles);
        usort($shifts, array($this, 'shiftTimeSort'));
        $originalStartTime = $shifts[0]['startTime'];
        $str = $shifts[0]['startTime']->format('c');
        $start = date_parse($str);
        $lastShift = $shifts[$count-1];
        $interval = $lastShift['endTime']->diff($shifts[0]['startTime']);
        $hourCount = ($interval->d*24)+$interval->h;
        $simpleHours = array();
        $militaryHours = array();
        $hour = $start['hour'];
        for($i = 0; $i < $hourCount; $i++)
        {
            if($hour < 12)
            {
                if($hour === 0)
                {
                    array_push($simpleHours, '12a');
                }
                else
                {
                    array_push($simpleHours, $hour.'a');
                }
            }
            else
            {
                if($hour === 12)
                {
                    array_push($simpleHours, $hour.'p');
                }
                else
                {
                    array_push($simpleHours, ($hour-12).'p');
                }
            }
            array_push($militaryHours, $hour.':00');
            $hour++;
            if($hour === 24)
            {
                $hour = 0;
            }
        }
        $sheat->fromArray($simpleHours, null, 'B2');
        $sheat->fromArray($militaryHours, null, 'B3');
        $mergeCount = 24-$start['hour'];
        if($mergeCount > $hourCount)
        {
            $mergeCount = $hourCount;
        }
        $days = array_keys($days);
        $cellIndex = 2;
        while($mergeCount)
        {
            $sheat->mergeCellsByColumnAndRow($cellIndex, 1, $cellIndex+$mergeCount-1, 1);
            $sheat->setCellValueByColumnAndRow($cellIndex, 1, array_shift($days));
            $cell = $sheat->getCellByColumnAndRow($cellIndex, 1);
            $cell->getStyle()->getAlignment()->setHorizontal('center');
            $cellIndex+=$mergeCount;
            $hourCount-=$mergeCount;
            $mergeCount = $hourCount;
            if($mergeCount > 24)
            {
                $mergeCount = 24;
            }
        }
        $i = 0;
        $rows = array();
        foreach($roles as $role=>$hour)
        {
            $sheat->setCellValueByColumnAndRow(1, 4+$i, $this->getRoleNameFromID($role));
            array_push($rows, $role);
            $overlaps = array();
            for($j = 0; $j < count($roles2[$role])-1; $j++)
            {
                $currRole = $roles2[$role][$j];
                $nextRole = $roles2[$role][$j+1];
                if($currRole['end'] > $nextRole['start'])
                {
                    $str = $currRole['start']->format('c');
                    if(!isset($overlaps[$str]))
                    {
                        $overlaps[$str] = 0;
                    }
                    $overlaps[$str]++;
                }
            }
            if(!empty($overlaps))
            {
                $overlapCount = max(array_values($overlaps));
                for($j = 0; $j < $overlapCount+1; $j++)
                {
                    $i++;
                    $sheat->setCellValueByColumnAndRow(1, 4+$i, $this->getRoleNameFromID($role));
                    if($j > 0)
                    {
                        array_push($rows, $role);
                    }
                }
            }
            else
            {
                $i++;
            }
        }
        $shift = array_shift($shifts);
        while($shift)
        {
            $i = 1;
            $timeDiff = $originalStartTime->diff($shift['startTime']);
            $hoursFromStart = ($timeDiff->d*24)+$timeDiff->h;
            $firstRow = array_search($shift['roleID'], $rows);
            $cell = $sheat->getCellByColumnAndRow($hoursFromStart+2, $firstRow+4);
            if($cell->isInMergeRange())
            {
                while($rows[$firstRow+$i] === $shift['roleID'])
                {
                    $cell = $sheat->getCellByColumnAndRow($hoursFromStart+2, $firstRow+4+$i);
                    if(!$cell->isInMergeRange())
                    {
                        break;
                    }
                    $i++;
                }
                $sheat->mergeCellsByColumnAndRow($hoursFromStart+2, $firstRow+4+$i, $hoursFromStart+1+$shift['length'], $firstRow+4+$i);
            }
            else
            {
                $sheat->mergeCellsByColumnAndRow($hoursFromStart+2, $firstRow+4, $hoursFromStart+1+$shift['length'], $firstRow+4);
            }
            $shift = array_shift($shifts);
        }
        $style = $sheat->getStyleByColumnAndRow(2, 4, 1+count($simpleHours), 3+count($rows));
        $style->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
        for($i = 0; $i < count($simpleHours); $i++)
        {
            for($j = 0; $j < count($rows); $j++)
            {
                 $cell = $sheat->getCellByColumnAndRow($i+2, $j+4);
                 if($cell->isInMergeRange())
                 {
                      continue;
                 }
                 else
                 {
                     $style = $cell->getStyle();
                     $style->getBorders()->getAllBorders()->setBorderStyle(false);
                     $style->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_PATTERN_LIGHTGRAY);
                 }
            }
        }
        $sheat->getColumnDimension('A')->setAutoSize(true);
        if($type === 'XLSX')
        {
            $writer = new Xlsx($ssheat);
            $content = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            $extension = '.xlsx';
        }
        else if($type === 'PDF')
        {
            $sheat->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);
            $writer = new mpdf($ssheat);
            $writer->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);
            $content = 'application/pdf';
            $extension = '.pdf';
        }
        ob_start();
        $writer->save('php://output');
        $str = ob_get_clean();
        $response = $response->withHeader('Content-Type', $content);
        $response = $response->withHeader('Content-Disposition', 'attachment; filename='.$dept['departmentName'].$extension);
        $response->getBody()->write($str);
        return $response;
    }

    public function shiftSort($a, $b)
    {
        return strcmp($this->getRoleNameFromID($a['roleID']), $this->getRoleNameFromID($b['roleID']));
    }

    public function groupSort($a, $b)
    {
        $aArr = explode(' ', $a);
        $bArr = explode(' ', $b);
        if($aArr[1] === 'PM' && $bArr[1] === 'AM')
        {
            return 1;
        }
        else if($aArr[1] === 'AM' && $bArr[1] === 'PM')
        {
            return -1;
        }
        return strcmp($a, $b);
    }

    public function shiftTimeSort($a, $b)
    {
        $interval = $a['startTime']->diff($b['startTime']);
        if($interval->invert === 0)
        {
            if($interval->h || $interval->i)
            {
                return -1;
            }
            else
            {
                return 0;
            }
        }
        else if($interval->invert === 1 && $interval->h)
        {
            return 1;
        }
        print_r($interval);
        die();
    }
}

