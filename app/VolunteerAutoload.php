<?php
if(file_exists(__DIR__ . '/vendor/autoload.php'))
{
    require(__DIR__ . '/vendor/autoload.php');
}
else if(file_exists(__DIR__ . '/../../../common/Autoload.php'))
{
    require(__DIR__ . '/../../../common/Autoload.php');
}

function VolunteerAutoload($className)
{
    $className = str_replace('/', '\\', $className);
    $className = ltrim($className, '\\');
    $filename  = '';
    $namespace = '';
    $lastNsPos = strrpos($className, '\\');
    if($lastNsPos)
    {
        $namespace = substr($className, 0, $lastNsPos);
        $className = substr($className, $lastNsPos + 1);
        $filename  = str_replace('\\', DIRECTORY_SEPARATOR, $namespace).DIRECTORY_SEPARATOR;
    }
    $namespaces = explode('/', $filename);
    if($namespaces[0] === 'Volunteer')
    {
        $filename = '';
    }
    $filename = __DIR__.DIRECTORY_SEPARATOR.$filename.'class.'.$className.'.php';
    if(is_readable($filename))
    {
        require $filename;
    }
}

if(version_compare(PHP_VERSION, '5.3.0', '>='))
{
    spl_autoload_register('VolunteerAutoload', true, true);
}
else
{
    spl_autoload_register('VolunteerAutoload');
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
