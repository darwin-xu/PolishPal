// Simple Cloudflare Pages function that handles API routes
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Handle API routes
  if (url.pathname.startsWith('/api/')) {
    // For now, return a simple response
    // You'll need to implement your API logic here
    return new Response(JSON.stringify({
      message: "PolishPal API is running on Cloudflare!",
      path: url.pathname,
      method: request.method
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  // For other routes, let Pages handle static files
  return new Response(null, { status: 404 });
}
