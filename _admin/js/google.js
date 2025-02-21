/* global bootbox */
function writePageForLoggedInUser(data) {
  let googleLink = document.getElementById('googleLink');
  googleLink.innerHTML = 'You are logged into Google on the Volunteer System.';
  googleLink.innerHTML += '<br/><img src="'+data.user.picture+'" style="border-radius: 50%;"/>'+data.user.name+' ('+data.user.email+')';
  let exportShiftsButton = document.getElementById('exportShifts');
  exportShiftsButton.onclick = () => {
    startShiftExport();
  };
  let importShiftsButton = document.getElementById('importShifts');
  importShiftsButton.onclick = () => {
    startShiftImport();
  };
  document.getElementById('actions').style.visibility = 'visible';
}

function startShiftExport() {
  fetch('/fvs/api/v1/events').then((response) => {
    response.json().then((data) => {
      let inputOptions = [];
      for(let event of data) {
        inputOptions.push({text: event.name, value: event['_id']['$oid']});
      }
      bootbox.prompt({
        title: 'Which event would you like to export shifts for?',
        inputType: 'select',
        inputOptions: inputOptions,
        callback: (result) => {
          if(result === null) {
            return;
          }
          exportFromEvent(result);
        }
      });
    });
  });
}

function exportFromEvent(eventID) {
  fetch('/fvs/api/v1/events/'+eventID+'/shifts?$select=department,departmentID').then((response) => {
    response.json().then((data) => {
      let departmentMap = {};
      for(let shift of data) {
        if (shift.department === undefined && departmentMap[shift.departmentID] !== undefined) {
          continue;
        }
        departmentMap[shift.departmentID] = shift.department;
      }
      let inputOptions = [];
      let promises = [];
      for(let departmentID in departmentMap) {
        inputOptions.push({text: departmentMap[departmentID], value: departmentID});
        if(departmentMap[departmentID] === undefined) {
          // Wait for department IDs before showing dialog
          promises.push(fetch('/fvs/api/v1/departments/'+departmentID).then((departmentResponse) => {
            return departmentResponse.json().then((departmentData) => {
              departmentMap[departmentID] = departmentData.departmentName;
            });
          }));
        }
      }
      if(promises.length > 0) {
        Promise.all(promises).then(() => {
          inputOptions = [];
          for(let departmentID in departmentMap) {
            inputOptions.push({text: departmentMap[departmentID], value: departmentID});
          }
          exportFromDepartmentDiaglog(eventID, inputOptions);
        });
        return;
      }
      exportFromDepartmentDiaglog(eventID, inputOptions);
    });
  });
}

function exportFromDepartmentDiaglog(eventID, inputOptions) {
  console.log(inputOptions);
  bootbox.prompt({
    title: 'Which department would you like to export shifts for?',
    inputType: 'select',
    inputOptions: inputOptions,
    callback: (result) => {
      if(result === null) {
        return;
      }
      exportFromDepartment(eventID, result);
    }
  });
}

function exportFromDepartment(eventID, departmentID) {
  fetch('/fvs/api/v1/google/Actions/ExportShifts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({event: eventID, department: departmentID})
  }).then((response) => {
    if(response.status !== 200) {
      bootbox.alert('Shift export failed.');
      return;
    }
    response.json().then((data) => {
      let ssLink = 'https://docs.google.com/spreadsheets/d/'+data.id+'/edit#gid=0';
      bootbox.alert('Shifts exported successfully. You can get it <a href="'+ssLink+'" target="_blank">here</a>.');
    });
  });
}

function startShiftImport() {
  fetch('/fvs/api/v1/google/spreadsheets').then((response) => {
    response.json().then((data) => {
      let inputOptions = [];
      for(let sheet of data) {
        inputOptions.push({text: sheet.name, value: sheet.id});
      }
      bootbox.prompt({
        title: 'Which sheet would you like to import shifts from?',
        inputType: 'select',
        inputOptions: inputOptions,
        callback: (result) => {
          if(result === null) {
            return;
          }
          importFromSheet(result);
        }
      });
    });
  });
}

