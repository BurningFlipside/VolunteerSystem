window.flipDialog = {};
window.flipDialog.dialog = function(options) {
  var dialog = $('<div class="modal fade show" aria-modal="true"><div class="modal-dialog modal-lg"><div class="modal-content"></div></div></div>');
  dialog.find('.modal-content').append('<div class="modal-header"><h4 class="modal-title">'+options.title+'</h4><button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button></div>');
  var body = '';
  for(var i = 0; i < options.inputs.length; i++) {
    var input = options.inputs[i];
    if(input.type === 'hidden') {
      body+='<input type="hidden" id="'+input.id+'" name="'+input.id+'"';
      if(input.value !== undefined) {
        body+=' value="'+input.value+'"/>';
      }
      else {
        body+='/>';
      }
    }
    else if(input.type === 'select') {
      var inputText = '<select class="form-control" name="'+input.id+'" id="'+input.id+'">';
      if(input.options !== undefined) {
        for(var j = 0; j < input.options.length; j++) {
          if(input.options[j].selected) {
            inputText+= '<option value="'+input.options[j].value+'" selected>'+input.options[j].text+'</option>';
          }
          else {
            inputText+= '<option value="'+input.options[j].value+'">'+input.options[j].text+'</option>';
          }
        }
      }
      inputText+='</select>';
      body+= '<label for="'+input.id+'" class="col-sm-2 col-form-label">'+input.label+':</label><div class="col-sm-10">'+inputText+'</div>';
    }
    else {
      var inputText = '<input class="form-control" type="'+input.type+'" name="'+input.id+'" id="'+input.id+'"';
      if(input.readonly) {
        inputText+= ' readonly';
      }
      if(input.value !== undefined) {
        inputText+=' value="'+input.value+'"';
      }
      if(input.min !== undefined) {
        inputText+=' min="'+input.min+'"';
      }
      if(input.max !== undefined) {
        inputText+=' max="'+input.max+'"';
      }
      inputText+= '/>';
      body+= '<label for="'+input.id+'" class="col-sm-2 col-form-label">'+input.label+':</label><div class="col-sm-10">'+inputText+'</div>';
    }
    body+='<div class="w-100"></div>';
  }
  dialog.find('.modal-content').append('<div class="modal-body"><div class-"containter-fluid"><div class="row">'+body+'</div></div></div>');
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
