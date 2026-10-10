import { Injectable, inject } from '@angular/core';
import { FIGURE_DRIVE_CONFIG_TOKEN } from '@application/config/figure-drive.config';

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const VIEWER_URL = 'https://drive.google.com/file/d/';
const CACHE_NAME = 'papikapi-figures-v2';
const CACHE_ORIGIN = 'https://figures.invalid';
const REVISION_HEADER = 'x-figure-revision';
const INDEX_REVISION = 'index';

interface DriveFile {
  readonly id: string;
  readonly rev: string;
}

type DriveCatalogue = ReadonlyMap<string, Readonly<Record<string, DriveFile>>>;

interface CachedBlob {
  readonly blob: Blob;
  readonly revision: string;
}

@Injectable({ providedIn: 'root' })
export class FigureDriveService {
  private readonly config = inject(FIGURE_DRIVE_CONFIG_TOKEN);
  private readonly memory = new Map<string, CachedBlob>();
  private readonly objectUrls = new Map<string, string>();
  private catalogue: Promise<DriveCatalogue> | null = null;

  isConfigured(): boolean {
    return this.config.indexFileId !== '' && this.config.apiKey !== '';
  }

  async catalogueIds(): Promise<readonly string[]> {
    return [...(await this.loadCatalogue()).keys()];
  }

  async assetUrl(figureId: string, file: string): Promise<string> {
    const driveFile = await this.fileOf(figureId, file);
    const key = `${CACHE_ORIGIN}/${figureId}/${file}`;
    const cached = await this.readCache(key);
    if (cached?.revision === driveFile.rev) return this.objectUrlOf(key, cached.blob);
    const blob = await this.download(driveFile.id);
    await this.writeCache(key, { blob, revision: driveFile.rev });
    return this.objectUrlOf(key, blob);
  }

  async viewUrl(figureId: string, file: string): Promise<string> {
    return `${VIEWER_URL}${(await this.fileOf(figureId, file)).id}/view`;
  }

  private async fileOf(figureId: string, file: string): Promise<DriveFile> {
    const found = (await this.loadCatalogue()).get(figureId)?.[file];
    if (!found) throw new Error(`Drive asset not published: ${figureId}/${file}`);
    return found;
  }

  private loadCatalogue(): Promise<DriveCatalogue> {
    if (!this.isConfigured()) return Promise.reject(new Error('Drive figures are not configured'));
    this.catalogue ??= this.readCatalogue().catch((error: unknown) => {
      this.catalogue = null;
      throw error;
    });
    return this.catalogue;
  }

  private async readCatalogue(): Promise<DriveCatalogue> {
    const key = `${CACHE_ORIGIN}/index.json`;
    try {
      const blob = await this.download(this.config.indexFileId);
      await this.writeCache(key, { blob, revision: INDEX_REVISION });
      return catalogueOf(JSON.parse(await blob.text()));
    } catch (error) {
      const cached = await this.readCache(key);
      if (!cached) throw error;
      return catalogueOf(JSON.parse(await cached.blob.text()));
    }
  }

  private async download(fileId: string): Promise<Blob> {
    const url = `${DRIVE_FILES}/${encodeURIComponent(fileId)}?alt=media&key=${this.config.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Drive download failed: ${response.status}`);
    return response.blob();
  }

  private async readCache(key: string): Promise<CachedBlob | null> {
    if (typeof caches === 'undefined') return this.memory.get(key) ?? null;
    const response = await (await caches.open(CACHE_NAME)).match(key);
    if (!response) return null;
    return { blob: await response.blob(), revision: response.headers.get(REVISION_HEADER) ?? '' };
  }

  private async writeCache(key: string, entry: CachedBlob): Promise<void> {
    if (typeof caches === 'undefined') {
      this.memory.set(key, entry);
      return;
    }
    const headers = { [REVISION_HEADER]: entry.revision, 'content-type': entry.blob.type };
    const bytes = await entry.blob.arrayBuffer();
    await (await caches.open(CACHE_NAME)).put(key, new Response(bytes, { headers }));
  }

  private objectUrlOf(key: string, blob: Blob): string {
    const previous = this.objectUrls.get(key);
    if (previous) URL.revokeObjectURL(previous);
    const created = URL.createObjectURL(blob);
    this.objectUrls.set(key, created);
    return created;
  }
}

function catalogueOf(body: unknown): DriveCatalogue {
  const entries = Array.isArray(body) ? body : [];
  return new Map(
    entries.flatMap((entry: unknown) => {
      if (!isRecord(entry) || typeof entry['id'] !== 'string') return [];
      return [[entry['id'], filesOf(entry['files'])] as const];
    })
  );
}

function filesOf(value: unknown): Readonly<Record<string, DriveFile>> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([name, file]) => (isDriveFile(file) ? [[name, file] as const] : []))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDriveFile(value: unknown): value is DriveFile {
  return isRecord(value) && typeof value['id'] === 'string' && typeof value['rev'] === 'string';
}
