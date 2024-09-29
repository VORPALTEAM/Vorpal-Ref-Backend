import { runQuery as Q, runQueryWithParams } from './connection';

// DEPRECATED!!!

const defaultUserData = {
    login: "",
    rights: "user",
    address: "0x0000000000000000000000000"
}

export async function requestUsers () {
    const userQuery = `SELECT address, login, rights FROM users;`
    const userData = await Q(userQuery)
  
    return ( {
        success: userData ? true : false,
        error: '',
        content: userData || []
    })
}

export async function updateUser (data = defaultUserData) {
    if (data === defaultUserData || !data.address || data.login === undefined || data.rights === undefined) {
        return ({
            success: false,
            err: "Failed to update user: invalid entry"
        });
    }

    const addr = data.address.toLowerCase()

    const checkQuery = `SELECT * FROM users WHERE address = $1;`
    const checking = await runQueryWithParams(checkQuery, [addr]);
    if (!checking || checking.length < 1) {
        return ({
            success: false,
            err: 'User not found'
        });
    }

    const updateQuery = `UPDATE users SET login = $1, rights= $2 WHERE address = $3;`
    const updating = await runQueryWithParams(updateQuery, [data.login, data.rights, addr])
    return( {
        success: updating ? true : false,
        err: updating ? "" : "Unknown"
    })

}


export async function createUser (data = defaultUserData) {
    if (data === defaultUserData || !data.address || !data.login || !data.rights) {
        return ({
            success: false,
            err: "Failed to create user: invalid entry"
        });
    }
    
    const addr = data.address.toLowerCase()

    const checkQuery = `SELECT * FROM users WHERE address = $1;`
    const checking = await runQueryWithParams(checkQuery, [addr]);
    if (checking && checking.length > 0) {
        return ({
            success: false,
            err: 'User already exists'
        });
    }

    const creationQuery = `INSERT INTO users (login, rights, address) VALUES ($1, $2, $3);`
    const result = await runQueryWithParams(creationQuery, [data.login, data.rights, addr])

    return( {
        success: result ? true : false,
        err: result ? "" : "Unknown"
    })
}

export async function deleteUser (address = defaultUserData.address) {
    if (address === defaultUserData.address || !address) {
        return false;
    }

    const addr = address.toLowerCase()

    const checkCount = await requestUsers ();
    if (checkCount.content.length < 2) {
        return ({
            success: false,
            err: 'Cannot remove the last user'
        });
    }

    const checkQuery = `SELECT * FROM users WHERE address = $1;`
    const checking = await runQueryWithParams(checkQuery, [addr]);
    
    if (checking && checking.length < 1) {
        return ({
            success: false,
            err: 'User already not exists'
        });
    }

    const deleteQuery = `DELETE FROM users WHERE address = $1;`
    const result = await runQueryWithParams(deleteQuery, [addr])

    return( {
        success: result ? true : false,
        err: result ? "" : "Unknown"
    })
}
