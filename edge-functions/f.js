export default async (request) => {
  const targetUrl = new URL("https://gfork.dahi.icu" + request.url.pathname + request.url.search);

  const newRequest = new Request(targetUrl, {
    method: request.method, 
    headers: request.headers,
    body: request.body,    
    redirect: "manual",    
  });

  const response = await fetch(newRequest);

  return response;
};
