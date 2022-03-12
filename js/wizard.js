/* global $ */
/* exported nextWizardStep, prevWizardStep, saveWizardStep*/
function validateFields(content) {
  var res = true;
  var elements = content.find('input');
  for(let element of elements) {
    if(element.hasAttribute('required') && element.classList.contains('flatpickr-input')) {
      //Work around for Firefox and Safari
      if(element.value == '') {
        res = false;
        $(element).popover({
          content: 'Please enter a valid date!',
          title: 'Required field',
          trigger: 'click'
        }).popover('show');
        continue;
      }
    }
    if(element.reportValidity() !== true) {
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
  var shown = next.data('onshow');
  if(shown !== undefined) {
    // We are actually desiring the "bad" behavior right here...
    var fn = window[shown]; // eslint-disable-line security/detect-object-injection
    fn(next);
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
  var shown = prev.data('onshow');
  if(shown !== undefined) {
    // We are actually desiring the "bad" behavior right here...
    var fn = window[shown]; // eslint-disable-line security/detect-object-injection
    fn(prev);
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
    obj[`${id}`] = value;
  }
  return obj;
}

function saveWizardStep(target) {
  var dialog = $(target).parents('.modal');
  var complete = dialog.data('complete');
  // We are actually desiring the "bad" behavior right here...
  var fn = window[complete]; // eslint-disable-line security/detect-object-injection
  var inputs = dialog.find('input');
  var obj = {};
  for(let input of inputs) {
    if(input.id === '') {
      continue;
    }
    if(input.type === 'checkbox') {
      obj = addToObj(obj, input.id, input.checked);
    } else {
      obj = addToObj(obj, input.id, input.value);
    }
  }
  inputs = dialog.find('textarea');
  for(let input of inputs) {
    obj = addToObj(obj, input.id, $(input).val());
  }
  inputs = dialog.find('select');
  for(let input of inputs) {
    obj = addToObj(obj, input.id, $(input).val());
  }
  fn(obj);
}
