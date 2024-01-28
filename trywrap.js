// trywrap.js

/**
 * Wraps a promise to always return a tuple containing the resolved data and any caught errors.
 * 
 * This function takes a promise and returns a tuple: [data, error]. 
 * If the promise resolves successfully, the function returns the resolved value as the first element of the tuple, 
 * and null as the second element. If the promise is rejected, the first element is null and the second is the caught error.
 * 
 * @param {Promise} promise - The promise to be wrapped.
 * @returns {Promise<Array>} A promise that resolves to a tuple. 
 * The first element of the tuple is the resolved data from the promise, or null if the promise is rejected.
 * The second element is null if the promise resolves, or the caught error if the promise is rejected.
 */
async function trywrap(promise) {
    try {
        const data = await promise;
        return [data, null];
    } catch (throwable) {
        if (throwable instanceof Error) return [null, throwable];

        throw throwable;
    }
};

module.exports = trywrap;