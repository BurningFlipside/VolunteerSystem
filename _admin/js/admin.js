/* exported addOptiontoSelect, getNameForUser, searchUsers, isGoogleConnected */
/* global $ */
function addOptiontoSelect(select, value, text, selected) {
  var opt = document.createElement('option');
  opt.value = value;
  if(selected === true) {
    opt.selected = true;
  }
  opt.text = text;
  select.add(opt);
}

function getNameForUser(user) {
  if(user.burnerName.trim().length === 0 || user.firstName === user.burnerName) {
    return user.firstName+' '+user.lastName;
  }
  return user.firstName+' "'+user.burnerName+'" '+user.lastName;
}


function showPossibles(jqXHR) {
  if(jqXHR.status === 200) {
    let data = jqXHR.responseJSON;
    let div = $('#showPossibles');
    if(div.length === 0) {
      div = $('<div>', {id: 'showPossibles', style: 'position: absolute; border: 1px solid #d4d4d4; border-bottom: none; border-top: none; z-index: 99; top: 100%; left: 0; right: 0;'});
      this.parentNode.appendChild(div[0]);
    }
    div.empty();
    console.log(data);
    let count = Math.min(data.length, 10);
    for(let i = 0; i < count; i++) {
      let child = $('<div>', {style: 'padding: 10px; cursor: pointer; background-color: #fff; border-bottom: 1px solid #d4d4d4;'});
      child[0].innerHTML += '<strong>uid:</strong> '+data[i].uid+' <strong>email:</strong> '+data[i].email+' <strong>name:</strong> '+getNameForUser(data[i]);
      child[0].innerHTML += '<input type="hidden" value="'+data[i].email+'">';
      child.click((e) => {
        this.value = e.currentTarget.getElementsByTagName('input')[0].value;
        div.empty();
      });
      div.append(child);
    }
  }
}

let lastRequest = null;

function searchUsers(e) {
  let value = e.currentTarget.value;
  if(value.includes(' ')) {
    //Only uid or name are valid searches...
  } else {
    if(lastRequest !== null) {
      lastRequest.abort();
    }
    lastRequest = $.ajax({
      url: '../api/v1/participants?$filter=substringof(uid,\''+value+'\') or substringof(email,\''+value+'\') or substringof(firstName,\''+value+'\') or substringof(lastName,\''+value+'\') or substringof(burnerName,\''+value+'\')',
      context: e.currentTarget,
      complete: showPossibles
    });
  }
}

function isGoogleConnected(callback) {
  fetch('../api/v1/google/loginStatus')
    .then((response) => {
      if(response.status === 200) {
        return response.json();
      }
      return false;
    })
    .then((data) => {
      if(data.loggedIn) {
        callback();
      }
    });
}