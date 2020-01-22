<?php
class TextAPI extends VolunteerAPI
{
    public function __construct()
    {
        parent::__construct('longText', 'id');
    }

    protected function canRead($request)
    {
        return $this->isVolunteerAdmin($request);
    }

    protected function canCreate($request)
    {
        return $this->isVolunteerAdmin($request);
    }

    protected function canUpdate($request, $entity)
    {
        return $this->isVolunteerAdmin($request);
    }

    protected function canDelete($request, $entity)
    {
        return $this->canUpdate($request, $entity);
    }

    protected function processEntry($obj, $request)
    {
        $args = $request->getAttribute('route')->getArguments();
        if(empty($args))
        {
            return $obj;
        }
        return $obj['value'];
    }

    public function updateEntry($request, $response, $args)
    {
        if($this->canRead($request) === false)
        {
            return $response->withStatus(401);
        }
        $filter = $this->getFilterForPrimaryKey($args['name']);
        $dataTable = $this->getDataTable();
        $entry = $dataTable->read($filter);
        if(empty($entry))
        {
            return $response->withStatus(404);
        }
        if($this->canUpdate($request, $entry) === false)
        {
            return $response->withStatus(401);
        }
        $obj = $request->getParsedBody();
        if($obj === null)
        {
            $body = $request->getBody();
            $body->rewind();
            $obj = array('value'=>$body->getContents());
        }
        if($this->validateUpdate($obj, $request, $entry) === false)
        {
            return $response->withStatus(400);
        }
        $ret = $dataTable->update($filter, $obj);
        return $response->withJson($ret);
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
