<?php
if(file_exists(__DIR__ . '/vendor/autoload.php'))
{
    require(__DIR__ . '/vendor/autoload.php');
}
else if(file_exists(__DIR__ . '/../../../common/Autoload.php'))
{
    require(__DIR__ . '/../../../common/Autoload.php');
}

function VolunteerAutoload($classname)
{
    $classname = str_replace('/', '\\', $classname);
    $classname = ltrim($classname, '\\');
    $filename  = '';
    $namespace = '';
    if($lastNsPos = strrpos($classname, '\\'))
    {
        $namespace = substr($classname, 0, $lastNsPos);
        $classname = substr($classname, $lastNsPos + 1);
        $filename  = str_replace('\\', DIRECTORY_SEPARATOR, $namespace).DIRECTORY_SEPARATOR;
    }
    $filename = __DIR__.DIRECTORY_SEPARATOR.$filename.'class.'.$classname.'.php';
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
