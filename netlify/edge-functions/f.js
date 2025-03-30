export default async (request) => {
  const targetUrl = new URL(request.url.pathname + request.url.search, "https://gfork.dahi.icu");

  // 克隆请求，确保可以读取 body
  const newRequest = new Request(targetUrl, {
    method: request.method, // 保持原始方法（GET/POST/PUT等）
    headers: request.headers,
    body: request.body,    // 透传请求体
    redirect: "manual",    // 不自动跟随 3xx
  });

  // 移除可能干扰的 headers
  newRequest.headers.delete("host");

  try {
    const response = await fetch(newRequest);
    return response;
  } catch (error) {
    return new Response("Proxy Error: " + error.message, { status: 502 });
  }
};
