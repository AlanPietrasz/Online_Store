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
    * Retrieves a user or users from the database. If a username is provided, 
    * retrieves the specific user; otherwise retrieves all users.
    * @param {string|null} [username=null] - The username of the user to retrieve. 
    * If null, retrieves all users.
    * @returns {Promise<Array|Object|null>} A Promise that resolves to an array 
    * of user objects if no username is provided, a single user object if a 
    * username is provided, or null if the user is not found.
    */
    async retrieve(username = null) {
        try {
            const req = new mssql.Request(this.conn);
            const query = username ? 'SELECT * FROM LoggedInUsers WHERE username = @username'
                : 'SELECT * FROM LoggedInUsers';
            if (username) req.input('username', username);
            const res = await req.query(query);
            if (username) {
                return res.recordset.length > 0 ? res.recordset[0] : null;
            } else {
                return res.recordset;
            }
        } catch (err) {
            console.error('Error in retrieve:', err);
            throw err;
        }
    }

    /**
    * Inserts a new user into the database.
    * @param {Object} newUser - An object containing the new user's information, 
    * including username, email, and password.
    * @returns {Promise<number>} A Promise that resolves to the ID of the newly 
    * inserted user.
    * @throws {Error} If there is an error during the database operation or 
    * if newUser is not provided.
    */
    async insert(newUser) {
        if (!newUser) {
            throw new Error('New user data must be provided.');
        }
        try {
            const userExists = await this.retrieve(newUser.username);
            if (userExists) throw Error('Username is already taken');

            const rounds = 12;
            const hash = await bcrypt.hash(newUser.password, rounds);

            const req = new mssql.Request(this.conn);
            req.input("username", newUser.username)
                .input("email", newUser.email)
                .input("balance", 0)
                .input("hash", hash)
                .input("multiplier", 1);

            const query = 'INSERT INTO LoggedInUsers (username, email, balance, hash, multiplier) VALUES (@username, @email, @balance, @hash, @multiplier) SELECT SCOPE_IDENTITY() AS id'
            const res = await req.query(query);
            return res.recordset[0].id;
        } catch (err) {
            console.error('Error in insert:', err);
            throw err;
        }
    }

    /**
    * Updates a user's data in the database.
    * @param {Object} user - The user object with updated data, including the ID.
    * @returns {Promise<number>} A Promise that resolves to the number of rows affected.
    */
    async update(user) {
        if (!user || !user.ID) throw new Error('User ID must be provided.');
        try {
            const req = new mssql.Request(this.conn);
            req.input("ID", user.ID)
                .input("username", user.username)
                .input("email", user.email)
                .input("balance", user.balance)
                .input("multiplier", user.multiplier);

            const res = await req.query('UPDATE LoggedInUsers SET username=@username, email=@email, balance=@balance, multiplier=@multiplier WHERE ID=@ID');
            return res.rowsAffected[0];
        } catch (err) {
            console.error('Error in update:', err);
            throw err;
        }
    }

    /**
     * Updates a user's password in the database.
     * @param {string} username - The username of the user whose password is to be updated.
     * @param {string} newPassword - The new password to set for the user.
     * @returns {Promise<number>} A Promise that resolves to the number of rows affected.
     * @throws {Error} Throws an error if username is not provided, if the user cannot be found, or the database operation fails.
     */
    async updatePassword(username, newPassword) {
        if (!username) {
            throw new Error('Username must be provided.');
        }
        if (!newPassword) {
            throw new Error('New password must be provided.');
        }

        try {
            const user = await this.retrieve(username);
            if (!user) {
                throw new Error('User not found.');
            }

            const rounds = 12;
            const hashedPassword = await bcrypt.hash(newPassword, rounds);

            const req = new mssql.Request(this.conn);
            req.input('ID', user.ID)
                .input('Hash', hashedPassword);

            const query = 'UPDATE LoggedInUsers SET hash = @Hash WHERE ID = @ID';
            const res = await req.query(query);
            return res.rowsAffected[0];
        } catch (err) {
            console.error('Error in updatePassword:', err);
            throw err;
        }
    }

    /**
     * Deletes a user from the database.
     * @param {number} userID - The ID of the user to delete.
     * @returns {Promise<number>} A Promise that resolves to the number of rows affected by the delete operation.
     * @throws {Error} Throws an error if userID is not provided or the database operation fails.
     */
    async delete(userID) {
        if (!userID) {
            throw new Error('User ID must be provided.');
        }
        try {
            const req = new mssql.Request(this.conn);
            req.input("ID", userID);
            const res = await req.query('DELETE FROM LoggedInUsers WHERE ID=@ID');
            return res.rowsAffected[0];
        } catch (err) {
            console.error('Error in delete:', err);
            throw err;
        }
    }

    /**
     * Checks if the provided username and password are valid.
     * @param {string} username - The username to check.
     * @param {string} password - The password to check.
     * @returns {Promise<boolean>} True if credentials are valid, false otherwise.
     * @throws {Error} Throws an error if username or password is not provided or the database operation fails.
     */
    async checkPassword(username, password) {
        if (!username || !password) {
            throw new Error('Username and password must be provided.');
        }
        try {
            const req = new mssql.Request(this.conn);
            req.input("username", username);
            const user = await req.query('SELECT * FROM LoggedInUsers WHERE username=@username');
            if (user.recordset.length > 0) {
                return await bcrypt.compare(password, user.recordset[0].hash);
            }
            return false;
        } catch (err) {
            console.error('Error in checkLogin:', err);
            throw err;
        }
    }

    /**
     * Checks if a user is associated with a specific role.
     * @param {number} userId - The ID of the user.
     * @param {number} roleId - The ID of the role.
     * @returns {Promise<boolean>} True if the user is associated with the role, false otherwise.
     * @throws {Error} Throws an error if userId or roleId is not provided or the database operation fails.
     */
    async isUserInRole(userId, roleId) {
        if (!userId || !roleId) {
            throw new Error('User ID and Role ID must be provided.');
        }
        try {
            const req = new mssql.Request(this.conn);
            req.input('UserId', userId)
                .input('RoleId', roleId);
            const res = await req.query('SELECT * FROM LoggedInUser_Role WHERE ID_LoggedInUser = @UserId AND ID_Role = @RoleId');
            return res.recordset.length > 0;
        } catch (err) {
            console.error('Error in isUserInRole:', err);
            throw err;
        }
    }

    /**
     * Adds a role to a user.
     * @param {number} userId - The ID of the user.
     * @param {number} roleId - The ID of the role to be added.
     * @returns {Promise<number>} The number of rows affected by the add operation.
     * @throws {Error} Throws an error if userId or roleId is not provided or the database operation fails.
     */
    async addRoleToUser(userId, roleId) {
        if (!userId || !roleId) {
            throw new Error('User ID and Role ID must be provided.');
        }
        try {
            if (await this.isUserInRole(userId, roleId)) {
                return 0;
            }

            const req = new mssql.Request(this.conn);
            req.input("ID_LoggedInUser", userId)
                .input("ID_Role", roleId);
            const res = await req.query('INSERT INTO LoggedInUser_Role (ID_LoggedInUser, ID_Role) VALUES (@ID_LoggedInUser, @ID_Role)');
            return res.rowsAffected[0];
        } catch (err) {
            console.error('Error in addRoleToUser:', err);
            throw err;
        }
    }

    /**
     * Removes a role from a user.
     * @param {number} userId - The ID of the user.
     * @param {number} roleId - The ID of the role to be removed.
     * @returns {Promise<number>} The number of rows affected by the remove operation.
     * @throws {Error} Throws an error if userId or roleId is not provided or the database operation fails.
     */
    async removeRoleFromUser(userId, roleId) {
        if (!userId || !roleId) {
            throw new Error('User ID and Role ID must be provided.');
        }
        try {
            const req = new mssql.Request(this.conn);
            req.input("ID_LoggedInUser", userId)
                .input("ID_Role", roleId);
            const res = await req.query('DELETE FROM LoggedInUser_Role WHERE ID_LoggedInUser = @ID_LoggedInUser AND ID_Role = @ID_Role');
            return res.rowsAffected[0];
        } catch (err) {
            console.error('Error in removeRoleFromUser:', err);
            throw err;
        }
    }

    /**
     * Retrieves all roles associated with a specific user.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<Array>} An array of role objects associated with the user.
     * @throws {Error} Throws an error if userId is not provided or the database operation fails.
     */
    async getUserRoles(userId) {
        if (!userId) {
            throw new Error('User ID must be provided.');
        }
        try {
            const req = new mssql.Request(this.conn);
            req.input("ID_LoggedInUser", userId);
            const res = await req.query('SELECT R.* FROM Role R INNER JOIN LoggedInUser_Role LUR ON R.ID = LUR.ID_Role WHERE LUR.ID_LoggedInUser = @ID_LoggedInUser');
            return res.recordset;
        } catch (err) {
            console.error('Error in getUserRoles:', err);
            throw err;
        }
    }

    /**
     * Retrieves the top users by balance from the database.
     * @param {number} number - The number of top users to retrieve.
     * @returns {Promise<Array>} An array of the top users by balance.
     * @throws {Error} Throws an error if the number is not provided or the database operation fails.
     */
    async retrieveTopUsersByBalance(number) {
        if (!number) {
            throw new Error('Number of top users to retrieve must be provided.');
        }
        try {
            const req = new mssql.Request(this.conn);
            req.input('number', number);
            const query = `SELECT TOP (@number) username, balance FROM LoggedInUsers ORDER BY balance DESC`;
            const res = await req.query(query);
            return res.recordset;
        } catch (err) {
            console.error('Error retrieving top users by balance:', err);
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
    * Retrieves a role or roles from the database. Retrieves the specific role if a role name is provided, 
    * otherwise retrieves all roles.
    * @param {string|null} [roleName=null] - Optional. The name of the role to retrieve. 
    * Defaults to null, which retrieves all roles.
    * @returns {Promise<Array|Object|null>} A Promise that resolves to an array 
    * of role objects if no role name is provided, a single role object if a 
    * role name is provided, or null if the role is not found.
    */
    async retrieve(roleName = null) {
        try {
            const req = new mssql.Request(this.conn);
            const query = roleName ? 'SELECT * FROM Role WHERE roleName = @roleName' : 'SELECT * FROM Role';
            if (roleName) {
                req.input('roleName', roleName);
            }
            const res = await req.query(query);
            return roleName ? (res.recordset[0] || null) : res.recordset;
        } catch (err) {
            console.error('Error in retrieve:', err);
            throw err;
        }
    }

    /**
    * Inserts a new role into the database.
    * @param {Object} role - An object containing the new role's information.
    * @returns {Promise<number>} A Promise that resolves to the ID of the newly 
    * inserted role.
    * @throws {Error} If the role data is not provided or the database operation fails.
    */
    async insert(role) {
        if (!role) {
            throw new Error('Role data must be provided.');
        }
        try {
            const req = new mssql.Request(this.conn);
            req.input("roleName", role.roleName);
            const res = await req.query('INSERT INTO Role (roleName) VALUES (@roleName) SELECT SCOPE_IDENTITY() AS id');
            return res.recordset[0].id;
        } catch (err) {
            console.error('Error in insert:', err);
            throw err;
        }
    }

    /**
    * Updates the details of an existing role in the database.
    * @param {Object} role - An object containing the updated role's information, 
    * including the ID.
    * @returns {Promise<number>} A Promise that resolves to the number of rows affected.
    * @throws {Error} If the role or role ID is not provided or the database operation fails.
    */
    async update(role) {
        if (!role || !role.ID) {
            throw new Error('Role and Role ID must be provided.');
        }
        try {
            const req = new mssql.Request(this.conn);
            req.input("ID", role.ID)
                .input("roleName", role.roleName);
            const res = await req.query('UPDATE Role SET roleName = @roleName WHERE ID = @ID');
            return res.rowsAffected[0];
        } catch (err) {
            console.error('Error in update:', err);
            throw err;
        }
    }

    /**
    * Deletes a role from the database.
    * @param {number} roleID - The ID of the role to delete.
    * @returns {Promise<number>} A Promise that resolves to the number of rows affected.
    * @throws {Error} If the role ID is not provided or the database operation fails.
    */
    async delete(roleID) {
        if (!roleID) {
            throw new Error('Role ID must be provided.');
        }
        try {
            const req = new mssql.Request(this.conn);
            req.input("ID", roleID);
            const res = await req.query('DELETE FROM Role WHERE ID = @ID');
            return res.rowsAffected[0];
        } catch (err) {
            console.error('Error in delete:', err);
            throw err;
        }
    }
}

class ProductRepository {
    /**
    * ProductRepository constructor.
    * @param {mssql.ConnectionPool} conn - The connection pool to the database.
    */
    constructor(conn) {
        this.conn = conn;
    }

    /**
    * Retrieves a product or products from the database. If an ID is provided, 
    * retrieves the specific product; otherwise retrieves all products.
    * @param {number|null} [id=null] - The ID of the product to retrieve. 
    * If null, retrieves all products.
    * @returns {Promise<Array|Object|null>} A Promise that resolves to an array 
    * of product objects if no ID is provided, a single product object if an 
    * ID is provided, or null if the product is not found.
    */
    async retrieve(id = null) {
        try {
            const req = new mssql.Request(this.conn);
            const query = id ? 'SELECT * FROM Product WHERE ID = @ID'
                : 'SELECT * FROM Product';
            if (id) req.input('ID', id);
            const res = await req.query(query);
            if (id) {
                return res.recordset.length > 0 ? res.recordset[0] : null;
            } else {
                return res.recordset;
            }
        } catch (err) {
            console.error('Error in Product retrieve:', err);
            throw err;
        }
    }

    /**
    * Inserts a new product into the database.
    * @param {Object} newProduct - An object containing the new product's information.
    * @returns {Promise<number>} A Promise that resolves to the ID of the newly 
    * inserted product.
    * @throws {Error} If newProduct is not provided.
    */
    async insert(newProduct) {
        if (!newProduct) {
            throw new Error('New product data must be provided.');
        }
        try {
            const req = new mssql.Request(this.conn);
            req.input("productName", newProduct.productName)
                .input("description", newProduct.description)
                .input("price", newProduct.price)
                .input("quantity", newProduct.quantity);

            const query = 'INSERT INTO Product (productName, description, price, quantity) VALUES (@productName, @description, @price, @quantity) SELECT SCOPE_IDENTITY() AS id';
            const res = await req.query(query);
            return res.recordset[0].id;
        } catch (err) {
            console.error('Error in Product insert:', err);
            throw err;
        }
    }

    /**
    * Updates a product's data in the database.
    * @param {Object} product - The product object with updated data.
    * @returns {Promise<number>} A Promise that resolves to the number of rows affected.
    * @throws {Error} If product or product ID is not provided.
    */
    async update(product) {
        if (!product || !product.ID) throw new Error('Product ID must be provided.');
        try {
            const req = new mssql.Request(this.conn);
            req.input("ID", product.ID)
                .input("productName", product.productName)
                .input("description", product.description)
                .input("price", product.price)
                .input("quantity", product.quantity);

            const res = await req.query('UPDATE Product SET productName=@productName, description=@description, price=@price, quantity=@quantity WHERE ID=@ID');
            return res.rowsAffected[0];
        } catch (err) {
            console.error('Error in Product update:', err);
            throw err;
        }
    }

    /**
    * Deletes a product from the database.
    * @param {number} productID - The ID of the product to delete.
    * @returns {Promise<number>} A Promise that resolves to the number of rows affected.
    * @throws {Error} If product ID is not provided.
    */
    async delete(productID) {
        if (!productID) {
            throw new Error('Product ID must be provided.');
        }
        try {
            const req = new mssql.Request(this.conn);
            req.input("ID", productID);
            const res = await req.query('DELETE FROM Product WHERE ID = @ID');
            return res.rowsAffected[0];
        } catch (err) {
            console.error('Error in Product delete:', err);
            throw err;
        }
    }

    /**
    * Searches for products by name or description.
    * @param {string} searchTerm - The search term to look for 
    * in the productName and description fields.
    * @returns {Promise<Array>} A Promise that resolves to an 
    * array of product objects that match the search term.
    */
    async search(searchTerm) {
        try {
            const req = new mssql.Request(this.conn);
            const query = 'SELECT * FROM Product WHERE productName LIKE @searchTerm OR description LIKE @searchTerm';
            req.input('searchTerm', mssql.NVarChar, `%${searchTerm}%`);
            const res = await req.query(query);
            return res.recordset;
        } catch (err) {
            console.error('Error in Product search:', err);
            throw err;
        }
    }

    /**
    * Retrieves products with optional sorting and pagination.
    * @param {string} orderBy - The column to sort by.
    * @param {boolean} ascending - Whether to sort in ascending order.
    * @param {number} page - The current page number.
    * @param {number} pageSize - The number of products per page.
    * @returns {Promise<Array>} A Promise that resolves to an array of product objects.
    */
    async getProducts(orderBy = 'productName', ascending = true, page = 1, pageSize = 10, searchTerm = '') {
        try {
            const req = new mssql.Request(this.conn);
            const offset = (page - 1) * pageSize;
            const orderDirection = ascending ? 'ASC' : 'DESC';
            const query = `
                    SELECT * FROM Product
                    WHERE productName LIKE @searchTerm OR description LIKE @searchTerm
                    ORDER BY ${orderBy} ${orderDirection}
                    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
                `;
            req.input('searchTerm', mssql.NVarChar, `%${searchTerm}%`);
            req.input('offset', mssql.Int, offset);
            req.input('pageSize', mssql.Int, pageSize);
            const res = await req.query(query);
            return res.recordset;
        } catch (err) {
            console.error('Error in getProducts:', err);
            throw err;
        }
    }

    async getTotalProductCount() {
        try {
            const req = new mssql.Request(this.conn);
            const res = await req.query('SELECT COUNT(*) AS count FROM Product');
            return res.recordset[0].count;
        } catch (err) {
            console.error('Error in getTotalProductCount:', err);
            throw err;
        }
    }
}

module.exports = { UserRepository, RoleRepository, ProductRepository }
