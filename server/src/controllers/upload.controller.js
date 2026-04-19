const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const env = require("../config/env");

const allowedMimeTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getUploadRoot() {
  return path.isAbsolute(env.uploadDir)
    ? env.uploadDir
    : path.resolve(__dirname, "../..", env.uploadDir);
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,([a-zA-Z0-9+/=\s]+)$/.exec(dataUrl || "");

  if (!match) {
    return null;
  }

  const mimeType = match[1].toLowerCase();
  const extension = allowedMimeTypes[mimeType];

  if (!extension) {
    return null;
  }

  return {
    mimeType,
    extension,
    buffer: Buffer.from(match[2].replace(/\s/g, ""), "base64"),
  };
}

async function saveUploadedImage(req, subdirectory) {
  const parsed = parseDataUrl(req.body?.dataUrl);

  if (!parsed) {
    const error = new Error("Upload a JPG, PNG, WebP, or GIF image.");
    error.statusCode = 400;
    throw error;
  }

  if (parsed.buffer.length > env.uploadMaxBytes) {
    const error = new Error(
      `Image must be ${Math.round(env.uploadMaxBytes / 1024 / 1024)} MB or smaller.`
    );
    error.statusCode = 413;
    throw error;
  }

  const uploadRoot = getUploadRoot();
  const targetDir = path.join(uploadRoot, subdirectory);
  await fs.mkdir(targetDir, { recursive: true });

  const randomId = crypto.randomBytes(10).toString("hex");
  const filename = `${req.user.id}-${Date.now()}-${randomId}.${parsed.extension}`;
  const filePath = path.join(targetDir, filename);

  await fs.writeFile(filePath, parsed.buffer);

  return {
    url: `/uploads/${subdirectory}/${filename}`,
    mimeType: parsed.mimeType,
    sizeBytes: parsed.buffer.length,
  };
}

const uploadProfilePhoto = async (req, res) => {
  try {
    const asset = await saveUploadedImage(req, "profile-photos");

    res.status(201).json({
      ...asset,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

const uploadSocialPostImage = async (req, res) => {
  try {
    const asset = await saveUploadedImage(req, "social-posts");

    res.status(201).json({
      ...asset,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

module.exports = {
  uploadProfilePhoto,
  uploadSocialPostImage,
};
