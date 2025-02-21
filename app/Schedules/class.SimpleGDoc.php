<?php
namespace Volunteer\Schedules;

class SimpleGDoc
{
    use ShiftSchedule;

    protected $department;
    protected $deptName;
    protected $shifts;
	protected $googleClient;
	public $docID;

    public function __construct($department, $shifts, $googleClient)
    {
		$this->deptName = $department;
        $this->department = false;
		$this->googleClient = $googleClient;
        if(!is_string($department))
        {
            $this->department = $department;
            $this->deptName = $this->department->departmentName;
        }
        $this->shifts = $shifts;
        $this->createGoogleDoc();
    }

    protected function createGoogleDoc()
    {
		$service = new \Google_Service_Docs($this->googleClient);

		$title = $this->deptName.' Shift Schedule '.date('Y-m-d H:i:s');
		$document = new \Google_Service_Docs_Document(array(
    		'title' => $title
		));

		$document = $service->documents->create($document);
		$this->docID = $document->documentId;
		$requests = array();
		$titleText = $this->deptName." Shift Schedule\n";
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
			    $timeStr .= ' - '.$shifts[$i]['name'];
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
		$requests[] = new \Google_Service_Docs_Request(array(
			'insertText' => array(
				'endOfSegmentLocation'=> array(),
				'text' => $titleText,
			)
		));
		$index = strlen($titleText)+1;
		$requests[] = new \Google_Service_Docs_Request(array(
			'updateParagraphStyle' => array(
				'range' => array(
					'startIndex' => 1,
					'endIndex' => $index,
				),
				'paragraphStyle' => array(
					'alignment' => 'CENTER',
					'namedStyleType' => 'TITLE',
				),
				'fields' => 'alignment,namedStyleType',
			),
		));
		foreach($days as $dateStr=>$day)
	    {
			$requests[] = new \Google_Service_Docs_Request(array(
				'insertText' => array(
					'endOfSegmentLocation'=> array(),
					'text' => $dateStr."\n",
				)
			));
			$endIndex = $index + strlen($dateStr)+1;
			$requests[] = new \Google_Service_Docs_Request(array(
				'updateParagraphStyle' => array(
					'range' => array(
						'startIndex' => $index,
						'endIndex' => $endIndex-1,
					),
					'paragraphStyle' => array(
						'namedStyleType' => 'HEADING_1',
					),
					'fields' => 'namedStyleType',
				),
			));
			$index = $endIndex;
			foreach($day as $shiftStr=>$shifts)
		    {
				$endIndex += strlen($shiftStr);
				$requests[] = new \Google_Service_Docs_Request(array(
					'insertText' => array(
						'endOfSegmentLocation'=> array(),
						'text' => $shiftStr,
					)
				));
				$requests[] = new \Google_Service_Docs_Request(array(
					'updateParagraphStyle' => array(
						'range' => array(
							'startIndex' => $index,
							'endIndex' => $endIndex-1,
						),
						'paragraphStyle' => array(
							'namedStyleType' => 'HEADING_2',
						),
						'fields' => 'namedStyleType',
					),
				));
				$index = $endIndex;
				// Add the rows
				$requests[] = new \Google_Service_Docs_Request(array(
					'insertTable' => array(
						'rows' => count($shifts)+1,
						'columns' => 3,
						'endOfSegmentLocation' => array(),
					)
				));
				// Add size of the table to start
				$index += 4;
				$requests[] = new \Google_Service_Docs_Request(array(
					'insertText' => array(
						'location' => array('index' => $index),
						'text' => 'Role',
					)
				));
				$requests[] = new \Google_Service_Docs_Request(array(
					'updateTextStyle' => array(
						'range' => array(
							'startIndex' => $index,
							'endIndex' => $index+4,
						),
						'textStyle' => array(
							'bold' => true,
						),
						'fields' => 'bold',
					),
				));
				$index += 6;
				$requests[] = new \Google_Service_Docs_Request(array(
					'insertText' => array(
						'location' => array('index' => $index),
						'text' => 'Volunteer Name',
					)
				));
				$requests[] = new \Google_Service_Docs_Request(array(
					'updateTextStyle' => array(
						'range' => array(
							'startIndex' => $index,
							'endIndex' => $index+14,
						),
						'textStyle' => array(
							'bold' => true,
						),
						'fields' => 'bold',
					),
				));
				$index += 16;
				$requests[] = new \Google_Service_Docs_Request(array(
					'insertText' => array(
						'location' => array('index' => $index),
						'text' => 'Volunteer Camp',
					)
				));
				$requests[] = new \Google_Service_Docs_Request(array(
					'updateTextStyle' => array(
						'range' => array(
							'startIndex' => $index,
							'endIndex' => $index+14,
						),
						'textStyle' => array(
							'bold' => true,
						),
						'fields' => 'bold',
					),
				));
				$requests[] = new \Google_Service_Docs_Request(array(
					'updateTableRowStyle' => array(
						'tableStartLocation' => array('index' => $index-25),
						'rowIndices' => [1],
						'tableRowStyle' => array(
							'minRowHeight'=> array(
								'magnitude'=> 12,
								'unit'=> 'PT'
							),
							'tableHeader' => true,
						),
						'fields'=> '*'
					),
				));
				$index += 14;
				foreach($shifts as $shift)
			    {
					$shift = new \Volunteer\VolunteerShift(false, $shift);
					$roleName = $this->getRoleNameFromID($shift->roleID);
					$index += 3;
					$endIndex = $index + strlen($roleName);
					$requests[] = new \Google_Service_Docs_Request(array(
						'insertText' => array(
							'location' => array('index' => $index),
							'text' => $roleName,
						)
					));
					$index += strlen($roleName);
					$participantName = '';
					$campName = '';
					try
					{
						$participant = $shift->participantObj;
						if($participant !== false)
						{ 
							$participantName = $participant->getDisplayName('paperName');
							$campName = $participant->campName;
						}
						else if($shift->participant)
						{
							$participantName = $shift->participant;
						}
					}
					catch(\Exception $e)
					{
						$participantName = $shift->participant;
					}
					$index += 2;
					if(strlen($participantName) > 0)
					{
						$requests[] = new \Google_Service_Docs_Request(array(
							'insertText' => array(
								'location' => array('index' => $index),
								'text' => $participantName,
							)
						));
					}
					$index += strlen($participantName)+2;
					if(strlen($campName) > 0)
					{
						$requests[] = new \Google_Service_Docs_Request(array(
							'insertText' => array(
								'location' => array('index' => $index),
								'text' => $campName,
							)
						));
					}
					$index += strlen($campName);
					$endIndex = $index;
				}
				$index = $endIndex = $index + 2;
			}
		}
		$batchUpdateRequest = new \Google_Service_Docs_BatchUpdateDocumentRequest(array(
			'requests' => $requests
		));
		$response = $service->documents->batchUpdate($document->documentId, $batchUpdateRequest);
		return $document->documentId;
    }
} 
