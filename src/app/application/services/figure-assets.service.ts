import { Injectable, inject } from '@angular/core';
import { FIGURE_ASSETS_BASE_URL } from '@application/config/figure-assets.config';
import { isStaticAsset } from '@application/config/figures';

const CACHE_NAME = 'papikapi-figures-v3';
const CACHE_ORIGIN = 'https://figures.invalid';
const REVISION_HEADER = 'x-figure-revision';
const INDEX_REVISION = 'index';
const INDEX_FILE = 'index.json';
const DRIVE_VIEWER = 'https://drive.google.com/file/d/';

interface FigureEntry {
  readonly revisions: Readonly<Record<string, string>>;
  readonly pdfId: string | null;
}

type Catalogue = ReadonlyMap<string, FigureEntry>;

interface CachedBlob {
  readonly blob: Blob;
  readonly revision: string;
}

@Injectable({ providedIn: 'root' })
export class FigureAssetsService {
  private readonly baseUrl = inject(FIGURE_ASSETS_BASE_URL);
  private readonly memory = new Map<string, CachedBlob>();
  private readonly objectUrls = new Map<string, string>();
  private catalogue: Promise<Catalogue> | null = null;

  async catalogueIds(): Promise<readonly string[]> {
    return [...(await this.loadCatalogue()).keys()];
  }

  async assetUrl(figureId: string, file: string): Promise<string> {
    const revision = (await this.entryOf(figureId)).revisions[file];
    if (!revision) throw new Error(`Figure asset not published: ${figureId}/${file}`);
    const key = `${CACHE_ORIGIN}/${figureId}/${file}`;
    const cached = await this.readCache(key);
    if (cached?.revision === revision) return this.objectUrlOf(key, cached.blob);
    const blob = await this.download(`${this.baseUrl}/${figureId}/${file}?v=${revision}`);
    await this.writeCache(key, { blob, revision });
    return this.objectUrlOf(key, blob);
  }

  async pdfUrl(figureId: string): Promise<string> {
    const { pdfId } = await this.entryOf(figureId);
    if (!pdfId) throw new Error(`Figure pdf not published: ${figureId}`);
    return `${DRIVE_VIEWER}${pdfId}/view`;
  }

  private async entryOf(figureId: string): Promise<FigureEntry> {
    const entry = (await this.loadCatalogue()).get(figureId);
    if (!entry) throw new Error(`Figure not published: ${figureId}`);
    return entry;
  }

  private loadCatalogue(): Promise<Catalogue> {
    this.catalogue ??= this.readCatalogue().catch((error: unknown) => {
      this.catalogue = null;
      throw error;
    });
    return this.catalogue;
  }

  private async readCatalogue(): Promise<Catalogue> {
    const key = `${CACHE_ORIGIN}/${INDEX_FILE}`;
    try {
      const blob = await this.download(`${this.baseUrl}/${INDEX_FILE}`, 'no-store');
      await this.writeCache(key, { blob, revision: INDEX_REVISION });
      return catalogueOf(JSON.parse(await blob.text()));
    } catch (error) {
      const cached = await this.readCache(key);
      if (!cached) throw error;
      return catalogueOf(JSON.parse(await cached.blob.text()));
    }
  }

  private async download(url: string, cache: RequestCache = 'default'): Promise<Blob> {
    const response = await fetch(url, { cache });
    if (!isStaticAsset(response)) throw new Error(`Figure download failed: ${response.status}`);
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

function catalogueOf(body: unknown): Catalogue {
  const entries = Array.isArray(body) ? body : [];
  return new Map(
    entries.flatMap((entry: unknown) => {
      if (!isRecord(entry) || typeof entry['id'] !== 'string') return [];
      return [[entry['id'], { revisions: revisionsOf(entry['files']), pdfId: pdfIdOf(entry['pdf']) }] as const];
    })
  );
}

function revisionsOf(files: unknown): Readonly<Record<string, string>> {
  if (!isRecord(files)) return {};
  return Object.fromEntries(
    Object.entries(files).flatMap(([name, file]) =>
      isRecord(file) && typeof file['rev'] === 'string' ? [[name, file['rev']] as const] : []
    )
  );
}

function pdfIdOf(pdf: unknown): string | null {
  return isRecord(pdf) && typeof pdf['id'] === 'string' ? pdf['id'] : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
