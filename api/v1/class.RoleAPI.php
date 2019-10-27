<?php
class RoleAPI extends VolunteerAPI
{
    use Processor;

    public function __construct()
    {
        parent::__construct('roles', 'short_name');
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
}
