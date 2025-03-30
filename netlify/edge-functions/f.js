export default async (request) => {
  try {
    // Validate request method
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!allowedMethods.includes(request.method)) {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Build target URL safely
    let targetUrl;
    try {
      targetUrl = new URL(request.url.pathname + request.url.search, 'https://gfork.dahi.icu');
    } catch (err) {
      console.error('Invalid URL construction:', err);
      return new Response('Bad Request: Invalid URL', { status: 400 });
    }

    // Clone and filter headers
    const headers = new Headers(request.headers);
    // Remove headers that could cause issues
    headers.delete('host');
    headers.delete('origin');
    headers.delete('referer');
    // Add any custom headers if needed
    headers.set('x-proxied-by', 'netlify-edge');

    // Log request for debugging
    console.log('Proxying request to:', targetUrl.toString(), {
      method: request.method,
      headers: Object.fromEntries(headers.entries())
    });

    // Make the proxied request with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    let response;
    try {
      response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.body,
        redirect: 'manual',
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    // Handle redirects manually if needed
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        return new Response(null, {
          status: response.status,
          headers: { 'Location': location }
        });
      }
    }

    // Clone response to modify headers if needed
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set('x-proxied-by', 'netlify-edge');
    
    return modifiedResponse;

  } catch (error) {
    console.error('Proxy error:', error);
    
    if (error.name === 'AbortError') {
      return new Response('Gateway Timeout', { status: 504 });
    }
    
    return new Response('Bad Gateway', { 
      status: 502,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
