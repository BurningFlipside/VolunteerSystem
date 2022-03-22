/* global $, browser_supports_input_type */
window.flipDialog = {};
window.flipDialog.dialog = function(options) {
  var dialog = $('<div class="modal fade show" aria-modal="true"><div class="modal-dialog modal-lg"><div class="modal-content"></div></div></div>');
  dialog.find('.modal-content').append('<div class="modal-header"><h4 class="modal-title">'+options.title+'</h4><button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button></div>');
  dialog.find('.modal-content').append('<div class="modal-body"><div class-"containter-fluid"><div class="row"></div></div></div>');
  var body = dialog.find('.modal-content .row');
  if(options.alerts !== undefined) {
    for(let alert of options.alerts) {
      body.append('<div class="col-sm-12 alert alert-'+alert.type+'" role="alert">'+alert.text+'</div>');
    }
  }
  for(let input of options.inputs) {
    var div = body;
    if(input.label !== undefined) {
      var label = $('<label for="'+input.id+'" class="col-sm-2 col-form-label">'+input.label+':</label>');
      body.append(label);
      div = $('<div class="col-sm-10"/>');
      delete input.label;
    }
    if(input.type === 'html') {
      div.append(input.text);
      if(div !== body) {
        body.append(div);
      }
      continue;
    }
    var inputEnt = $('<input>');
    if(input.type === 'select') {
      inputEnt = $('<select>');
      if(input.options !== undefined) {
        for(let inOption of input.options) {
          let option = $('<option value="'+inOption.value+'">'+inOption.text+'</option>');
          if(inOption.selected) {
            option.attr('selected', true);
          }
          inputEnt.append(option);
        }
        delete input.options;
      }
    } else {
      inputEnt.attr('type', input.type);
    }
    if(input.type === 'datetime-local') {
      if(!browser_supports_input_type('datetime-local')) {
        var myOptions = {enableTime: true};
        if(input.min !== undefined) {
          myOptions.minDate = new Date(input.min);
        }
        if(input.max !== undefined) {
          myOptions.maxDate = new Date(input.max);
        }
        inputEnt.flatpickr(myOptions);
      } else if(input.value) {
        let datetime = new Date(input.value);
        inputEnt.val(dateTimeToString(datetime));
      }
    }
    delete input.type;
    inputEnt.attr('name', input.id);
    inputEnt.attr('id', input.id);
    delete input.id;
    if(input.onChange !== undefined && typeof input.onChange !== 'string') {
      inputEnt.change(input.onChange);
      delete input.onChange;
    }
    inputEnt.attr('class', 'form-control');
    for(var attr in input) {
      inputEnt.attr(attr, input[`${attr}`]);
    }
    div.append(inputEnt);
    if(div !== body) {
      body.append(div);
    }
    body.append('<div class="w-100"></div>');
  }
  var footer = $('<div class="modal-footer">');
  footer.append('<button type="button" class="btn btn-secondary col-sm-2" data-dismiss="modal">Close</button>');
  if(options.buttons === undefined) {
    options.buttons = [];
  }
  let btnId = 0;
  for(let button of options.buttons) {
    var clickContext = {
      data: options.data,
      callback: button.callback,
      close: button.close,
      dialog: dialog
    };
    var bound = dialogButtonClick.bind(clickContext);
    if(button.input !== undefined) {
      var inputElem = $('<input type="'+button.input.type+'" id="'+button.input.id+'" class="form-control" placeholder="'+button.input.text+'" aria-label="'+button.input.text+'">');
      var inputGroup = $('<div class="input-group">');
      inputGroup.append(inputElem);
      var appendElem = $('<div class="input-group-append">');
      inputGroup.append(appendElem);
      let buttonElem = $('<button class="btn btn-outline-secondary" type="button" id="modalButton'+btnId+'">'+button.text+'</button>');
      btnId++;
      buttonElem.click(bound);
      appendElem.append(buttonElem);
      footer.append(inputGroup);
    } else {
      var disabled = '';
      if(button.disabled === true) {
        disabled = 'disabled="true"';
      }
      let buttonElem = $('<button type="button" class="btn btn-primary col-sm-2" '+disabled+'>'+button.text+'</button>');
      buttonElem.click(bound);
      footer.append(buttonElem);
    }
  }
  dialog.find('.modal-content').append(footer);
  dialog.one('hidden.bs.modal', function(){
    dialog.remove();
  });
  $('body').append(dialog);
  finishDialog(dialog, options);
};

function dialogButtonClick(e) {
  e.preventDefault();
  e.data = this.data;
  if(e.data === undefined || e.data === false) {
    e.data = {};
  }
  if(e.data === true) {
    e.data = {'originalData': true};
  }
  var group = $(e.target).parents('.input-group');
  if(group.length > 0) {
    let inputs = group.find('input');
    let name = inputs[0].id;
    e.data[`${name}`] = inputs[0].value;
  }
  //Update data with the latest
  let inputs = this.dialog.find('.modal-body input');
  for(let input of inputs) {
    if(input.reportValidity() === false) {
      return;
    }
    let name = input.name;
    if(input.type === 'radio') {
      if(input.checked) {
        e.data[`${name}`] = input.value;
      }
    } else if(input.type === 'checkbox') {
      e.data[`${name}`] = input.checked;
    } else {
      e.data[`${name}`] = input.value;
    }
  }
  inputs = this.dialog.find('.modal-body select');
  for(let input of inputs) {
    let name = input.name;
    e.data[`${name}`] = input.value;
  }
  this.callback(e);
  if(this.close !== false) {
    this.dialog.modal('hide');
  }
}

function dateTimeToString(dt) {
  let ten = function(i) {
    return (i < 10 ? '0':'')+i;
  };
  let year = dt.getFullYear();
  let month = ten(dt.getMonth()+1);
  let day = ten(dt.getDate());
  let time = dt.toTimeString().slice(0,5);
  return year+'-'+month+'-'+day+'T'+time;
}

function finishDialog(dialog, options) {
  if(options.data !== undefined) {
    for(var key in options.data) {
      try {
        var input = dialog.find('[name="'+key+'"]');
      } catch(err) {
        console.log(err);
        continue;
      }
      if(input.length > 0 && input[0].type === 'checkbox') {
        input[0].checked = options.data[`${key}`];
      }
      if(input[0] !== undefined && input[0].type === 'datetime-local') {
        let datetime = new Date(options.data[`${key}`]);
        input.val(dateTimeToString(datetime));
      } else {
        input.val(options.data[`${key}`]);
      }
    }
  }
  dialog.modal('show');
}
