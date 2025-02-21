/*global $*/
function getParticipantLink(cell) {
  return 'vol.php?id='+encodeURIComponent(cell.getValue());
}

function addTableData(table, shifts) {
  table.clearData();
  let participants = {};
  for(let shift of shifts) {
    if(shift.participant !== undefined && shift.participant !== '') {
      if(participants[shift.participant] === undefined) {
        participants[shift.participant] = 1;
      } else {
        participants[shift.participant]++;
      }
    }
  }
  let min = document.getElementById('minShifts').value*1;
  let max = document.getElementById('maxShifts').value*1;
  if(max === 0) {
    max = Number.MAX_SAFE_INTEGER;
  }
  let data = [];
  for(let uid in participants) {
    if(participants[`${uid}`] >= min && participants[`${uid}`] <= max) {
      data.push({uid: uid, shifts: participants[`${uid}`]});
    }
  }
  table.setData(data);
}

function getShifts() {
  let filter = [];
  let departmentSelect = document.getElementById('department');
  if(departmentSelect.value !== '') {
    filter.push('departmentID eq \''+departmentSelect.value+'\'');
  }
  let roleSelect = document.getElementById('roles');
  let selectedRoles = Array.from(roleSelect.options).filter((option) => {
    return option.selected;
  });
  if(selectedRoles.length > 0) {
    let roleStr = '(';
    for(let role of selectedRoles) {
      roleStr+='roleID eq '+role.value;
      roleStr+=' or ';
    }
    //Remove last or...
    roleStr = roleStr.slice(0, -4);
    roleStr += ')';
    filter.push(roleStr);
  }
  if(filter.length > 0) {
    filter = filter.join(' and ');
    filter = '?$filter='+filter;
  }
  fetch('../api/v1/events/'+document.getElementById('event').value+'/shifts'+filter).then((response) => {
    response.json().then((data) => {
      let tables = Tabulator.findTable('#shiftTable');
      if(tables === false || tables.length === 0) {
        let table = new Tabulator('#shiftTable', {
          columns: [
            {title:'Username', field: 'uid', formatter: 'link', formatterParams:{url: getParticipantLink},},
            {title:'Number of Shifts', field: 'shifts', sorter:'number'}
          ],
          initialSort: [
            {column: 'shifts', dir: 'desc'}
          ]
        });
        table.on('tableBuilt', () => {
          addTableData(table, data);
        });
        return;
      }
      addTableData(tables[0], data);
    });
  });
}

function minShiftsChanged() {
  getShifts();
}

function maxShiftsChanged() {
  getShifts();
}

function rolesChanged() {
  getShifts();
}

function departmentSelected(e) {
  let departmentID = e.target.value;
  fetch('../api/v1/departments/'+departmentID+'/roles').then((response) => {
    response.json().then((data) => {
      let rolesSelect = document.getElementById('roles');
      rolesSelect.options.length = 0;
      rolesSelect.add(new Option(''));
      for(let role of data) {
        let option = new Option(role.display_name, role.short_name);
        rolesSelect.add(option);
      }
      getShifts();
    });
  });
}

function eventSelected() {
  getShifts();
}

function initPage() {
  if(NiceSelect === undefined) {
    window.setTimeout(initPage, 100);
    return;
  }
  fetch('../api/v1/events').then((response) => {
    if(response.httpStatusCode === 401) {
      return;
    }
    response.json().then((data) => {
      let eventSelect = document.getElementById('event');
      data.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      for(let event of data) {
        let option = new Option(event.name, event['_id']['$oid'], eventSelect.options.length === 0);
        eventSelect.add(option);
      }
      let options = {searchable: true};
      NiceSelect.bind(eventSelect, options);
      eventSelect.addEventListener('change', eventSelected);
    })
  });
  fetch('../api/v1/departments').then((response) => {
    if(response.httpStatusCode === 401) {
      return;
    }
    response.json().then((data) => {
      let deptSelect = document.getElementById('department');
      data.sort((a, b) => {
        return a.departmentName.localeCompare(b.departmentName);
      });
      deptSelect.add(new Option(''));
      for(let dept of data) {
        if(!dept.isAdmin) {
          continue;
        }
        let option = new Option(dept.departmentName, dept.departmentID, deptSelect.options.length === 0);
        deptSelect.add(option);
      }
      let options = {searchable: true};
      NiceSelect.bind(deptSelect, options);
      deptSelect.addEventListener('change', departmentSelected);
    })
  });
  document.getElementById('roles').addEventListener('change', rolesChanged);
  document.getElementById('minShifts').addEventListener('change', minShiftsChanged);
  document.getElementById('maxShifts').addEventListener('change', maxShiftsChanged);
}

window.onload = initPage;
