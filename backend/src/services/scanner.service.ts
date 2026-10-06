import admZip from "adm-zip";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { fetchRepoZipball, parseGithubUrl } from "./github.service";
import { AppError } from "../utils/AppError";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  "vendor",
  "target",
  "bin",
  "obj",
  ".idea",
  ".vscode"
]);

const IGNORED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".pdf", ".exe", ".dll",
  ".so", ".dylib", ".zip", ".tar", ".gz", ".7z", ".mp4", ".mp3", ".woff",
  ".woff2", ".ttf", ".eot", ".lock"
]);

const MAX_FILE_SIZE_BYTES = 100 * 1024; // 100 KB max por arquivo

export interface ScannedFile {
  relativePath: string;
  content: string;
  linesCount: number;
  sizeBytes: number;
}

export interface ScanResult {
  owner: string;
  repo: string;
  totalFilesCount: number;
  totalLinesCount: number;
  totalSizeBytes: number;
  relevantFiles: ScannedFile[];
}

export async function scanRepository(githubUrl: string): Promise<ScanResult> {
  const { owner, repo } = parseGithubUrl(githubUrl);
  const zipBuffer = await fetchRepoZipball(owner, repo);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `codepilot-${owner}-${repo}-`));

  try {
    const zip = new admZip(zipBuffer);
    zip.extractAllTo(tempDir, true);

    const entries = await fs.readdir(tempDir, { withFileTypes: true });
    const rootExtractDir = entries.find((e) => e.isDirectory());
    const targetDir = rootExtractDir ? path.join(tempDir, rootExtractDir.name) : tempDir;

    const scannedFiles: ScannedFile[] = [];
    let totalFiles = 0;
    let totalLines = 0;
    let totalSize = 0;

    async function walk(dir: string, currentRelPath = "") {
      const files = await fs.readdir(dir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        const relPath = path.join(currentRelPath, file.name).replace(/\\/g, "/");

        if (file.isDirectory()) {
          if (!IGNORED_DIRS.has(file.name)) {
            await walk(fullPath, relPath);
          }
          continue;
        }

        const ext = path.extname(file.name).toLowerCase();
        if (IGNORED_EXTENSIONS.has(ext)) {
          continue;
        }

        const stats = await fs.stat(fullPath);
        if (stats.size > MAX_FILE_SIZE_BYTES) {
          continue;
        }

        totalFiles++;
        totalSize += stats.size;

        try {
          const content = await fs.readFile(fullPath, "utf-8");
          const lines = content.split("\n").length;
          totalLines += lines;

          scannedFiles.push({
            relativePath: relPath,
            content,
            linesCount: lines,
            sizeBytes: stats.size,
          });
        } catch {
          // Ignora arquivos binários ou sem suporte a utf-8
        }
      }
    }

    await walk(targetDir);

    return {
      owner,
      repo,
      totalFilesCount: totalFiles,
      totalLinesCount: totalLines,
      totalSizeBytes: totalSize,
      relevantFiles: scannedFiles,
    };
  } finally {
    // Apaga a pasta temporária de forma nativa e segura
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => null);
  }
}