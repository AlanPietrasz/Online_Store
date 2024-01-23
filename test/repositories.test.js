var assert = require('assert');
var sinon = require('sinon');
var mssql = require('mssql');
var { UserRepository, RoleRepository } = require('../repositories');

describe('UserRepository', function() {
    let userRepo;
    let stubRequest;

    before(function() {
        // Mock mssql.Request class entirely
        stubRequest = sinon.stub(mssql, 'Request').callsFake(function() {
            this.input = sinon.stub().returnsThis(); // For chaining
            this.query = sinon.stub(); // Stub the query method
        });

        // Create a stub for mssql.ConnectionPool
        sinon.stub(mssql, 'ConnectionPool').callsFake(() => {
            return {
                connect: sinon.stub().resolves(),
                close: sinon.stub().resolves(),
                request: () => new mssql.Request() // Return the mock Request
            };
        });

        // Initialize the UserRepository with the mocked connection
        userRepo = new UserRepository(new mssql.ConnectionPool());
    });

    after(function() {
        // Restore the stubbed methods
        sinon.restore();
    });

    describe('retrieve()', function() {
        it('should retrieve users', async function() {
            // Setup mock response
            const mockUsers = [{ Username: 'user1' }, { Username: 'user2' }];
            stubRequest.resolves({ recordset: mockUsers }); // Change stubRequest.prototype.query.resolves to stubRequest.resolves

            // Execute the method
            const result = await userRepo.retrieve();

            // Perform assertions
            assert.equal(result.length, 2);
            assert.deepEqual(result, mockUsers);
        });
    });

    // ... other tests for UserRepository methods
});

describe('RoleRepository', function() {
    // Similar setup and tests for RoleRepository
});
