<?php
namespace Volunteer\Emails;

use \Exception as Exception;

use \Flipside\Data\Filter as DataFilter;

use \Volunteer\VolunteerEvent as Event;
use \Volunteer\VolunteerRole as Role;

class RoleEmail extends \Flipside\Email\Email
{
    protected Role $role;
    protected Event $event;
    protected $text;

    public function __construct($role, $eventId, $emailTypeSource, $sender)
    {
        parent::__construct();
        $this->event = new Event($eventId);
        $this->role = new Role(false, $role);
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
        $this->addToAddress($sender->mail);
    }

    public function getFromAddress() : string
    {
        return 'Burning Flipside Volunteer System <volunteerinfo@burningflipside.com>';
    }

    private function getRoleViewLink()
    {
        $settings = \Flipside\Settings::getInstance();
        $secureUrl = $settings->getGlobalSetting('secure_url', 'https://secure.burningflipside.com');
        return $secureUrl.'/fvs/index.php?event='.$this->event->getId().'&role='.$this->role->getId();
    }

    /**
     * @SuppressWarnings(PHPMD.BooleanArgumentFlag)
     */
    protected function getBody($html = true)
    {
        $role = $this->role->display_name;
        $event = $this->event->name;
        $link = $this->getRoleViewLink();
        $vars = array(
                '{$role}' => $role,
                '{$event}' => $event,
                '{$link}' => $link
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