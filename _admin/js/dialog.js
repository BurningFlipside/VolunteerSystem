window.flipDialog = {};
window.flipDialog.dialog = function(options) {
  var dialog = $('<div class="modal fade show" aria-modal="true"><div class="modal-dialog modal-lg"><div class="modal-content"></div></div></div>');
  dialog.find('.modal-content').append('<div class="modal-header"><h4 class="modal-title">'+options.title+'</h4><button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button></div>');
  dialog.find('.modal-content').append('<div class="modal-body"><div class-"containter-fluid"><div class="row"></div></div></div>');
  var body = dialog.find('.modal-content .row');
  for(var i = 0; i < options.inputs.length; i++) {
    var input = options.inputs[i];
    var div = body;
    if(input.label !== undefined) {
      var label = $('<label for="'+input.id+'" class="col-sm-2 col-form-label">'+input.label+':</label>');
      body.append(label);
      div = $('<div class="col-sm-10"/>');
      delete input.label;
    }
    var inputEnt = $('<input>');
    if(input.type === 'select') {
      inputEnt = $('<select>');
      if(input.options !== undefined) {
        for(var j = 0; j < input.options.length; j++) {
          var option = $('<option value="'+input.options[j].value+'">'+input.options[j].text+'</option>');
          if(input.options[j].selected) {
            option.attr('selected', true);
          }
          inputEnt.append(option);
        }
        delete input.options;
      }
    }
    else {
      inputEnt.attr('type', input.type);
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
      inputEnt.attr(attr, input[attr]);
    }
    div.append(inputEnt);
    if(div !== body) {
      body.append(div);
    }
    body.append('<div class="w-100"></div>');
  }
  var buttons = '<button type="button" class="btn btn-secondary col-sm-2" data-dismiss="modal">Close</button>';
  if(options.buttons === undefined) {
    options.buttons = [];
  }
  for(var i = 0; i < options.buttons.length; i++) {
    var button = options.buttons[i];
    if(button.input !== undefined) {
      var input = '<input type="'+button.input.type+'" id="'+button.input.id+'" class="form-control" placeholder="'+button.input.text+'" aria-label="'+button.input.text+'">'; 
      buttons+= '<div class="input-group">'+input+'<div class="input-group-append"><button class="btn btn-outline-secondary" type="button" id="modalButton'+i+'">'+button.text+'</button></div></div>';
    }
    else {
      buttons+= '<button type="button" class="btn btn-primary col-sm-2" id="modalButton'+i+'">'+button.text+'</button>';
    }
  }
  dialog.find('.modal-content').append('<div class="modal-footer">'+buttons+'</div>');
  dialog.one('hidden.bs.modal', function(e){
    dialog.remove();
  });
  $('body').append(dialog);
  for(var i = 0; i < options.buttons.length; i++) {
    var clickContext = {
      data: options.data,
      callback: options.buttons[i].callback,
      close: options.buttons[i].close,
      dialog: dialog
    };
    var bound = dialogButtonClick.bind(clickContext);
    $('#modalButton'+i).click(bound);
  }
  finishDialog(dialog, options);
};

function dialogButtonClick(e) {
  e.data = this.data;
  if(e.data === undefined) {
    e.data = {};
  }
  var group = $(e.target).parents('.input-group');
  if(group.length > 0) {
    var inputs = group.find('input');
    var name = inputs[0].id;
    e.data[name] = inputs[0].value;
  }
  //Update data with the latest
  var inputs = this.dialog.find('.modal-body input');
  for(var i = 0; i < inputs.length; i++) {
    if(inputs[i].reportValidity() === false) {
      return;
    }
    var name = inputs[i].name;
    if(inputs[i].type === 'checkbox') {
      e.data[name] = inputs[i].checked;
    }
    else {
      e.data[name] = inputs[i].value;
    }
  }
  this.callback(e);
  if(this.close !== false) {
    this.dialog.modal('hide');
  }
}

function finishDialog(dialog, options) {
  if(options.data !== undefined) {
    for(var key in options.data) {
      var input = dialog.find('[name="'+key+'"]');
      if(input.length > 0 && input[0].type === 'checkbox') {
        input[0].checked = options.data[key];
      }
      input.val(options.data[key]);
    }
  }
  dialog.modal('show');
}
