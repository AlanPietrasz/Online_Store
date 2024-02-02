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

    async doesUserExist(username) {
        if (username === undefined) return false;
    
        const exists = await this.retrieve(username);
        return exists ? true : false;
    }

    /**
     * Retrieves a user by their ID from the database.
     * @param {number} id - The ID of the user to retrieve.
     * @returns {Promise<Object|null>} A Promise that resolves to the user object if found, or null if not found.
     * @throws {Error} Throws an error if the database operation fails.
     */
    async retrieveById(id) {
        if (id === null || id === undefined) {
            throw new Error('User ID must be provided.');
        }

        try {
            const req = new mssql.Request(this.conn);
            const query = 'SELECT * FROM LoggedInUsers WHERE ID = @id';
            req.input('id', mssql.Int, id);
            const res = await req.query(query);
            return res.recordset.length > 0 ? res.recordset[0] : null;
        } catch (err) {
            console.error('Error in retrieveById:', err);
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

    /**
     * Updates the balance of a user's account.
     * @param {number} userId - The ID of the user.
     * @param {number} amount - The amount to add or subtract from the user's balance.
     * @returns {Promise<void>}
     * @throws {Error} Throws an error if the database operation fails.
     */
    async updateUserBalance(userId, amount) {
        if (userId === null || userId === undefined) {
            throw new Error('User ID must be provided.');
        }
        if (amount === null || amount === undefined) {
            throw new Error('Amount to update must be provided.');
        }

        try {
            const req = new mssql.Request(this.conn);
            req.input('ID', mssql.Int, userId)
            .input('amount', mssql.Money, amount);

            await req.query('UPDATE LoggedInUsers SET balance = balance + @amount WHERE ID = @ID');
        } catch (err) {
            console.error('Error in updateUserBalance:', err);
            throw err;
        }
    }

    async getPaginatedUsers(page = 1, pageSize = 10, searchTerm = '') {
        try {
            const offset = (page - 1) * pageSize;
            let query = `SELECT * FROM LoggedInUsers WHERE username LIKE @searchTerm ORDER BY username OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`;
            const totalQuery = `SELECT COUNT(*) as totalCount FROM LoggedInUsers WHERE username LIKE @searchTerm`;
    
            const req = new mssql.Request(this.conn);
            req.input('searchTerm', `%${searchTerm}%`);
            req.input('offset', mssql.Int, offset);
            req.input('pageSize', mssql.Int, pageSize);
    
            const [users, total] = await Promise.all([
                req.query(query),
                req.query(totalQuery)
            ]);

            const usersWithRolesPromises = users.recordset.map(async (user) => {
                const roles = await this.getUserRoles(user.ID); // Zakładając, że this.getUserRoles jest dostępne
                return {
                    ...user,
                    roles: roles.map(role => role.roleName) // Przykład mapowania, jeśli chcesz tylko nazwy ról
                };
            });

            const usersWithRoles = await Promise.all(usersWithRolesPromises);

    
            return {
                users: usersWithRoles,
                totalCount: total.recordset[0].totalCount,
                page,
                pageSize,
                totalPages: Math.ceil(total.recordset[0].totalCount / pageSize),
                searchTerm
            };
        } catch (err) {
            console.error('Error in getPaginatedUsers:', err);
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
            const price = newProduct.price !== '' ? newProduct.price : null;
            const quantity = newProduct.quantity !== '' ? newProduct.quantity : null;

            const req = new mssql.Request(this.conn);
            req.input("productName", newProduct.productName)
                .input("description", newProduct.description)
                .input("price", price)
                .input("quantity", quantity);

            const query = `
                INSERT INTO Product (productName, description, price, quantity)
                VALUES (@productName, @description, @price, @quantity);
                SELECT SCOPE_IDENTITY() AS id;
            `;
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

            const price = product.price !== '' ? product.price : null;
            const quantity = product.quantity !== '' ? product.quantity : null;

            const req = new mssql.Request(this.conn);
            req.input("ID", product.ID)
                .input("productName", product.productName)
                .input("description", product.description)
                .input("price", price)
                .input("quantity", quantity);

            const res = await req.query('UPDATE Product SET productName=@productName, description=@description, price=@price, quantity=@quantity WHERE ID=@ID');
            return res.rowsAffected[0];
        } catch (err) {
            console.error('Error in Product update:', err);
            throw err;
        }
    }

    // Function to check if the product has associated records in any table
    async hasAssociatedRecords(productID) {
        // Check for associated records in LoggedInUser_Product
        let req = new mssql.Request(this.conn);
        await req.input("ID_Product", productID);
        const loggedInUserProductCount = await req.query('SELECT COUNT(*) AS count FROM LoggedInUser_Product WHERE ID_Product = @ID_Product');
        
        // Check for associated records in CartItems
        req = new mssql.Request(this.conn);
        await req.input("ID_Product", productID);
        const cartItemsCount = await req.query('SELECT COUNT(*) AS count FROM CartItems WHERE ID_Product = @ID_Product');

        return loggedInUserProductCount.recordset[0].count > 0 || cartItemsCount.recordset[0].count > 0;
    }

    // Function to delete product if it has no associations
    async delete(productID) {
        if (await this.hasAssociatedRecords(productID)) {
            throw new Error('Cannot delete product because it has associated records.');
        }
        return this.deleteProductById(productID);
    }

    async forceDeleteProduct(productID) {
        // Delete references from LoggedInUser_Product
        let req = new mssql.Request(this.conn);
        await req.input("ID_Product", productID).query('DELETE FROM LoggedInUser_Product WHERE ID_Product = @ID_Product');

        // Delete references from CartItems
        req = new mssql.Request(this.conn);
        await req.input("ID_Product", productID).query('DELETE FROM CartItems WHERE ID_Product = @ID_Product');

        // Now, delete the product itself
        return this.deleteProductById(productID);
    }

    async deleteProductById(productID) {
        const req = new mssql.Request(this.conn);
        await req.input("ID", productID).query('DELETE FROM Product WHERE ID = @ID');
        return true; // or return req.rowsAffected[0]; for the number of rows affected
    }

    /**
    * Searches for products by name or description.
    * @param {string} searchTerm - The search term to look for 
    * in the productName and description fields.
    * @returns {Promise<Array>} A Promise that resolves to an 
    * array of product objects that match the search term.
    */
    async search(searchTerm, adminView = false) {
        try {
            const req = new mssql.Request(this.conn);
            var query = 'SELECT * FROM Product WHERE (productName LIKE @searchTerm OR description LIKE @searchTerm)';
            if (!adminView) {
                query += ' AND (price IS NOT NULL AND (quantity != 0 OR quantity IS NULL))';
            }
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
    async getProducts(orderBy = 'productName', ascending = true, page = 1, pageSize = 10, searchTerm = '', adminView = false) {
        try {
            const req = new mssql.Request(this.conn);
            const offset = (page - 1) * pageSize;
            const orderDirection = ascending ? 'ASC' : 'DESC';
            var query = `
                    SELECT * FROM Product
                    WHERE (productName LIKE @searchTerm OR description LIKE @searchTerm)
                    `
            if (!adminView) {
                query += ' AND (price IS NOT NULL AND (quantity != 0 OR quantity IS NULL))';
            }

            query+=`ORDER BY ${orderBy} ${orderDirection}
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

    async getTotalProductCount(adminView = false) {
        try {
            const req = new mssql.Request(this.conn);
            var query = 'SELECT COUNT(*) AS count FROM Product';
            if (!adminView) {
                query += ' WHERE price IS NOT NULL AND (quantity != 0 OR quantity IS NULL)';
            }
            const res = await req.query(query);
            return res.recordset[0].count;
        } catch (err) {
            console.error('Error in getTotalProductCount:', err);
            throw err;
        }
    }

    /**
    * Retrieves the available quantity of a specific product.
    * @param {number} productId - The ID of the product.
    * @returns {Promise<number>} A Promise that resolves to the available quantity of the product.
    * @throws {Error} Throws an error if the database operation fails.
    */
    async getProductQuantity(productId) {
        try {
            const req = new mssql.Request(this.conn);
            req.input('ID', mssql.Int, productId);
            const result = await req.query('SELECT quantity FROM Product WHERE ID = @ID');
            if (result.recordset.length > 0) {
                return result.recordset[0].quantity !== null ? result.recordset[0].quantity : null;
            }
            return 0;
        } catch (err) {
            console.error('Error in getProductQuantity:', err);
            throw err;
        }
    }

    /**
    * Decreases the quantity of a product.
    * @param {number} productId - The ID of the product.
    * @param {number} decreaseBy - The amount to decrease the quantity by.
    * @returns {Promise<number>} A Promise that resolves to the number of rows affected.
    */
    async decreaseProductQuantity(productId, decreaseBy) {
        try {
            const req = new mssql.Request(this.conn);
            req.input("ID", productId)
                .input("decreaseBy", decreaseBy);

            const res = await req.query('UPDATE Product SET quantity = quantity - @decreaseBy WHERE ID = @ID AND quantity >= @decreaseBy');
            return res.rowsAffected[0];
        } catch (err) {
            console.error('Error in decreaseProductQuantity:', err);
            throw err;
        }
    }

    /**
    * Increases the quantity of a product.
    * @param {number} productId - The ID of the product.
    * @param {number} increaseBy - The amount to increase the quantity by.
    * @returns {Promise<number>} A Promise that resolves to the number of rows affected.
    */
    async increaseProductQuantity(productId, increaseBy) {
        try {
            const req = new mssql.Request(this.conn);
            req.input("ID", productId)
                .input("increaseBy", increaseBy);

            const res = await req.query('UPDATE Product SET quantity = quantity + @increaseBy WHERE ID = @ID');
            return res.rowsAffected[0];
        } catch (err) {
            console.error('Error in increaseProductQuantity:', err);
            throw err;
        }
    }

    async addProductToUser(userId, productId, purchaseDateTime, quantity) {
        try {
            const req = new mssql.Request(this.conn);
            await req.input('ID_LoggedInUser', mssql.Int, userId)
                .input('ID_Product', mssql.Int, productId)
                .input('purchaseDateTime', mssql.DateTime2, purchaseDateTime)
                .input('quantity', mssql.Int, quantity);
    
            const query = 'INSERT INTO LoggedInUser_Product (ID_LoggedInUser, ID_Product, purchaseDateTime, quantity) VALUES (@ID_LoggedInUser, @ID_Product, @purchaseDateTime, @quantity)';
            await req.query(query);
        } catch (err) {
            console.error('Error in addProductToUser:', err);
            throw err;
        }
    }

    async getPurchasedProductsByUser(userId) {
        try {
            const req = new mssql.Request(this.conn);
            req.input('ID_LoggedInUser', mssql.Int, userId);
            const query = `
                SELECT 
                    P.ID, 
                    P.productName, 
                    P.description, 
                    P.price, 
                    LUP.quantity, 
                    LUP.purchaseDateTime
                FROM LoggedInUser_Product LUP
                INNER JOIN Product P ON LUP.ID_Product = P.ID
                WHERE LUP.ID_LoggedInUser = @ID_LoggedInUser
            `;
            const result = await req.query(query);
            return result.recordset;
        } catch (err) {
            console.error('Error in getPurchasedProductsByUser:', err);
            throw err;
        }
    }
}

class CartRepository {
    /**
     * CartRepository constructor.
     * @param {mssql.ConnectionPool} conn - The connection pool to the database.
     */
    constructor(conn) {
        this.conn = conn;
    }

    /**
     * Adds a product with a specific quantity to a user's cart or updates the quantity if the product is already in the cart.
     * @param {number} userId - The ID of the user.
     * @param {number} productId - The ID of the product to add.
     * @param {number} quantity - The quantity of the product to add.
     * @throws {Error} Throws an error if the database operation fails.
     */
    async addToCart(userId, productId, quantity) {
        try {
            // Check if the product already exists in the user's cart
            const existingItem = await this.getCartItem(userId, productId);
            const req = new mssql.Request(this.conn);

            if (existingItem) {
                // Update the quantity if the item exists
                const newQuantity = Number(existingItem.quantity) + Number(quantity);
                await req.input('ID_LoggedInUser', userId)
                    .input('ID_Product', productId)
                    .input('quantity', newQuantity)
                    .query('UPDATE CartItems SET quantity = @quantity WHERE ID_LoggedInUser = @ID_LoggedInUser AND ID_Product = @ID_Product');
            } else {
                // Insert the new item if it does not exist
                await req.input('ID_LoggedInUser', userId)
                    .input('ID_Product', productId)
                    .input('quantity', quantity)
                    .query('INSERT INTO CartItems (ID_LoggedInUser, ID_Product, quantity) VALUES (@ID_LoggedInUser, @ID_Product, @quantity)');
            }
        } catch (err) {
            console.error('Error in addToCart:', err);
            throw err;
        }
    }

    /**
     * Removes a specific product from a user's cart.
     * @param {number} userId - The ID of the user.
     * @param {number} productId - The ID of the product to remove.
     * @throws {Error} Throws an error if the database operation fails.
     */
    async removeFromCart(userId, productId) {
        try {
            const req = new mssql.Request(this.conn);
            req.input("ID_LoggedInUser", userId)
                .input("ID_Product", productId);

            const cartItem = await this.getCartItem(userId, productId);
            if (!cartItem) throw new Error('Cart item not found.');

            await req.query('DELETE FROM CartItems WHERE ID_LoggedInUser = @ID_LoggedInUser AND ID_Product = @ID_Product');
        } catch (err) {
            console.error('Error in removeFromCart:', err);
            throw err;
        }
    }

    /**
     * Retrieves a single cart item for a user.
     * @param {number} userId - The ID of the user.
     * @param {number} productId - The ID of the product.
     * @returns {Promise<Object|null>} A promise that resolves to the cart item if found, null otherwise.
     * @throws {Error} Throws an error if the database operation fails.
     */
    async getCartItem(userId, productId) {
        try {
            const req = new mssql.Request(this.conn);
            await req.input('ID_LoggedInUser', userId)
                .input('ID_Product', productId);
            const result = await req.query('SELECT * FROM CartItems WHERE ID_LoggedInUser = @ID_LoggedInUser AND ID_Product = @ID_Product');
            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.error('Error in getCartItem:', err);
            throw err;
        }
    }

    /**
     * Retrieves all items in a specific user's cart.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<Array>} A promise that resolves to an array of cart items.
     * @throws {Error} Throws an error if the database operation fails.
     */
    async getCartItems(userId) {
        try {
            const req = new mssql.Request(this.conn);
            req.input("ID_LoggedInUser", userId);
            const query = `
            SELECT 
                c.ID AS CartItemID, 
                c.ID_LoggedInUser, 
                c.ID_Product, 
                c.quantity AS CartQuantity, 
                p.productName, 
                p.price, 
                p.quantity AS ProductQuantity
            FROM CartItems c
            INNER JOIN Product p ON c.ID_Product = p.ID
            WHERE c.ID_LoggedInUser = @ID_LoggedInUser
        `;

            const result = await req.query(query);
            return result.recordset.map(item => ({
                ...item,
                ID: item.CartItemID,
                quantity: item.CartQuantity
            }));
        } catch (err) {
            console.error('Error in getCartItems:', err);
            throw err;
        }
    }

    /**
     * Clears all items from a user's cart.
     * @param {number} userId - The ID of the user.
     * @throws {Error} Throws an error if the database operation fails.
     */
    async clearCart(userId) {
        try {
            const req = new mssql.Request(this.conn);
            await req.input("ID_LoggedInUser", userId);
            await req.query('DELETE FROM CartItems WHERE ID_LoggedInUser = @ID_LoggedInUser');
        } catch (err) {
            console.error('Error in clearCart:', err);
            throw err;
        }
    }

    /**
     * Completes a purchase for all items in a user's cart.
     * @param {number} userId - The ID of the user.
     * @throws {Error} Throws an error if the database operation fails.
     */
    async completePurchase(userId) {
        try {
            // Tu powinna być logika do obsługi zakupu, np. tworzenie zamówienia, aktualizacja stanu magazynowego itp.
            // Na razie tylko czyścimy koszyk
            await this.clearCart(userId);
        } catch (err) {
            console.error('Error in completePurchase:', err);
            throw err;
        }
    }

}

module.exports = { UserRepository, RoleRepository, ProductRepository, CartRepository }
