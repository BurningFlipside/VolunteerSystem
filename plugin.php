<?php
if(is_readable(__DIR__.'/../SecurePlugin.php'))
{
    require_once(__DIR__.'/../SecurePlugin.php');
}
class FVSPlugin extends \Flipside\Secure\SecurePlugin
{
    function get_secure_menu_entries($page, $user)
    {
        $ret = array(
            'Volunteer' => $page->secure_root.'fvs/index.php',
            'Volunteer - Guided Signup' =>  $page->secure_root.'fvs/guidedEvent.php',
                );
        if($user !== null && $user->isInGroupNamed('VolunteerAdmins'))
        {
            $ret['Volunteer System Admin'] = $page->secure_root.'fvs/_admin/index.php';
        }
        return $ret;
    }

    function get_plugin_entry_point()
    {
        return array(
                'name'=>'Volunteer',
                'link' => 'fvs/index.php'
                );
    }
}
/* vim: set tabstop=4 shiftwidth=4 expandtab: */
