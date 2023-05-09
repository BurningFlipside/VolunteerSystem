<?php
namespace Volunteer\Schedules;

class SimplePDF extends \Flipside\PDF\PDF
{
    use ShiftSchedule;

    protected $department;
    protected $deptName;
    protected $shifts;

    public function __construct($department, $shifts)
    {
        parent::__construct();
		$this->deptName = $department;
        $this->department = false;
        if(!is_string($department))
        {
            $this->department = $department;
            $this->deptName = $this->department['departmentName'];
        }
        $this->shifts = $shifts;
        $this->createPDFBody();
    }

    protected function createPDFBody()
    {
	    $html = '<body>';
	    $html .= '<style type="text/css">table {border-collapse: collapse;} table, th, td {border: 1px solid black;}</style>';
	    $html .= '<h1 style="text-align: center;">'.$this->deptName.' Shift Schedule</h1>';
	    //Group shifts by day...
	    $days = array();
	    $shifts = $this->shifts;
	    $count = count($shifts);
	    for($i = 0; $i < $count; $i++)
	    {
		    $start = new \DateTime($shifts[$i]['startTime']);
		    $end = new \DateTime($shifts[$i]['endTime']);
		    $shifts[$i]['startTime'] = $start;
		    $shifts[$i]['endTime'] = $end;
		    $dateStr = $start->format('l (n/j/Y)');
		    $timeStr = $start->format('g:i A').' till '.$end->format('g:i A');
		    if(strlen($shifts[$i]['name']) > 0)
		    {
			    $timeStr .= ' - <i>'.$shifts[$i]['name'].'</i>';
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
	    uksort($days, array($this, 'daySort'));
	    foreach($days as $dateStr=>$day)
	    {
		    $html .= '<h2>'.$dateStr.'</h2>';
		    uksort($day, array($this, 'groupSort'));
		    foreach($day as $shiftStr=>$shifts)
		    {
			    usort($shifts, array($this, 'shiftSort'));
			    $html .= '<h3>'.$shiftStr.'</h3>';
			    $html .= '<table width="100%"><tr><th style="width: 20%">Role</th><th>Volunteer Name</th><th>Volunteer Camp</th></tr>';
			    foreach($shifts as $shift)
			    {
				    $shift = new \Volunteer\VolunteerShift(false, $shift);
					try
					{
				    	$participant = $shift->participantObj;
						if($participant !== false)
						{ 
							$html .= '<tr><td>'.$this->getRoleNameFromID($shift->roleID).'</td><td>'.$participant->getDisplayName('paperName').'</td><td>'.$participant->campName.'</td></tr>';
						}
						else if($shift->participant)
						{
							$html .= '<tr><td>'.$this->getRoleNameFromID($shift->roleID).'</td><td>'.$shift->participant.'</td><td><i>Unknown</i></td></tr>';
						}
						else
						{
							$html .= '<tr><td>'.$this->getRoleNameFromID($shift->roleID).'</td><td></td><td></td></tr>';
						}
					}
					catch(\Exception $e)
					{
						$html .= '<tr><td>'.$this->getRoleNameFromID($shift->roleID).'</td><td>'.$shift->participant.'</td><td><i>Unknown</i></td></tr>';
					}
			    }
			    $html .= '</table>';
		    }
	    }
	    $html .= '</body>';
	    $this->setPDFFromHTML($html);
    }
} 
