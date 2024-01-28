// db.js
var mssql = require('mssql');
var { UserRepository, RoleRepository } = require('./repositories');

var config = 'server=localhost,1433;database=LoggedInUsersDB;user id=superadmin;password=superadmin;TrustServerCertificate=true';
var conn;

async function initConnectionPool() {
  if (!conn) {
    conn = new mssql.ConnectionPool(config);
    await conn.connect();
  }
}
/**
 * Checks if a user is associated with a specific role.
 * 
 * @param {string} username - The username of the user.
 * @param {string} roleName - The name of the role.
 * @returns {Promise<boolean>} True if the user is associated with the role, false otherwise.
 */
async function isUserInRole(username, roleName) {
    const userRepo = new UserRepository(conn);
    const roleRepo = new RoleRepository(conn);

    const user = await userRepo.retrieve(username);
    const role = await roleRepo.retrieve(roleName);

    if (!user || !role) {
        return false;
    }

    return await userRepo.isUserAssociatedWithRole(user.ID, role.ID);
}

/**
 * Checks if a user exists in the database.
 * 
 * @param {string} username - The username to check in the database.
 * @returns {Promise<boolean>} True if the user exists, false otherwise.
 */
async function doesUserExist(username) {
    const userRepo = new UserRepository(conn);

    const exists = await userRepo.retrieve(username);
    return exists;
}

/**
 * Adds a new user to the database if they do not already exist.
 * 
 * @param {Object} userData - An object containing the new user's information, including username, email, password.
 * @returns {Promise<number>} The ID of the newly added user.
 * @throws {Error} If the user already exists.
 */
async function addUser(userData) {
    const userRepo = new UserRepository(conn);
    const exists = await userRepo.retrieve(userData.username);
    if (exists) {
        throw new Error('User already exists');
    }
    return await userRepo.insert(userData);
}

/**
 * Deletes a user and all associated roles from the database.
 * 
 * @param {number} username - The username of user to delete.
 * @returns {Promise<void>} 
 */
async function deleteUserAndRoles(username) {
    const userRepo = new UserRepository(conn);
    const user = await userRepo.retrieve(username);
    const roles = await userRepo.getUserRoles(user.ID);
    for (const role of roles) {
        await userRepo.removeRoleFromUser(user.ID, role.ID);
    }
    await userRepo.delete(user.ID);
}

/**
 * Checks if the user has sufficient funds in their account.
 * 
 * @param {string} username - The username of the user.
 * @param {number} amount - The amount to check against the user's balance.
 * @returns {Promise<boolean>} True if the user has sufficient funds, false otherwise.
 */
async function hasSufficientFunds(username, amount) {
    const userRepo = new UserRepository(conn);
    const user = await userRepo.retrieve(username);
    if (!user || user.length === 0) {
        throw new Error('User not found');
    }
    return user.balance >= amount;
}

/**
 * Updates the balance of a user's account.
 * 
 * @param {string} username - The username of the user.
 * @param {number} amount - The amount to add or subtract from the user's balance.
 * @returns {Promise<void>}
 */
async function updateUserBalance(username, amount) {
    const userRepo = new UserRepository(conn);
    const user = await userRepo.retrieve(username);
    if (!user || user.length === 0) {
        throw new Error('User not found');
    }
    user.balance += amount;
    await userRepo.update(user);
}

/**
 * Adds a role to a user.
 * 
 * @param {string} username - The username of the user.
 * @param {string} roleName - The name of the role to add.
 * @returns {Promise<void>}
 */
async function addUserRole(username, roleName) {
    const userRepo = new UserRepository(conn);
    const roleRepo = new RoleRepository(conn);
    const user = await userRepo.retrieve(username);
    const role = await roleRepo.retrieve(roleName);
    if (!user || !role) {
        throw new Error('User or role not found');
    }
    await userRepo.addRoleToUser(user.ID, role.ID);
}

/**
 * Removes a role from a user.
 * 
 * @param {string} username - The username of the user.
 * @param {string} roleName - The name of the role to remove.
 * @returns {Promise<void>}
 */
async function removeUserRole(username, roleName) {
    const userRepo = new UserRepository(conn);
    const roleRepo = new RoleRepository(conn);
    const user = await userRepo.retrieve(username);
    const role = await roleRepo.retrieve(roleName);
    if (!user || !role) {
        throw new Error('User or role not found');
    }
    await roleRepo.removeRoleFromUser(user.ID, role.ID);
}

/**
 * Checks if provided password is correct.
 * 
 * @param {string} username - The username of the user.
 * @param {string} password - The password provided by user.
 * @returns {Promise<void>}
 */
async function correctPassword(username, password) {
    const userRepo = new UserRepository(conn);
    return await userRepo.checkLogin(username, password);
}

module.exports = { 
    initConnectionPool,
    isUserInRole, 
    doesUserExist, 
    addUser, 
    deleteUserAndRoles,
    hasSufficientFunds, 
    updateUserBalance, 
    addUserRole, 
    removeUserRole, 
    correctPassword 
};