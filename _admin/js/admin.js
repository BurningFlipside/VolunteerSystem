function addOptiontoSelect(select, value, text, selected) {
  var opt = document.createElement("option");
  opt.value = value;
  if(selected === true) {
    opt.selected = true;
  }
  opt.text = text;
  select.add(opt);
}
