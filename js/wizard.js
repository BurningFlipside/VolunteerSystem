function validateFields(content) {
  var res = true;
  var elements = content.find('input');
  for(var i = 0; i < elements.length; i++) {
    if(elements[i].reportValidity() !== true) {
      res = false;
    }
  }
  return res;
}

function nextWizardStep(target) {
  var dialog = $(target).parents('.modal');
  var activeDiv = dialog.find('.visible');
  var valid = validateFields(activeDiv);
  if(valid === false) {
    return;
  }
  var activeNav = dialog.find('.list-group-item.active');
  activeNav.removeClass('active');
  activeNav.next().addClass('active');
  activeDiv.removeClass('visible').addClass('invisible');
  var next = activeDiv.next().addClass('visible').removeClass('invisible');
  $('#prevStep').removeAttr('disabled');
  if(next.next().length === 0) {
    $('#nextStep').html('Complete').attr('onClick', 'saveWizardStep(this);');
  }
}

function prevWizardStep(target) {
  var dialog = $(target).parents('.modal');
  var activeDiv = dialog.find('.visible');
  var activeNav = dialog.find('.list-group-item.active');
  activeNav.removeClass('active');
  activeNav.prev().addClass('active');
  activeDiv.removeClass('visible').addClass('invisible');
  var prev = activeDiv.prev().addClass('visible').removeClass('invisible');
  $('#nextStep').html('Next').attr('onClick', 'nextWizardStep(this);');
  if(prev.prev().length === 0) {
    $('#prevStep').attr('disabled', true);
  }
}

function saveWizardStep(target) {
  var dialog = $(target).parents('.modal');
  var complete = dialog.data('complete');
  var fn = window[complete];
  var inputs = dialog.find('input');
  var obj = {};
  for(var i = 0; i < inputs.length; i++) {
    obj[inputs[i].id] = inputs[i].value;
  }
  console.log(obj);
  fn(obj);
}
