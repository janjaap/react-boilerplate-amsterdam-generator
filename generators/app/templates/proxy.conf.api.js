const PROXY_CONFIG =
  {
    '/api/*': {
      target: 'http://acc.data.amsterdam.nl/<%= proxyDir %>',
      pathRewrite: { '^/api/': '' },
      secure: false,
      changeOrigin: true,
      logLevel: 'debug'
    }
  };
module.exports = PROXY_CONFIG;
