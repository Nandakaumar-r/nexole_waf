import { RequestHandler, Request, Response, NextFunction } from 'express';
import http from 'http';
import https from 'https';
import { URL } from 'url';

// Helper to determine if the target uses HTTPS
function isHttps(target: string): boolean {
  return target.startsWith('https://');
}

// Create a middleware to proxy requests to a target server
export function createProxyMiddleware(target: string, wafMiddleware: RequestHandler): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First apply the WAF middleware
    wafMiddleware(req, res, (err) => {
      if (err) {
        return next(err);
      }
      
      // If the response has already been sent (e.g., request was blocked), don't proxy
      if (res.headersSent) {
        return;
      }
      
      try {
        // Parse the target URL
        const targetUrl = new URL(target);
        const options = {
          hostname: targetUrl.hostname,
          port: targetUrl.port || (isHttps(target) ? 443 : 80),
          path: req.originalUrl,
          method: req.method,
          headers: {
            ...req.headers,
            host: targetUrl.host,
          },
        };
        
        // Create the appropriate client
        const client = isHttps(target) ? https : http;
        
        // Make the proxy request
        const proxyReq = client.request(options, (proxyRes) => {
          // Copy the response headers
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
          
          // Pipe the response data
          proxyRes.pipe(res);
        });
        
        // Handle proxy errors
        proxyReq.on('error', (error) => {
          console.error('Proxy request error:', error);
          
          // Send an error response if headers not sent yet
          if (!res.headersSent) {
            res.status(502).json({
              error: 'Proxy Error',
              message: 'Unable to proxy the request to the target server',
              details: error.message
            });
          }
        });
        
        // If there's a request body, write it to the proxy request
        if (req.body) {
          proxyReq.write(JSON.stringify(req.body));
        }
        
        // End the proxy request
        proxyReq.end();
      } catch (error) {
        console.error('Proxy setup error:', error);
        next(error);
      }
    });
  };
}
