const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

if (process.argv.includes("--test")) {
  console.log("Node version:", process.version);
  try {
    const npmv = execSync("npm -v").toString().trim();
    console.log("npm version:", npmv);
  } catch (e) {
    console.log("npm version: (no disponible)");
  }
  console.log("OK: test completo.");
  process.exit(0);
}

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");

const server = http.createServer((req, res) => {
  // Normalize url
  let reqPath = decodeURIComponent(req.url.split("?")[0]);
  if (reqPath === "/") reqPath = "/index.html";
  const filePath = path.join(publicDir, reqPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }

    // Content type
    const ext = path.extname(filePath).toLowerCase();
    const map = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
    };

    res.writeHead(200, {
      "Content-Type": map[ext] || "application/octet-stream",
    });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(port, () => {
  console.log(`Servidor estático en http://localhost:${port}`);
});
