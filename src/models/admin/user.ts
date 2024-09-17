import { writeLog } from '../log';
import { checkRights } from './admin';
import {
  updateUser,
  createUser,
  deleteUser,
  requestUsers,
} from '../users';

/* 
   body: {
       signature: "",
       message: "",
       data: {
         users: [ {
           address: "",
           login: "",
           rights: ""
         }, {
           address: "",
           login: "",
           rights: ""
         }],
           deletions: [
            "address",
            "address"
          ]
       }
   }

*/

export async function requestUserData(request) {
  const user = await checkRights(request.signature);
  if (!user) {
    return {
      success: false,
      error: 'Signature not found',
      content: null,
    };
  }

  return await requestUsers();
}

export async function updateUserDataAction(request) {
  if (!request.data) {
    return {
      success: false,
      error: 'User data not found',
    };
  }

  const user = await checkRights(request.signature, request.message);
  if (!user) {
    return {
      success: false,
      error: 'Signature not found or invalid',
    };
  }

  const updates: any[] = [];
  const creations: any[] = [];

  const actionResultsUpdate: any[] = [];
  const actionResultsCreate: any[] = [];
  const actionResultsDelete: any[] = [];

  const currentUsers = JSON.stringify(await requestUsers());

  request.data.users.forEach((user) => {
    if (currentUsers.indexOf(user.address) < 0) {
      creations.push(user);
    } else {
      updates.push(user);
    }
  });

  updates.forEach((item) => {
    actionResultsUpdate.push(updateUser(item));
  });

  creations.forEach((item) => {
    actionResultsCreate.push(createUser(item));
  });

  request.data.deletions.forEach((address) => {
    actionResultsDelete.push(deleteUser(address));
  });

  return {
    updates: actionResultsUpdate,
    creations: actionResultsCreate,
    deletions: actionResultsDelete,
  };
}
