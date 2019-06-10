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
  var activeDiv = dialog.find('.d-block');
  var valid = validateFields(activeDiv);
  if(valid === false) {
    return;
  }
  var activeNav = dialog.find('.list-group-item.active');
  activeNav.removeClass('active');
  activeNav.next().addClass('active');
  activeDiv.removeClass('d-block').addClass('d-none');
  var next = activeDiv.next().addClass('d-block').removeClass('d-none');
  $('#prevStep').removeAttr('disabled');
  if(next.next().length === 0) {
    $('#nextStep').html('Complete').attr('onClick', 'saveWizardStep(this);');
  }
}

function prevWizardStep(target) {
  var dialog = $(target).parents('.modal');
  var activeDiv = dialog.find('.d-block');
  var activeNav = dialog.find('.list-group-item.active');
  activeNav.removeClass('active');
  activeNav.prev().addClass('active');
  activeDiv.removeClass('d-block').addClass('d-none');
  var prev = activeDiv.prev().addClass('d-block').removeClass('d-none');
  $('#nextStep').html('Next').attr('onClick', 'nextWizardStep(this);');
  if(prev.prev().length === 0) {
    $('#prevStep').attr('disabled', true);
  }
}

function addToObj(obj, id, value) {
  var split = id.split('.');
  if(split.length > 1) {
    if(obj[split[0]] === undefined) {
      obj[split[0]] = {};
    }
    obj[split[0]][split[1]] = value;
  }
  else {
    obj[id] = value;
  }
  return obj;
}

function saveWizardStep(target) {
  var dialog = $(target).parents('.modal');
  var complete = dialog.data('complete');
  var fn = window[complete];
  var inputs = dialog.find('input');
  var obj = {};
  for(var i = 0; i < inputs.length; i++) {
    if(inputs[i].id === '') {
      continue;
    }
    if(inputs[i].type === 'checkbox') {
      obj = addToObj(obj, inputs[i].id, inputs[i].checked);
    }
    else {
      obj = addToObj(obj, inputs[i].id, inputs[i].value);
    }
  }
  inputs = dialog.find('textarea');
  for(var i = 0; i < inputs.length; i++) {
    obj = addToObj(obj, inputs[i].id, inputs[i].value);
  }
  inputs = dialog.find('select');
  for(var i = 0; i < inputs.length; i++) {
    obj = addToObj(obj, inputs[i].id, $(inputs[i]).val());
  }
  console.log(obj);
  fn(obj);
}
