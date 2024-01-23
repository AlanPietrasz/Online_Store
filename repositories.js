// repositories.js
var mssql = require('mssql');
var bcrypt = require('bcrypt');

class UserRepository {
    /**
    * UserRepository constructor.
    * @param {mssql.ConnectionPool} conn - The connection pool to the database.
    */
    constructor(conn) {
        this.conn = conn;
    }

    /**
    * Retrieves a user or users from the database. If a username is provided, retrieves the specific user; otherwise retrieves all users.
    * @param {string|null} username - The username of the user to retrieve. If null, retrieves all users.
    * @returns {Promise<Array|Object>} An array of user objects if no username is provided, or a single user object if a username is provided.
    */
    async retrieve(username = null) {
        try {
            var req = new mssql.Request(this.conn);
            if (username) req.input('Username', username);
            var res = await req.query('select * from LoggedInUsers' + (username ? ' where Username=@Username' : ''));
            return username ? res.recordset[0] : res.recordset;
        } catch (err) {
            console.log(err);
            return [];
        }
    }

    /**
    * Inserts a new user into the database.
    * @param {Object} newUser - An object containing the new user's information, including username, email, password, balance, and multiplier.
    * @returns {Promise<number>} The ID of the newly inserted user.
    * @throws {Error} If there is an error during the database operation.
    */
    async insert(newUser) {
        if (!newUser) return;
        try {
            if (await this.retrieve(newUser.username)) throw Error('Username is already taken');

            const rounds = 12;
            const hash = await bcrypt.hash(newUser.password, rounds);

            var req = new mssql.Request(this.conn);
            req.input("Username", newUser.username);
            req.input("email", newUser.email);
            req.input("balance", newUser.balance);
            req.input("hash", hash);
            req.input("multiplier", newUser.multiplier);

            var res = await req.query('insert into LoggedInUsers (Username, email, balance, hash, multiplier) values (@Username, @email, @balance, @hash, @multiplier) select scope_identity() as id');
            return res.recordset[0].id;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    /**
    * Updates a user's data in the database.
    * @param {Object} user - The user object with updated data.
    * @returns {Promise<number>} The number of rows affected.
    */
    async update(user) {
        if (!user || !user.ID) return;
        try {
            var req = new mssql.Request(this.conn);
            req.input("ID", user.ID);
            req.input("Username", user.Username);
            req.input("email", user.email);
            req.input("balance", user.balance);
            // Password update is not included here to avoid accidental changes
            req.input("multiplier", user.multiplier);

            var res = await req.query('update LoggedInUsers set Username=@Username, email=@email, balance=@balance, multiplier=@multiplier where ID=@ID');
            return res.rowsAffected[0];
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    /**
    * Deletes a user from the database.
    * @param {number} userID - The ID of the user to delete.
    * @returns {Promise<number>} The number of rows affected.
    */
    async delete(userID) {
        try {
            var req = new mssql.Request(this.conn);
            req.input("ID", userID);
            var res = await req.query('delete from LoggedInUsers where ID=@ID');
            return res.rowsAffected[0];
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    /**
    * Checks if the provided username and password are valid.
    * @param {string} username - The username to check.
    * @param {string} password - The password to check.
    * @returns {Promise<boolean>} True if credentials are valid, false otherwise.
    */
    async checkLogin(username, password) {
        try {
            var req = new mssql.Request(this.conn);
            req.input("Username", username);
            var user = await req.query('select * from LoggedInUsers where Username=@Username');
            if (user.recordset.length > 0) {
                var match = await bcrypt.compare(password, user.recordset[0].hash);
                return match;
            }
            return false;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    /**
    * Checks if a user is associated with a specific role.
    * @param {number} userId - The ID of the user.
    * @param {number} roleId - The ID of the role.
    * @returns {Promise<boolean>} True if the user is associated with the role, false otherwise.
    */
    async isUserAssociatedWithRole(userId, roleId) {
        try {
            var req = new mssql.Request(this.conn);
            req.input('UserId', userId);
            req.input('RoleId', roleId);
            var res = await req.query('SELECT * FROM LoggedInUser_Role WHERE ID_LoggedInUser = @UserId AND ID_Role = @RoleId');
            return res.recordset.length > 0;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    /**
    * Adds a role to a user.
    * @param {number} userId - The ID of the user.
    * @param {number} roleId - The ID of the role to be added.
    * @returns {Promise<number>} The number of rows affected.
    */
    async addRoleToUser(userId, roleId) {
        try {
            if (await this.isUserAssociatedWithRole(userId, roleId)) return 0;

            var req = new mssql.Request(this.conn);
            req.input("ID_LoggedInUser", userId);
            req.input("ID_Role", roleId);
            var res = await req.query('insert into LoggedInUser_Role (ID_LoggedInUser, ID_Role) values (@ID_LoggedInUser, @ID_Role)');
            return res.rowsAffected[0];
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    /**
    * Removes a role from a user.
    * @param {number} userId - The ID of the user.
    * @param {number} roleId - The ID of the role to be removed.
    * @returns {Promise<number>} The number of rows affected.
    */
    async removeRoleFromUser(userId, roleId) {
        try {
            var req = new mssql.Request(this.conn);
            req.input("ID_LoggedInUser", userId);
            req.input("ID_Role", roleId);
            var res = await req.query('delete from LoggedInUser_Role where ID_LoggedInUser = @ID_LoggedInUser and ID_Role = @ID_Role');
            return res.rowsAffected[0];
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}

class RoleRepository {
    /**
    * RoleRepository constructor.
    * @param {mssql.ConnectionPool} conn - The connection pool to the database.
    */
    constructor(conn) {
        this.conn = conn;
    }

    /**
    * Retrieves a role or roles from the database. If a role name is provided, retrieves the specific role; otherwise retrieves all roles.
    * @param {string|null} rolename - The name of the role to retrieve. If null, retrieves all roles.
    * @returns {Promise<Array|Object>} An array of role objects if no role name is provided, or a single role object if a role name is provided.
    */
    async retrieve(rolename = null) {
        try {
            var req = new mssql.Request(this.conn);
            if (rolename) req.input('RoleName', rolename);
            var res = await req.query('select * from Role' + (rolename ? ' where RoleName=@RoleName' : ''));
            return rolename ? res.recordset[0] : res.recordset;
        } catch (err) {
            console.log(err);
            return [];
        }
    }

    /**
    * Inserts a new role into the database.
    * @param {Object} role - An object containing the new role's information.
    * @returns {Promise<number>} The ID of the newly inserted role.
    * @throws {Error} If there is an error during the database operation.
    */
    async insert(role) {
        if (!role) return;
        try {
            var req = new mssql.Request(this.conn);
            req.input("RoleName", role.RoleName);
            var res = await req.query('insert into Role (RoleName) values (@RoleName) select scope_identity() as id');
            return res.recordset[0].id;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    /**
    * Updates the details of an existing role in the database.
    * @param {Object} role - An object containing the updated role's information.
    * @returns {Promise<number>} The number of rows affected.
    */
    async update(role) {
        if (!role || !role.ID) return;
        try {
            var req = new mssql.Request(this.conn);
            req.input("ID", role.ID);
            req.input("RoleName", role.RoleName);

            var res = await req.query('update Role set RoleName=@RoleName where ID=@ID');
            return res.rowsAffected[0];
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    /**
    * Deletes a role from the database.
    * @param {number} roleID - The ID of the role to delete.
    * @returns {Promise<number>} The number of rows affected.
    */
    async delete(roleID) {
        try {
            var req = new mssql.Request(this.conn);
            req.input("ID", roleID);
            var res = await req.query('delete from Role where ID=@ID');
            return res.rowsAffected[0];
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}

module.exports = { UserRepository, RoleRepository }
