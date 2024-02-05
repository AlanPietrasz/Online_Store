// db.js
var mssql = require('mssql');
var { UserRepository, RoleRepository, ProductRepository, CartRepository } = require('./repositories');

var config = 'server=localhost,1433;database=LoggedInUsersDB;user id=superadmin;password=superadmin;TrustServerCertificate=true';
var conn;

/**
 * Initializes the connection pool for the database.
 * If the connection pool is not already established, it creates a new one using the provided configuration.
 * This function should be called before any database operations are performed.
 * 
 * @returns {Promise<void>} A promise that resolves when the connection pool is successfully initialized.
 */
module.exports.initConnectionPool = async function initConnectionPool() {
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
module.exports.isUserInRole = async function isUserInRole(username, roleName) {
    if (!username) return false;
    const userRepo = new UserRepository(conn);
    const roleRepo = new RoleRepository(conn);

    const user = await userRepo.retrieve(username);
    const role = await roleRepo.retrieve(roleName);

    if (!user || !role) {
        return false;
    }

    return await userRepo.isUserInRole(user.ID, role.ID);
}

/**
 * Checks if a user exists in the database.
 * 
 * @param {string} username - The username to check in the database.
 * @returns {Promise<boolean>} True if the user exists, false otherwise.
 */
module.exports.doesUserExist = async function doesUserExist(username) {
    const userRepo = new UserRepository(conn);
    return await userRepo.doesUserExist(username);
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
module.exports.retrieveUser = async function retrieveUser(username) {
    const userRepo = new UserRepository(conn);

    return await userRepo.retrieve(username);
}

/**
 * Adds a new user to the database if they do not already exist.
 * 
 * @param {Object} userData - An object containing the new user's information, including username, email, password.
 * @returns {Promise<number>} The ID of the newly added user.
 * @throws {Error} If the user already exists.
 */
module.exports.addUser = async function addUser(userData) {
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
module.exports.deleteUserAndRoles = async function deleteUserAndRoles(username) {
    const userRepo = new UserRepository(conn);
    const user = await userRepo.retrieve(username);
    const roles = await userRepo.getUserRoles(user.ID);
    for (const role of roles) {
        await userRepo.removeRoleFromUser(user.ID, role.ID);
    }
    await userRepo.delete(user.ID);
}

/**
 * Retrieves all roles associated with a specific user.
 * 
 * @param {string} username - The username of the user.
 * @returns {Promise<Array>} An array of role objects associated with the user.
 * @throws {Error} Throws an error if username is not provided or the database operation fails.
 */
module.exports.getUserRoles = async function getUserRoles(username) {
    const userRepo = new UserRepository(conn);

    const exist = await userRepo.doesUserExist(username);
    if (!exist) return [];

    const user = await userRepo.retrieve(username);

    const roles = await userRepo.getUserRoles(user.ID);
    return roles;
}

/**
 * Checks if the user has sufficient funds in their account.
 * 
 * @param {string} username - The username of the user.
 * @param {number} amount - The amount to check against the user's balance.
 * @returns {Promise<boolean>} True if the user has sufficient funds, false otherwise.
 */
module.exports.hasSufficientFunds = async function hasSufficientFunds(username, amount) {
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
module.exports.updateUserBalance = async function updateUserBalance(username, amount) {
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
module.exports.addRoleToUser = async function addRoleToUser(username, roleName) {
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
module.exports.removRoleFromUser = async function removRoleFromUser(username, roleName) {
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
module.exports.checkPassword = async function checkPassword(username, password) {
    const userRepo = new UserRepository(conn);
    return await userRepo.checkPassword(username, password);
}

/**
 * Retrieves the top users.
 * 
 * @returns {Promise<Array>} An array of the top users.
 */
module.exports.topUsers = async function topUsers() {
    const userRepo = new UserRepository(conn);
    return await userRepo.retrieveTopUsersByBalance(10);
}

/**
 * Retrieves detailed information about a user from the database.
 *
 * @param {string} username - The username of the user to retrieve details for.
 * @returns {Promise<Object>} A promise that resolves to an object containing user details.
 * @throws {Error} Throws an error if the database operation fails or the user cannot be found.
 */
module.exports.retrieveUserDetails = async function retrieveUserDetails(username) {
    const userRepo = new UserRepository(conn);
    return await userRepo.retrieve(username);
}

/**
 * Updates a user's details in the database.
 *
 * @param {string} username - The username of the user whose details are to be updated.
 * @param {Object} userData - An object containing the user's updated details.
 * @returns {Promise<void>}
 * @throws {Error} If the update operation fails.
 */
module.exports.updateUserDetails = async function updateUserDetails(username, userData) {
    const userRepo = new UserRepository(conn);
    const user = await userRepo.retrieve(username);
    if (!user) {
        throw new Error('User not found');
    }

    if (userData.password) {
        const passwordUpdateResult = await userRepo.updatePassword(username, userData.password);
        if (passwordUpdateResult === 0) {
            throw new Error('Password update failed');
        }
    }

    return await userRepo.update({ ...user, ...userData });
}

module.exports.getPaginatedProducts = async function getPaginatedProducts(orderBy, direction, page, pageSize, searchTerm = '', adminView = false) {
    const productRepo = new ProductRepository(conn);
    const totalProductsPromise = searchTerm ? productRepo.search(searchTerm, adminView).then(results => results.length) : productRepo.getTotalProductCount(adminView);
    const productsPromise = productRepo.getProducts(orderBy, direction === 'ASC', page, pageSize, searchTerm, adminView);

    const [totalProducts, products] = await Promise.all([totalProductsPromise, productsPromise]);
    const totalPages = Math.ceil(totalProducts / pageSize);

    return {
        products,
        totalPages,
        page,
        pageSize,
        orderBy,
        direction,
        searchTerm
    };
}

async function updateProductQuantity(productId, amount, increase = false) {
    const productRepo = new ProductRepository(conn);
    const currentQuantity = await productRepo.getProductQuantity(productId);
    if (currentQuantity !== null) {
        if (increase) {
            await productRepo.increaseProductQuantity(productId, amount);
        } else {
            await productRepo.decreaseProductQuantity(productId, amount);
        }
    }
}

module.exports.clearCart = async function clearCart(userId) {
    const cartRepo = new CartRepository(conn);
    await cartRepo.clearCart(userId);
}

module.exports.completePurchase = async function completePurchase(userId) {
    const cartRepo = new CartRepository(conn);
    await cartRepo.completePurchase(userId);
}


module.exports.addToCart = async function addToCart(userId, productId, quantity  =1) {
    const productRepo = new ProductRepository(conn);
    const availableQuantity = await productRepo.getProductQuantity(productId);
    if (availableQuantity !== null && quantity > availableQuantity) {
        throw new Error('Not enough stock available.');
    }
    const cartRepo = new CartRepository(conn);
    await cartRepo.addToCart(userId, productId, quantity);
    if (availableQuantity !== null) {
        await productRepo.decreaseProductQuantity(productId, quantity);
    }
}

module.exports.removeFromCart = async function removeFromCart(userId, productId) {
    const cartRepo = new CartRepository(conn);
    const cartItem = await cartRepo.getCartItem(userId, productId);
    if (!cartItem) {
        throw new Error('Cart item not found.');
    }
    await cartRepo.removeFromCart(userId, productId);
    await updateProductQuantity(productId, cartItem.quantity, true);
}

/**
 * Retrieves all items in a specific user's cart.
 * 
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Array>} A promise that resolves to an array of cart items.
 * @throws {Error} Throws an error if the database operation fails.
 */
module.exports.getCartItems = async function getCartItems(userId) {
    const cartRepo = new CartRepository(conn);
    return await cartRepo.getCartItems(userId);
}

module.exports.checkout = async function checkout(userId, totalCost) {
    const cartRepo = new CartRepository(conn);
    const userRepo = new UserRepository(conn);
    const productRepo = new ProductRepository(conn);
    
    const user = await userRepo.retrieveById(userId);
    const cartItems = await cartRepo.getCartItems(userId);

    if (user.balance >= totalCost) {
        await userRepo.updateUserBalance(userId, -totalCost);
        
        for (const item of cartItems) {
            await productRepo.addProductToUser(userId, item.ID_Product, new Date(), item.quantity);
            await productRepo.decreaseProductQuantity(item.ID_Product, item.quantity);
        }
        
        await cartRepo.clearCart(userId);

        return { success: true };
    } else {
        return { success: false, message: 'Insufficient funds' };
    }
};

module.exports.getPurchasedProductsByUser = async function getPurchasedProductsByUser(username) {
    const productRepo = new ProductRepository(conn);
    const userRepo = new UserRepository(conn);
    const user = await userRepo.retrieve(username);
    return await productRepo.getPurchasedProductsByUser(user.ID);
};

module.exports.retrieveProductDetails = async function retrieveProductDetails(productId) {
    const productRepo = new ProductRepository(conn);
    return await productRepo.retrieve(productId);
}

module.exports.updateProductDetails = async function updateProductDetails(productData) {
    const productRepo = new ProductRepository(conn);
    return await productRepo.update(productData);
}

module.exports.deleteProduct = async function deleteProduct(productId) {
    const productRepo = new ProductRepository(conn);
    return await productRepo.delete(productId);
}

/**
 * Adds a new product to the database.
 * 
 * @param {Object} productData - An object containing the new product's information.
 * @returns {Promise<number>} The ID of the newly added product.
 * @throws {Error} If the operation fails.
 */
module.exports.addNewProduct = async function addNewProduct(productData) {
    const productRepo = new ProductRepository(conn);
    try {
        const productId = await productRepo.insert(productData);
        return productId;
    } catch (error) {
        console.error('Error in addNewProduct:', error);
        throw error;
    }
}

/**
 * Retrieves paginated users from the database.
 * 
 * @param {number} page - The current page number.
 * @param {number} pageSize - The number of users per page.
 * @param {string} searchTerm - The search term to filter users.
 * @returns {Promise<Object>} An object containing paginated users and pagination details.
 */
module.exports.getPaginatedUsers = async function(page = 1, pageSize = 10, searchTerm = '') {
    const userRepository = new UserRepository(conn);
    return await userRepository.getPaginatedUsers(page, pageSize, searchTerm);
};


/**
 * Removes a role from a user based on usernames and role names.
 * 
 * @param {string} username - The username of the user.
 * @param {string} roleName - The name of the role to remove.
 * @returns {Promise<void>}
 */
module.exports.removeRoleFromUser = async function removeRoleFromUser(username, roleName) {
    const userRepo = new UserRepository(conn);
    const roleRepo = new RoleRepository(conn);

    const user = await userRepo.retrieve(username);
    if (!user) {
        throw new Error(`User ${username} not found.`);
    }
    
    const role = await roleRepo.retrieve(roleName);
    if (!role) {
        throw new Error(`Role ${roleName} not found.`);
    }

    return await userRepo.removeRoleFromUser(user.ID, role.ID);
};