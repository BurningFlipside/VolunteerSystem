<?php
namespace Volunteer\Schedules;

class ActualSchedule
{
    use ShiftSchedule;

    protected $department;
    protected $deptName;
    protected $shifts;
	protected $word;

    public function __construct($department, $shifts)
    {
		$this->deptName = $department;
        $this->department = false;
        if(!is_string($department))
        {
            $this->department = $department;
            $this->deptName = $this->department['departmentName'];
        }
        $this->shifts = $shifts;
        $this->createWordDoc();
    }

    protected function createWordDoc()
    {
        $shifts = $this->shifts;
	    $count = count($shifts);
        for($i = 0; $i < $count; $i++)
	    {
            if($shifts[$i]['roleID'] !== 'Actual' && $shifts[$i]['roleID'] !== 'Backup')
            {
                $shifts[$i] = false;
                continue;
            }
            if(!isset($shifts[$i]['participant']) || $shifts[$i]['participant'] === '')
            {
                $shifts[$i] = false;
                continue;
            }
	    }
        $shifts = array_values(array_filter($shifts));
        $count = count($shifts);
        if($count === 0)
        {
            return;
        }
        usort($shifts, array($this, 'shiftTimeSort'));
        for($i = 0; $i < $count; $i++)
	    {
            $shifts[$i] = new \Volunteer\VolunteerShift(false, $shifts[$i]);
	    }

        $phpWord = new \PhpOffice\PhpWord\PhpWord();
        $section = $phpWord->addSection();
        $header = ['size' => 16, 'bold' => true];
        $section->addText($this->deptName.' Shift Schedule', $header);
        $tableStyle = array(
            'borderSize'  => 6,
            'cellMargin'  => 50
        );
        $phpWord->addTableStyle('myTable', $tableStyle);
        $table = $section->addTable('myTable');
        $table->addRow(200, array('exactHeight' => true)); // This should actually be 140, but this doesn't seem to work
        $actualStyle = array('size' => 8);
        $paragraphStyle = array('spaceAfter' => 0);
        $backupStyle = array('size' => 8, 'italic' => true);
        $table->addCell(2000)->addText('Tue', $actualStyle, $paragraphStyle);
        $table->addCell(2000)->addText('Wed', $actualStyle, $paragraphStyle);
        $table->addCell(2000)->addText('Thu', $actualStyle, $paragraphStyle);
        $table->addCell(2000)->addText('Fri', $actualStyle, $paragraphStyle);
        $table->addCell(2000)->addText('Sat', $actualStyle, $paragraphStyle);
        $table->addCell(2000)->addText('Sun', $actualStyle, $paragraphStyle);
        $table->addCell(2000)->addText('Mon', $actualStyle, $paragraphStyle);
        $table->addCell(2000)->addText('Tue', $actualStyle, $paragraphStyle);
        $first = $table->addRow();
        $second = $table->addRow();
        $third = $table->addRow();
        $cell = $first->addCell(2000);
        $cell->addText('7AM<w:br/>'.$shifts[0]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index = 1;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $cell = $second->addCell(2000);
        $cell->addText('7PM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $third->addCell(2000); // Empty cell
        $cell = $first->addCell(2000);
        $cell->addText('7AM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $cell = $second->addCell(2000);
        $cell->addText('7PM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $third->addCell(2000);
        $cell = $first->addCell(2000);
        $cell->addText('7AM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $cell = $second->addCell(2000);
        $cell->addText('7PM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $third->addCell(2000);
        $cell = $first->addCell(2000);
        $cell->addText('7AM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $cell = $second->addCell(2000);
        $cell->addText('7PM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $third->addCell(2000);
        $cell = $first->addCell(2000);
        $cell->addText('7AM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $cell = $second->addCell(2000);
        $cell->addText('7PM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $third->addCell(2000);
        $cell = $first->addCell(2000);
        $cell->addText('7AM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $cell = $second->addCell(2000);
        $cell->addText('1PM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $third->addCell(2000)->addText('7PM<w:br/>All Hands', $actualStyle, $paragraphStyle);
        for($i = $index; $i < $count; $i++)
        {
            if($shifts[$i]->startTime->format('l') === 'Sunday')
            {
                $index++;
            }
        }
        $cell = $first->addCell(2000);
        $cell->addText('2AM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $cell = $second->addCell(2000);
        $cell->addText('7AM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $cell = $third->addCell(2000);
        $cell->addText('7PM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $cell = $first->addCell(2000);
        $cell->addText('7AM<w:br/>'.$shifts[$index]->participantObj->burnerName, $actualStyle, $paragraphStyle);
        $index++;
        if($shifts[$index]->roleID === 'Backup')
        {
            $cell->addText($shifts[$index]->participantObj->burnerName, $backupStyle, $paragraphStyle);
            $index++;
        }
        $second->addCell(2000);
        $third->addCell(2000);
        $this->word = $phpWord;
    }

    public function getBuffer()
    {
        $writer = \PhpOffice\PhpWord\IOFactory::createWriter($this->word, 'Word2007');
        ob_start();
        $writer->save('php://output');
        $str = ob_get_clean();
        return array('buffer'=>$str);
    }
}

