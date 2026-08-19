import http from "node:http";
import worker from "./src/index.js";

const port = Number(process.env.PORT || 4173);
const env = {
  ALLOW_UNAUTHENTICATED: "true",
  DASHBOARD_USERNAME: process.env.DASHBOARD_USERNAME || "velocity",
  DASHBOARD_PASSWORD: process.env.DASHBOARD_PASSWORD || "",
};

const server = http.createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, value);
  }

  const webRequest = new Request(`http://${request.headers.host || `localhost:${port}`}${request.url}`, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : body,
  });
  const webResponse = await worker.fetch(webRequest, env, {});
  response.writeHead(webResponse.status, Object.fromEntries(webResponse.headers.entries()));
  response.end(Buffer.from(await webResponse.arrayBuffer()));
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`Velocity Lead Dashboard available on port ${port}\n`);
});
