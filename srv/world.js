const Limiter = require('limiter').RateLimiter;

module.exports = async function () {
  const requestCounts = {};

  this.on('READ', 'Customer', async (req, next) => {
    try {
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      const key = `ratelimit:${clientIP}`;

      if (!requestCounts[key]) {
        requestCounts[key] = new Limiter({
          tokensPerInterval: 3, // Maximum 3 requests per interval per IP
          interval: 'minute', // The time interval for rate limiting
        });
      }

      if (!requestCounts[key].tryRemoveTokens(1)) {
        const error = new Error('Rate limit for your IP exceeded. Please try again later.');
        error.status = 429;
        throw error;
      }

      console.log("testing");
      const customers = await next();

      return customers;
    } catch (error) {
      throw error;
    }
  });
};
