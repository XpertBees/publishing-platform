import path from "path";
import fs from "fs";
import multer, { type StorageEngine } from "multer";
import type { Paginated } from "@daily-pulse/shared";
import { Media } from "../models/Media";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeMedia } from "../utils/serializers";

/**
 * MediaService — local-disk uploads in dev (./uploads, overridable via
 * UPLOAD_DIR). Production should switch STORAGE_DRIVER to an S3-compatible
 * store; the service boundary stays the same.
 */
export function uploadDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./uploads");
}

function storage(): StorageEngine {
  const dir = uploadDir();
  fs.mkdirSync(dir, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}-${safe}`);
    },
  });
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]);

export const upload = multer({
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else
      cb(
        new ApiError(400, "UNSUPPORTED_FILE_TYPE", `File type "${file.mimetype}" is not allowed.`),
      );
  },
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: storage(),
});

export const MediaService = {
  async list(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const { count, rows } = await Media.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["createdAt", "DESC"]],
    });
    return paginate(
      rows.map((m) => serializeMedia(m.get({ plain: true }))),
      count,
      params,
    );
  },

  async createFromUpload(
    file: Express.Multer.File,
    uploadedBy: string | undefined,
    alt?: string,
  ): Promise<Record<string, unknown>> {
    const media = await Media.create({
      alt: alt ?? null,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: uploadedBy ?? null,
      url: `/uploads/${file.filename}`,
    });
    return serializeMedia(media.get({ plain: true }));
  },

  async remove(id: string): Promise<void> {
    const media = await Media.findByPk(id);
    if (!media) throw new ApiError(404, "MEDIA_NOT_FOUND", "Media item not found.");
    const filePath = path.join(uploadDir(), media.filename);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // File already gone — still remove the DB row.
    }
    await media.destroy();
  },
};
