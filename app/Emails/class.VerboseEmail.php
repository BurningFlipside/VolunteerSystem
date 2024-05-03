<?php
namespace Volunteer\Emails;

use \Exception as Exception;

use \Flipside\Data\Filter as DataFilter;

use Volunteer\VolunteerDepartment;

class VerboseEmail extends VolunteerEmail
{
    private $dept;
    private $args;

    public function __construct($dept, $initiator, $emailTypeSource, array $otherArgs = [])
    {
        parent::__construct(null);
        $this->dept = $dept;
        $this->args = $otherArgs;
        $this->args['{$initiator}'] = $initiator;
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'longText');
        $entries = $dataTable->read(new DataFilter("id eq $emailTypeSource"));
        if(empty($entries))
        {
            throw new Exception("Could not locate email with source type $emailTypeSource");
        }
        if(isset($entries['value']))
        {
            $this->text = $entries['value'];
        }
        else if(isset($entries[0]['value']))
        {
            $this->text = $entries[0]['value'];
        }
        $this->addToAddress($dept->verboseDataEmail);
    }

    public function getSubject()
    {
        return 'Flipside Volunteer System Notification';
    }

    protected function getBody($html = true)
    {
        $vars = $this->args;
        if($html === true)
        {
            $text = strtr($this->text, $vars);
            return $text;
        }
        $rawText = $this->text;
        $index = strpos($rawText, "<script");
        if($index !== false)
        {
            $end = strpos($rawText, "</script>");
            if($index === 0)
            {
                $rawText = substr($rawText, $end + 9);
            }
        }
        return strtr(strip_tags($rawText), $vars);
    }

    public function getHTMLBody()
    {
        $body = $this->getBody();
        return $body;
    }

    public function getTextBody()
    {
        $body = $this->getBody(false);
        return $body;
    }
}