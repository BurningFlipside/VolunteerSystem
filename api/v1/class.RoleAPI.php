<?php
require_once('../../app/Emails/class.RoleEmail.php');

use \Exception as Exception;

use \Volunteer\Emails\RoleEmail;

class RoleAPI extends VolunteerAPI
{
    use Processor;

    public function __construct()
    {
        parent::__construct('roles', 'short_name');
    }

    public function setup($app)
    {
        parent::setup($app);
        $app->post('/Actions/SendRoleEmail', array($this, 'sendRoleEmail'));
    }

    protected function canEditDept($request, $deptId)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        return $this->isUserDepartmentLead($deptId, $this->user);
    }

    protected function canUpdate($request, $entity)
    {
        return $this->canEditDept($request, $entity['departmentID']);
    }

    protected function canDelete($request, $entity)
    {
        return $this->canUpdate($request, $entity);
    }

    protected function processEntry($entry, $request)
    {
        return $this->processRole($entry, $request);
    }

    private function doSend($emailProvider, $type, $role, $obj, $emails)
    {
        $email = new RoleEmail($role, $obj['eventId'], $type, $this->user);
        $count = count($emails);
        for($i = 0; $i < $count; $i++)
        {
            $email->addBCCAddress($emails[$i]);
        }
        if($emailProvider->sendEmail($email) === false)
        {
            throw new Exception("Unable to send role $type email!");
        }
    }

    function sendRoleEmail($request, $response)
    {
        $this->validateLoggedIn($request);
        $obj = $this->getParsedBody($request);
        if(!isset($obj['roleId']) || !isset($obj['eventId']))
        {
            return $response->withStatus(400);
        }
        $dataTable = $this->getDataTable();
        $filter = $this->getFilterForPrimaryKey($obj['roleId']);
        $roles = $dataTable->read($filter);
        if(empty($roles))
        {
            return $response->withStatus(404);
        }
        $role = $roles[0];
        if($this->canUpdate($request, $role) === false)
        {
            return $response->withStatus(401);
        }
        $emailProvider = \Flipside\EmailProvider::getInstance();
        if(isset($obj['signupLink']))
        {
            $this->doSend($emailProvider, 'roleSingUpLink', $role, $obj, $obj['signupLink']);
        }
        if(isset($obj['systemLink']))
        {
            $this->doSend($emailProvider, 'roleSystemLink', $role, $obj, $obj['systemLink']);
        }
        if(isset($obj['sendSignupLink2']))
        {
            $this->doSend($emailProvider, 'roleSingUpLink2', $role, $obj, $obj['sendSignupLink2']);
        }
        return $response->withJson(true);
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
