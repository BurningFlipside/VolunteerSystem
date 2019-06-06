<?php
class ShiftAPI extends Http\Rest\DataTableAPI
{
    public function __construct()
    {
        parent::__construct('fvs', 'shifts', '_id');
    }

    protected function isVolunteerAdmin($request)
    {
        $this->validateLoggedIn($request);
        return $this->user->isInGroupNamed('VolunteerAdmins');
    }

    protected function canCreate($request)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        //TODO give access to department lead
        return false;
    }

    protected function canUpdate($request, $entity)
    {
 	if($this->isVolunteerAdmin($request))
        {
            return true;
        }       
        //TODO give access to department lead
        return false;
    }

    protected function canDelete($request, $entity)
    {
        return $this->canUpdate($request, $entity);
    }
}