function importFromSheet(sheetID) {
  fetch('/fvs/api/v1/google/spreadsheets/'+sheetID).then((response) => {
    response.json().then((data) => {
      let inputOptions = [];
      for(let sheet of data.sheets) {
        inputOptions.push({text: sheet.properties.title, value: sheet.properties.title});
      }
      if(inputOptions.length === 1) {
        importFromSheetAndTab(sheetID, inputOptions[0].value);
        return;
      }
      bootbox.prompt({
        title: 'Which sheet would you like to import shifts from?',
        inputType: 'select',
        inputOptions: inputOptions,
        callback: (result) => {
          if(result === null) {
            return;
          }
          importFromSheetAndTab(sheetID, result);
        }
      });
    });
  });
}

function importFromSheetAndTab(sheetID, tabName) {
  // Peek at the sheet to make sure it is in the correct format
  fetch('/fvs/api/v1/google/spreadsheets/'+sheetID+'/'+tabName+'/1').then((response) => {
    response.json().then((data) => {
      if(data === undefined || data.length < 1) {
        bootbox.alert('Sheet is empty.');
        return;
      }
      let headers = data[0];
      let departmentIndex = headers.indexOf('DepartmentID');
      if(departmentIndex === -1) {
        bootbox.alert('Sheet is not in the correct format. Missing DepartmentID column.');
        return;
      }
      let index = headers.indexOf('StartDay');
      if(index === -1) {
        bootbox.alert('Sheet is not in the correct format. Missing StartDay column.');
        return;
      }
      index = headers.indexOf('StartTime');
      if(index === -1) {
        bootbox.alert('Sheet is not in the correct format. Missing StartTime column.');
        return;
      }
      index = headers.indexOf('EndDay');
      if(index === -1) {
        bootbox.alert('Sheet is not in the correct format. Missing EndDay column.');
        return;
      }
      index = headers.indexOf('EndTime');
      if(index === -1) {
        bootbox.alert('Sheet is not in the correct format. Missing EndTime column.');
        return;
      }
      index = headers.indexOf('Name');
      if(index === -1) {
        bootbox.alert('Sheet is not in the correct format. Missing Name column.');
        return;
      }
      index = headers.indexOf('RoleID');
      if(index === -1) {
        bootbox.alert('Sheet is not in the correct format. Missing RoleID column.');
        return;
      }
      index = headers.indexOf('Group?');
      if(index === -1) {
        bootbox.alert('Sheet is not in the correct format. Missing Group? column.');
        return;
      }
      index = headers.indexOf('Early Entry Window');
      if(index === -1) {
        bootbox.alert('Sheet is not in the correct format. Missing Early Entry Window column.');
        return;
      }
      index = headers.indexOf('Needs Approval?');
      if(index === -1) {
        bootbox.alert('Sheet is not in the correct format. Missing Needs Approval? column.');
        return;
      }
      let participantEmailIndex = headers.indexOf('Participant Email');
      if(participantEmailIndex !== -1) {
        const ACharCode = 65;
        let columnName = String.fromCharCode(ACharCode + participantEmailIndex);
        // Check to see if there are any values in the column
        fetch('/fvs/api/v1/google/spreadsheets/'+sheetID+'/'+tabName+'/*/'+columnName).then((emailResponse) => {
          emailResponse.json().then((emailData) => {
            emailData.shift(); // Remove the header
            for(let email of emailData) {
              email = email[0];
              if(email !== undefined && email.length > 0) {
                bootbox.prompt({
                  title: 'Participant email found. Do you want to import participants as well?',
                  inputType: 'checkbox',
                  inputOptions: [{text: 'Yes', value: 'yes'}],
                  callback: (result) => {
                    if(result === null) {
                      return;
                    }
                    importFromSheetAndTabConfirmed(sheetID, tabName, result[0] === 'yes', departmentIndex);
                  }
                });
                return;
              }
            }
          });
        });
        return;
      }
      importFromSheetAndTabConfirmed(sheetID, tabName, false, departmentIndex);
    });
  });
}

