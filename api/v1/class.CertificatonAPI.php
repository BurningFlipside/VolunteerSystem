<?php
class CertificatonAPI extends VolunteerAPI
{
    public function __construct()
    {
        parent::__construct('certifications', 'certID');
    }

    protected function canUpdate($request, $entity)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        return false;
    }

    protected function canDelete($request, $entity)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        return false;
    } 
}
