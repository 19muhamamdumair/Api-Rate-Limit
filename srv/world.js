const Limiter = require('limiter').RateLimiter;

module.exports = async function () {
  const requestCounts = {};
  const blockedIPs = {};

  this.on('READ', 'Customer', async (req, next) => {
    try {
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      console.log(`Request from IP: ${clientIP}`);

      const key = `ratelimit:${clientIP}`;

      if (!requestCounts[key]) {
        requestCounts[key] = new Limiter({
          tokensPerInterval: 100,
          interval: 'hour',
        });
      }

      console.log(`Tokens remaining for ${clientIP}: ${requestCounts[key].getTokensRemaining()}`);

      if (blockedIPs[clientIP]) {
        const error = new Error(`You are temporarily blocked. Try again later.`);
        error.status = 429;
        throw error;
      }

      if (!requestCounts[key].tryRemoveTokens(1)) {
        blockedIPs[clientIP] = true;
        console.log(`Rate limit exceeded. Blocking IP ${clientIP} for 30 seconds.`);
        setTimeout(() => {
          delete blockedIPs[clientIP];
          delete requestCounts[key]
        }, 30000);

        const error = new Error('Rate limit for your IP exceeded. You are temporarily blocked. Please try again later.');
        error.status = 429;
        throw error;
      }

      const customers = await next();

      return customers;
    } catch (error) {
      console.error('Error in rate limiting middleware:', error);
      throw error;
    }
  });
};
