<?php
class CertificatonAPI extends VolunteerAPI
{
    public function __construct()
    {
        parent::__construct('certifications', 'certID');
    }

    /**
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    protected function canUpdate($request, $entity)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        return false;
    }

    /**
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    protected function canDelete($request, $entity)
    {
        if($this->isVolunteerAdmin($request))
        {
            return true;
        }
        return false;
    } 
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
