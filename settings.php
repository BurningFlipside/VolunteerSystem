<?php
require_once('class.VolunteerPage.php');
$page = new VolunteerPage('Burning Flipside - Flipside Volunteer System');
$page->addJS('js/settings.js');

$page->body .= '
<div class="row border rounded">
  <legend>User Info</legend>
  <label for="firstName" class="col-sm-2 col-form-label">First Name:</label>
  <div class="col-sm-10">
    <input class="form-control" type="text" name="firstName" id="firstName"/>
  </div>
  <div class="w-100"></div>
  <label for="lastName" class="col-sm-2 col-form-label">Last Name:</label>
  <div class="col-sm-10">
    <input class="form-control" type="text" name="lastName" id="lastName"/>
  </div>
  <div class="w-100"></div>
  <label for="burnerName" class="col-sm-2 col-form-label">Burner Name:</label>
  <div class="col-sm-10">
    <input class="form-control" type="text" name="burnerName" id="burnerName"/>
  </div>
  <div class="w-100"></div>
  <label for="myCampName" class="col-sm-2 col-form-label">Camp Name:</label>
  <div class="col-sm-10">
    <input class="form-control" type="text" name="myCampName" id="myCampName"/>
  </div>
  <div class="w-100"></div>
  <label for="myWebName" class="col-sm-2 col-form-label">Web Display Name:</label>
  <div class="col-sm-5">
    <select class="form-control" name="myWebName" id="myWebName" onChange="webNameChange();">
      <option value="anonymous">Anonymous</option>
      <option value="full">Full Name</option>
      <option value="burnerLast">Burner Name + Last Name</option>
      <option value="firstBurner">First Name + Burner Name</option>
      <option value="burner">Burner Name</option>
    </select>
  </div>
  <div class="col-sm-5" id="webDisplay">
  </div>
  <div class="w-100"></div>
  <label for="myPaperName" class="col-sm-2 col-form-label">Paper Display Name:</label>
  <div class="col-sm-5">
    <select class="form-control" name="myPaperName" id="myPaperName" onChange="paperNameChange();">
      <option value="full">Full Name</option>
      <option value="burnerLast">Burner Name + Last Name</option>
      <option value="firstBurner">First Name + Burner Name</option>
      <option value="burner">Burner Name</option>
    </select>
  </div>
  <div class="col-sm-5" id="paperDisplay">
  </div>
  <div class="w-100"></div>
  <label for="myPaperName" class="col-sm-2 col-form-label">T-Shirt Size:</label>
  <div class="col-sm-10">
    <select class="form-control" name="myShirtSize" id="myShirtSize">
      <option value="WS">Women\'s Small</option>
      <option value="WM">Women\'s Medium</option>
      <option value="MS">Men\'s Small</option>
      <option value="WL">Women\'s Large</option>
      <option value="MM">Men\'s Medium</option>
      <option value="WXL">Women\'s Extra Large</option>
      <option value="WXXL">Women\'s Extra Extra Large</option>
      <option value="ML">Men\'s Large</option>
      <option value="WXXXL">Women\'s Extra Extra Extra Large</option>
      <option value="MXL">Men\'s Extra Large</option>
      <option value="MXXL">Men\'s Extra Extra Large</option>
      <option value="MXXXL">Men\'s Extra Extra Extra Large</option>
    </select>
  </div>
  <div class="col-sm-12">
    <button type="button" class="btn btn-primary float-right" onClick="return saveData();">Save</button>
  </div>
</div>
<div class="row border rounded">
  <legend>User Certifications</legend>
  <div class="alert alert-primary" role="alert">
    Some roles require various certifications. This lets you view which certifications you have on file and file new ones.
  </div>
  <div id="certs" class="col-sm-12">
  </div>
</div>
';

$page->printPage();
