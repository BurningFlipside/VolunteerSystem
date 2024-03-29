<?php
namespace Volunteer\Emails;

use \Exception as Exception;

use \Flipside\Data\Filter as DataFilter;

class CertificationEmail extends VolunteerEmail
{
    protected $text;
    protected $additionalProps;

    public function __construct($profile, $emailTypeSource, $certType, $other = array())
    {
        parent::__construct($profile);
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
        $this->addToAddress($this->profile->email);
        $this->additionalProps = $other;
        $dataTable = \Flipside\DataSetFactory::getDataTableByNames('fvs', 'certifications');
        $entries = $dataTable->read(new DataFilter("certID eq $certType"));
        if(empty($entries))
        {
            throw new Exception("Could not locate certification with type $certType");
        }
        $this->additionalProps['certType'] = $entries[0]['name'];
    }

    public function getSubject()
    {
        return 'Certification Notification - Burning Flipside Volunteer System';
    }

    /**
     * @SuppressWarnings(PHPMD.BooleanArgumentFlag)
     */
    protected function getBody($html = true)
    {
        $firstName = $this->profile->firstName;
        $lastName = $this->profile->lastName;
        $paperName = $this->profile->getDisplayName('paperName');
        $webName = $this->profile->getDisplayName('webName');
        $certType = $this->additionalProps['certType'];
        $rejectReason = $this->additionalProps['reason'];
        $vars = array(
                '{$firstName}' => $firstName,
                '{$lastName}' => $lastName,
                '{$paperName}' => $paperName,
                '{$webName}' => $webName,
                '{$certType}' => $certType,
                '{$rejectReason}' => $rejectReason
                );
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
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
