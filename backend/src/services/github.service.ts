import axios from "axios";
import { AppError } from "../utils/AppError";

export interface RepoDetails {
  owner: string;
  repo: string;
}

export function parseGithubUrl(url: string): RepoDetails {
  try {
    const cleanUrl = url.replace(/\/$/, "");
    const parsed = new URL(cleanUrl);

    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
      throw new Error();
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      throw new Error();
    }

    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    throw new AppError("URL do GitHub inválida ou malformada", 400, "INVALID_GITHUB_URL");
  }
}

export async function fetchRepoZipball(owner: string, repo: string): Promise<Buffer> {
  // Tenta baixar diretamente da codeload do GitHub (evita limites estritos da REST API)
  const codeloadUrl = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/main`;
  const codeloadMasterUrl = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/master`;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CodePilot/1.0",
    Accept: "application/zip, application/octet-stream",
  };

  try {
    const response = await axios.get(codeloadUrl, {
      responseType: "arraybuffer",
      headers,
      timeout: 20000,
    });
    return Buffer.from(response.data);
  } catch {
    // Se a branch principal não for 'main', tenta 'master'
    try {
      const responseMaster = await axios.get(codeloadMasterUrl, {
        responseType: "arraybuffer",
        headers,
        timeout: 20000,
      });
      return Buffer.from(responseMaster.data);
    } catch (err: any) {
      console.error("Erro ao baixar repositório:", err.message);

      if (err.response?.status === 404) {
        throw new AppError("Repositório não encontrado ou privado", 404, "REPO_NOT_FOUND");
      }

      throw new AppError(
        `Erro ao baixar repositório do GitHub: ${err.message}`,
        502,
        "GITHUB_FETCH_ERROR"
      );
    }
  }
}