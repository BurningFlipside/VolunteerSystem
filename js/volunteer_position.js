/*global reload, imageNotFound*/
// Container for a volunteer position
function VolunteerPosition(nam, desc, image, email, longDescription){
  this.name = nam;
  this.description = desc;
  this.imageURL = image;
  this.email = email;
  this.longDescription = longDescription;
}

VolunteerPosition.prototype.createNode = function(){
  var div = document.createElement('div');
  div.id = 'result';
  div.class = 'volunteer_position_div';
  var name = document.createElement('h2');
  name.innerHTML = 'You are' + getAOrAn(this.name) + this.name + ' volunteer!';
  var description = document.createElement('h4');
  description.innerHTML = 'You would be great for this position because ' + this.description;
  div.appendChild(name);
  if(this.imageURL){
    let image = document.createElement('img');
    image.id = 'volunteer_image';
    image.className = 'img-responsive';
    image.src = this.imageURL;
    image.onerror = imageNotFound;
    div.appendChild(image);
  } else {
    let image = document.createElement('img');
    image.src = 'images/lostimage.png';
    image.id = 'volunteer_image';
    image.className = 'img-responsive';
    image.style.width = '470px';
    div.appendChild(image);
  }
  div.appendChild(description);
  var mainDiv = document.getElementById('main_div');
  window.mainTable = mainDiv.removeChild(document.getElementById('main_table'));
  mainDiv.appendChild(div);
  var emailDiv = document.createElement('div');
  emailDiv.id = 'div_email_addr';
  var paragraph = document.createElement('p');
  paragraph.innerHTML = 'Please email your future lead at ';
  var link = document.createElement('a');
  link.href = 'mailto:' +this.email;
  link.innerHTML = this.email;
  paragraph.appendChild(link);
  emailDiv.appendChild(paragraph);
  mainDiv.appendChild(emailDiv);
  var descriptionDiv = document.createElement('div');
  descriptionDiv.id = 'position_description';
  descriptionDiv.innerHTML = this.longDescription;
  mainDiv.appendChild(descriptionDiv);
  var resetDiv = document.createElement('div');
  resetDiv.id = 'reset_page_div';
  var submitBtn = document.createElement('button');
  submitBtn.innerHTML = 'Find a new volunteer adventure!';
  submitBtn.onclick=reload;
  resetDiv.appendChild(submitBtn);
  mainDiv.appendChild(resetDiv);
};

function getAOrAn(name){
  var charName = name.charAt(0).toLowerCase();
  var vowels = ['a', 'e', 'i', 'o', 'u'];
  for(let vowel of vowels) {
    if(charName === vowel) {
      return ' an ';
    }
  }
  return ' a ';
}
