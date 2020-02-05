<?php
namespace Schedules;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Writer\Pdf\Mpdf;

require_once('../../api/v1/class.Processor.php');

class GridSchedule
{
    use ShiftSchedule;
    use \Processor;

    protected $department;
    protected $shifts;
    protected $ssheat;

    public function __construct($department, $shifts)
    {
        $this->department = $department;
        $this->shifts = $shifts;
        $this->ssheat = $this->createSpreadSheet();
    }

    protected function isVolunteerAdmin()
    {
        return true;
    }

    protected function getSimpleHour($hour)
    {
        if($hour < 12)
        {
            if($hour === 0)
            {
                return '12a';
            }
            return $hour.'a';
        }
        if($hour === 12)
        {
            return $hour.'p';
        }
        return ($hour - 12).'p';
    }

    protected function grayOutUnused($hourCount, $rowCount, $sheat)
    {
        for($i = 0; $i < $hourCount; $i++)
        {
            for($j = 0; $j < $rowCount; $j++)
            {
                $cell = $sheat->getCellByColumnAndRow($i + 2, $j + 4);
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
    }

    protected function setShiftNameInCell($sheat, $col, $row, $shift)
    {
        if(isset($shift['participant']))
        {
            $sheat->setCellValueByColumnAndRow($col, $row, $this->getParticipantDiplayName($shift['participant']));
        }
    }

    protected function getHoursArrays($hour, $hourCount)
    {
        $simpleHours = array();
        $militaryHours = array();
        for($i = 0; $i < $hourCount; $i++)
        {
            array_push($simpleHours, $this->getSimpleHour($hour));
            array_push($militaryHours, $hour.':00');
            $hour++;
            if($hour === 24)
            {
                $hour = 0;
            }
        }
        return array($simpleHours, $militaryHours);
    }

    protected function createShiftCell($sheat, $col, $row, $shift)
    {
        $sheat->mergeCellsByColumnAndRow($col, $row, $col + $shift['length'] - 1, $row);
        $this->setShiftNameInCell($sheat, $col, $row, $shift);
    }

    protected function getRowForShift($roleID, $rows, $col, $sheat)
    {
        $i = 1;
        $firstRow = array_search($roleID, $rows);
        $cell = $sheat->getCellByColumnAndRow($col, $firstRow + 4);
        if($cell->isInMergeRange())
        {
            while($rows[$firstRow+$i] === $roleID)
            {
                $cell = $sheat->getCellByColumnAndRow($col, $firstRow + 4 + $i);
                if(!$cell->isInMergeRange())
                {
                    break;
                }
                $i++;
            }
            return $firstRow + 4 + $i;
        }
        return $firstRow + 4;
    }

    protected function createSpreadSheet()
    {
        $shifts = $this->shifts;
        $dept = $this->department;
        $ssheat = new Spreadsheet();
        $sheat = $ssheat->getActiveSheet();
        $sheat->setCellValue('A1', $dept['departmentName']);
        $count = count($shifts);
        $days = array();
        $roles = array();
        $roles2 = array();
        for($i = 0; $i < $count; $i++)
        {
            $start = new \DateTime($shifts[$i]['startTime']);
            $end = new \DateTime($shifts[$i]['endTime']);
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
        $lastShift = $shifts[$count - 1];
        $interval = $lastShift['endTime']->diff($shifts[0]['startTime']);
        $hourCount = ($interval->d*24) + $interval->h;
        $tmp = $this->getHoursArrays($start['hour'], $hourCount);
        $simpleHours = $tmp[0];
        $militaryHours = $tmp[1];
        $sheat->fromArray($simpleHours, null, 'B2');
        $sheat->fromArray($militaryHours, null, 'B3');
        $mergeCount = 24 - $start['hour'];
        if($mergeCount > $hourCount)
        {
            $mergeCount = $hourCount;
        }
        $days = array_keys($days);
        $cellIndex = 2;
        while($mergeCount)
        {
            $sheat->mergeCellsByColumnAndRow($cellIndex, 1, $cellIndex + $mergeCount - 1, 1);
            $sheat->setCellValueByColumnAndRow($cellIndex, 1, array_shift($days));
            $cell = $sheat->getCellByColumnAndRow($cellIndex, 1);
            $cell->getStyle()->getAlignment()->setHorizontal('center');
            $cellIndex += $mergeCount;
            $hourCount -= $mergeCount;
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
            $sheat->setCellValueByColumnAndRow(1, 4 + $i, $this->getRoleNameFromID($role));
            array_push($rows, $role);
            $overlaps = array();
            for($j = 0; $j < count($roles2[$role]) - 1; $j++)
            {
                $currRole = $roles2[$role][$j];
                $nextRole = $roles2[$role][$j + 1];
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
                for($j = 0; $j < $overlapCount + 1; $j++)
                {
                    $i++;
                    $sheat->setCellValueByColumnAndRow(1, 4 + $i, $this->getRoleNameFromID($role));
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
            $timeDiff = $originalStartTime->diff($shift['startTime']);
            $hoursFromStart = ($timeDiff->d*24)+$timeDiff->h;
            $rowForShift = $this->getRowForShift($shift['roleID'], $rows, $hoursFromStart+2, $sheat);
            $this->createShiftCell($sheat, $hoursFromStart+2, $rowForShift, $shift);
            $shift = array_shift($shifts);
        }
        $rowCount = count($rows);
        $style = $sheat->getStyleByColumnAndRow(2, 4, 1+count($simpleHours), 3 + $rowCount);
        $style->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
        $hourCount = count($simpleHours);
        $this->grayOutUnused($hourCount, $rowCount, $sheat);
        $sheat->getColumnDimension('A')->setAutoSize(true);
        return $ssheat;
    }

    public function getBuffer($type)
    {
        if($type === 'XLSX')
        {
            $writer = new Xlsx($this->ssheat);
            $content = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            $extension = '.xlsx';
        }
        else if($type === 'PDF')
        {
            $this->ssheat->getActiveSheet()->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);
            $writer = new mpdf($this->ssheat);
            $writer->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);
            $content = 'application/pdf';
            $extension = '.pdf';
        }
        else
        {
            return array('error'=> true, 'msg'=>'Unknown type specified: '.$type);
        }
        ob_start();
        $writer->save('php://output');
        $str = ob_get_clean();
        return array('content-type'=>$content, 'extension'=>$extension, 'buffer'=>$str); 
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
        else if($interval->invert === 1 && ($interval->h || $interval->days))
        {
            return 1;
        }
        print_r($interval);
        die();
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
