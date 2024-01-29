var mssql = require('mssql');
var { deleteUserAndRoles } = require('./db');
var { UserRepository, RoleRepository } = require('./repositories');

var config = 'server=localhost,1433;database=LoggedInUsersDB;user id=superadmin;password=superadmin;TrustServerCertificate=true';
var conn = new mssql.ConnectionPool(config);

// (async function () {
//     try {
        
//         console.log(7);
//         await conn.connect();
//         const userRepo = new UserRepository(conn);

//         var userID = 7;
//         console.log(7);
//         const roles = await userRepo.getUserRoles(userID);
//         console.log(roles);
//         for (const role of roles) {
//             console.log(role);
//         }
//     } catch (error) {
//         console.error(error);
//         throw error;
//     } finally {
//         if (conn.connected) {
//             conn.close();
//         }
//     }
// })();

// (async function () {
//     try {
//         var userID = 7;
//         const roles = await deleteUserAndRoles(userID);
//         console.log(roles);
//     } catch (error) {
//         console.error(error);
//         throw error;
//     } finally {
//         if (conn.connected) {
//             conn.close();
//         }
//     }
// })();

o1 = {k1: 1, k2: 2}
o2 = {k2: "2", k3: 3}
console.log({...o1, ...o2});