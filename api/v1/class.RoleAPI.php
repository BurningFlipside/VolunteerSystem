<?php
class RoleAPI extends Http\Rest\DataTableAPI
{
    use Processor;

    public function __construct()
    {
        parent::__construct('fvs', 'roles', 'short_name');
    }

    public function setup($app)
    {
        parent::setup($app);
    }

    protected function isVolunteerAdmin($request)
    {
        $this->validateLoggedIn($request);
        return $this->user->isInGroupNamed('VolunteerAdmins');
    }

    protected function canCreate($request)
    {
        return $this->isVolunteerAdmin($request);
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
        return $this->canEditDept($request, false);;
    }

    protected function canDelete($request, $entity)
    {
        return $this->canUpdate($request, $entity);
    }
}
