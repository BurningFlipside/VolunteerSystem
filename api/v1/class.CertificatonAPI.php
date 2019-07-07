<?php
class CertificatonAPI extends VolunteerAPI
{
    public function __construct()
    {
        parent::__construct('certifications', 'certID');
    }
}
