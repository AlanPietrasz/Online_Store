// functions.js

const functionMap = {
    Factorial: function Factorial(n) {
      if (n < 2) return 1;
      return n * Factorial(n - 1);
    },
    Fib: function Fib(n) {
      let a = 0, b = 1, f = 1;
      for (let i = 2; i <= n; i++) {
        f = a + b;
        a = b;
        b = f;
      }
      return f;
    }
  };
  
  module.exports.parseProductName = function parseProductName(productName) {
    if (productName.includes('(n)')) {
      const functionNameMatch = productName.match(/(.+?)\s*\(\s*n\s*\)/);
      if (functionNameMatch && functionNameMatch[1]) {
        const functionName = functionNameMatch[1].trim();
  
        const foundFunction = functionMap[functionName];
  
        if (foundFunction && typeof foundFunction === 'function') {
          return { type: 'function', value: foundFunction };
        } else {
          throw new Error(`Function ${functionName} does not exist or is invalid.`);
        }
      } else {
        throw new Error('Cannot find function name in the product');
      }
    } else if (productName.includes('Multiplier')) {
      const match = productName.match(/Multiplier\s*\+\s*(\d+)/i);
      if (match && match[1]) {
        return { type: 'multiplier', value: parseInt(match[1], 10) };
      }
    }
    return { type: null, value: null };
  }
  