import path from "path";
import fs from "fs";

export const secureFileServe = (req, res, next) => {
  const { folder, file } = req.params;

  // 1. Strict regex validation to utterly eliminate Path Traversal vulnerabilities (LFI)
  // Folder must be alphanumeric (e.g., 'image', 'videos', 'file')
  // File must be alphanumeric with dots/dashes
  if (!/^[a-zA-Z0-9_-]+$/.test(folder) || !/^[a-zA-Z0-9_.-]+$/.test(file)) {
    return res.status(400).send("Invalid file path requested.");
  }

  // 2. Resolve absolute path securely
  // __dirname here depends on whether it's called from index.js or middlewares folder
  // Assuming it's imported in index.js, we resolve relative to the process cwd or a known fixed path.
  // We'll pass the base uploads dir dynamically.
  const baseUploadsDir = path.resolve(process.cwd(), "uploads");
  const filePath = path.join(baseUploadsDir, folder, file);

  // Double check that the resolved path is actually inside the uploads directory
  if (!filePath.startsWith(baseUploadsDir)) {
    return res.status(403).send("Access denied.");
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found.");
  }

  // 3. Prevent XSS: Force non-media files to be downloaded as attachments
  const ext = path.extname(file).toLowerCase();
  const inlineExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".ogg"];
  
  if (!inlineExtensions.includes(ext)) {
    // If it's a document, HTML, SVG, or unknown, force download so the browser never executes it
    res.setHeader("Content-Disposition", `attachment; filename="${file}"`);
  } else {
    res.setHeader("Content-Disposition", `inline; filename="${file}"`);
  }

  // 4. Inject heavy security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline';"); // Completely disables JS execution
  res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

  // Serve the file safely
  res.sendFile(filePath);
};
