<?php

class VolunteerAPI extends Http\Rest\DataTableAPI
{
    protected $isAdmin = null;
    protected $isLead = null;

    public function __construct($dataTableName, $idField = '_id')
    {
        parent::__construct('fvs', $dataTableName, $idField);
    }

    protected function isVolunteerAdmin($request)
    {
        $this->validateLoggedIn($request);
        if($this->isAdmin === null)
        {
            $this->isAdmin = $this->user->isInGroupNamed('VolunteerAdmins');
        }
        return $this->isAdmin;
    }

    protected function canCreate($request)
    {
        return $this->isVolunteerAdmin($request);
    }

    protected function addRequiredFilter($key, $id, $odata)
    {
        $filter = new \Data\Filter("$key eq '$id'");
        if($odata->filter !== false)
        {
            $clause = $odata->filter->getClause($key);
            if($clause !== null)
            {
                return false;
            }
            else
            {
                $filter->appendChild('and');
                $filter->appendChild($odata->filter);
            }
        }
        return $filter;
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
