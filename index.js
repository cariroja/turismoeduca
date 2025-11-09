const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require('os');

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

function getLocalIPs() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // prefer IPv4 and skip internal addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
}

// Bind explicitly to all interfaces so other devices on the LAN can connect.
server.listen(port, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log(`Servidor estático disponible en:`);
  console.log(`  http://localhost:${port}`);
  if (ips.length) {
    for (const ip of ips) console.log(`  http://${ip}:${port}`);
  } else {
    console.log('  (no se detectaron IPs LAN automáticamente)');
  }
});