function importFromSheetAndTabConfirmed(sheetID, tabName, importParticipants, departmentIndex) {
  // Check that all the departments are the same...
  const ACharCode = 65;
  let columnName = String.fromCharCode(ACharCode + departmentIndex);
  fetch('/fvs/api/v1/google/spreadsheets/'+sheetID+'/'+tabName+'/*/'+columnName).then((response) => {
    response.json().then((data) => {
      let department = data[1][0];
      for(let i = 2; i < data.length; i++) {
        if(data[i][0] !== department) {
          bootbox.alert('All departments must be the same.');
          return;
        }
      }
      importFromSheetAndTabConfirmed2(sheetID, tabName, importParticipants, department);
    });
  });
}

function importFromSheetAndTabConfirmed2(sheetID, tabName, importParticipants, departmentID) {
  // We need to find an event that has no shifts for this department
  fetch('../api/v1/shifts?$filter=departmentID eq '+departmentID).then((response) => {
    response.json().then((data) => {
      let eventIDs = new Set();
      for(let shift of data) {
        eventIDs.add(shift.eventID);
      }
      fetch('../api/v1/events?$select=_id,name,endTime').then((eventResponse) => {
        eventResponse.json().then((eventData) => {
          let emptyEventIDs = [];
          let now = new Date();
          for(let event of eventData) {
            if(!eventIDs.has(event['_id']['$oid'])) {
              let endTime = new Date(event.endTime);
              if(endTime < now) {
                continue;
              }
              emptyEventIDs.push({id: event['_id']['$oid'], name: event.name});
            }
          }
          if(emptyEventIDs.length === 0) {
            bootbox.alert('No event found without shifts for this department.');
            return;
          }
          bootbox.prompt({
            title: 'Which event would you like to import shifts into?',
            inputType: 'select',
            inputOptions: emptyEventIDs.map((event) => {
              return {text: event.name, value: event.id};
            }),
            callback: (result) => {
              if(result === null) {
                return;
              }
              importFromSheetAndTabConfirmed3(sheetID, tabName, importParticipants, departmentID, result);
            }
          });
        });
      });
    });
  });
}

function importFromSheetAndTabConfirmed3(sheetID, tabName, importParticipants, departmentID, eventID, beforeStart) {
  let body = {sheet: sheetID, tab: tabName, importParticipants: importParticipants, department: departmentID, event: eventID};
  if(beforeStart !== undefined) {
    body.forceStart = beforeStart;
  }
  fetch('/fvs/api/v1/google/Actions/ImportShifts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).then((response) => {
    if(response.status !== 200) {
      response.json().then((data) => {
        if(data.code === 'beforeStart') {
          bootbox.prompt({
            title: 'At least one shift starts before the event does. Do you want to force the start time?',
            inputType: 'checkbox',
            inputOptions: [{text: 'Yes', value: 'yes'}],
            callback: (result) => {
              if(result === null || result[0] !== 'yes') {
                return;
              }
              importFromSheetAndTabConfirmed3(sheetID, tabName, importParticipants, departmentID, eventID, true);
            }
          });
          return;
        }
        bootbox.alert(data.error);
      });
      return;
    }
    response.json().then((data) => {
      let message = data.success+' shifts imported successfully.';
      if(data.fail > 0) {
        message += ' '+data.fail+' shifts failed to import.';
      }
      bootbox.alert(message);
    });
  });

}


window.onload = () => {
  fetch('/fvs/api/v1/google/loginStatus').then((response) => {
    let googleLink = document.getElementById('googleLink');
    if(response.status === 401) {
      googleLink.innerHTML = 'Log in to the volunteer system before attempting to use this page.';
      return;
    }
    response.json().then((data) => {
      if(data.loggedIn) {
        writePageForLoggedInUser(data);
        return;
      }
      fetch('/fvs/api/v1/google/loginLink').then((linkResponse) => {
        linkResponse.json().then((linkData) => {
          googleLink.innerHTML = `<a href="${linkData.uri}">Log in to Google</a>`;
        });
      });
    });
  });
};