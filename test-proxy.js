const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  target: 'https://news.google.com',
  changeOrigin: true,
  followRedirects: true
});

const http = require('http');
http.createServer((req, res) => {
  proxy.web(req, res);
}).listen(8081);

console.log("Listening on 8081");
