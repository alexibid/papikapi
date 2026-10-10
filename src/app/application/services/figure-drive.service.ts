import { Injectable, inject } from '@angular/core';
import { FIGURE_DRIVE_CONFIG_TOKEN } from '@application/config/figure-drive.config';

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const FIGURES_FOLDER = 'figures';
const CATALOGUE_FILE = 'index.json';
const CACHE_NAME = 'papikapi-figures-v1';
const CACHE_ORIGIN = 'https://figures.invalid';
const MODIFIED_HEADER = 'x-drive-modified';

interface DriveFile {
  readonly id: string;
  readonly modifiedTime: string;
}

interface CachedBlob {
  readonly blob: Blob;
  readonly modified: string;
}

@Injectable({ providedIn: 'root' })
export class FigureDriveService {
  private readonly config = inject(FIGURE_DRIVE_CONFIG_TOKEN);
  private readonly folders = new Map<string, Promise<string | null>>();
  private readonly memory = new Map<string, CachedBlob>();
  private readonly objectUrls = new Map<string, string>();

  isConfigured(): boolean {
    return this.config.rootFolderId !== '' && this.config.apiKey !== '';
  }

  async catalogueIds(): Promise<readonly string[]> {
    const blob = await this.blobFor(`${CACHE_ORIGIN}/${CATALOGUE_FILE}`, async () => {
      const folder = await this.figuresFolderId();
      return folder ? this.findFile(folder, CATALOGUE_FILE, false) : null;
    });
    return idsOf(JSON.parse(await blob.text()));
  }

  async assetUrl(figureId: string, file: string): Promise<string> {
    const key = `${CACHE_ORIGIN}/${figureId}/${file}`;
    const blob = await this.blobFor(key, () => this.locate(figureId, file));
    return this.objectUrlOf(key, blob);
  }

  async viewUrl(figureId: string, file: string): Promise<string> {
    const found = await this.locate(figureId, file);
    if (!found) throw new Error(`Drive asset not found: ${figureId}/${file}`);
    return `https://drive.google.com/file/d/${found.id}/view`;
  }

  private async locate(figureId: string, file: string): Promise<DriveFile | null> {
    const folder = await this.figureFolderId(figureId);
    return folder ? this.findFile(folder, file, false) : null;
  }

  private async blobFor(key: string, locate: () => Promise<DriveFile | null>): Promise<Blob> {
    if (!this.isConfigured()) throw new Error('Drive figures are not configured');
    const remote = await locate().catch(() => null);
    const cached = await this.readCache(key);
    if (cached && (!remote || cached.modified === remote.modifiedTime)) return cached.blob;
    if (!remote) throw new Error(`Drive asset unavailable: ${key}`);
    const blob = await this.download(remote.id);
    await this.writeCache(key, { blob, modified: remote.modifiedTime });
    return blob;
  }

  private figuresFolderId(): Promise<string | null> {
    return this.folderId(FIGURES_FOLDER, this.config.rootFolderId, FIGURES_FOLDER);
  }

  private async figureFolderId(figureId: string): Promise<string | null> {
    const figures = await this.figuresFolderId();
    return figures ? this.folderId(`${FIGURES_FOLDER}/${figureId}`, figures, figureId) : null;
  }

  private folderId(path: string, parentId: string, name: string): Promise<string | null> {
    const known = this.folders.get(path);
    if (known) return known;
    const lookup = this.findFile(parentId, name, true)
      .then((found) => found?.id ?? null)
      .catch((error: unknown) => {
        this.folders.delete(path);
        throw error;
      });
    this.folders.set(path, lookup);
    return lookup;
  }

  private async findFile(parentId: string, name: string, folder: boolean): Promise<DriveFile | null> {
    const kind = folder ? ` and mimeType='${FOLDER_MIME}'` : '';
    const query = `'${parentId}' in parents and name='${escaped(name)}'${kind} and trashed=false`;
    const params = new URLSearchParams({
      q: query,
      fields: 'files(id,modifiedTime)',
      pageSize: '1',
      key: this.config.apiKey,
    });
    const response = await fetch(`${DRIVE_FILES}?${params.toString()}`);
    if (!response.ok) throw new Error(`Drive lookup failed: ${response.status}`);
    return firstFileOf(await response.json());
  }

  private async download(fileId: string): Promise<Blob> {
    const response = await fetch(`${DRIVE_FILES}/${fileId}?alt=media&key=${this.config.apiKey}`);
    if (!response.ok) throw new Error(`Drive download failed: ${response.status}`);
    return response.blob();
  }

  private async readCache(key: string): Promise<CachedBlob | null> {
    if (typeof caches === 'undefined') return this.memory.get(key) ?? null;
    const response = await (await caches.open(CACHE_NAME)).match(key);
    if (!response) return null;
    return { blob: await response.blob(), modified: response.headers.get(MODIFIED_HEADER) ?? '' };
  }

  private async writeCache(key: string, entry: CachedBlob): Promise<void> {
    if (typeof caches === 'undefined') {
      this.memory.set(key, entry);
      return;
    }
    const headers = { [MODIFIED_HEADER]: entry.modified };
    await (await caches.open(CACHE_NAME)).put(key, new Response(entry.blob, { headers }));
  }

  private objectUrlOf(key: string, blob: Blob): string {
    const previous = this.objectUrls.get(key);
    if (previous) URL.revokeObjectURL(previous);
    const created = URL.createObjectURL(blob);
    this.objectUrls.set(key, created);
    return created;
  }
}

function escaped(name: string): string {
  return name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function firstFileOf(body: unknown): DriveFile | null {
  if (typeof body !== 'object' || body === null || !('files' in body)) return null;
  const [first] = Array.isArray(body.files) ? body.files : [];
  return isDriveFile(first) ? first : null;
}

function isDriveFile(value: unknown): value is DriveFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'modifiedTime' in value &&
    typeof value.modifiedTime === 'string'
  );
}

function idsOf(body: unknown): readonly string[] {
  if (!Array.isArray(body)) return [];
  return body.flatMap((entry: unknown) =>
    typeof entry === 'object' && entry !== null && 'id' in entry && typeof entry.id === 'string'
      ? [entry.id]
      : []
  );
}
