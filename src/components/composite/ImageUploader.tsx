import React, { useEffect, useRef, useState } from 'react';

export interface ImageUploaderProps extends React.HTMLAttributes<HTMLElement> {
  uploadEndpoint?: string;
  listEndpoint?: string;
  statusBase?: string;
  batchStatusEndpoint?: string;
  beginUploadEndpoint?: string;
  chunkEndpointBase?: string;
  completeEndpointBase?: string;
  accept?: string;
  maxSizeMb?: number;
  memberMaxSizeMb?: number;
  chunkSizeMb?: number;
  title?: string;
  description?: string;
  chooseLabel?: string;
  insertLabel?: string;
  insertAllLabel?: string;
  insertedLabel?: string;
  targetTextareaSelector?: string;
  compact?: boolean;
  copyLabel?: string;
  copyAllLabel?: string;
  copiedLabel?: string;
  copyAllCopiedLabel?: string;
  processingLabel?: string;
  readyLabel?: string;
  deleteLabel?: string;
  emptyLabel?: string;
}

type AssetStatus = 'uploading' | 'queued' | 'processing' | 'ready' | 'failed';

interface ImageAsset {
  id: number;
  hash: string;
  original_filename: string;
  mime_type?: string;
  status: AssetStatus;
  display_url?: string | null;
  thumb_url?: string | null;
  embed_html?: string | null;
  error_code?: string | null;
  width?: number | null;
  height?: number | null;
  processing_stage?: string | null;
  progress_percent?: number | null;
}

interface PendingPreview {
  id: string;
  name: string;
  url: string;
  progress: number;
  stage: string;
  error?: string;
}

interface G7Api {
  get: (url: string) => Promise<unknown>;
  post: (url: string, body: FormData, options?: Record<string, unknown>) => Promise<unknown>;
  delete: (url: string) => Promise<unknown>;
}

function getApi(): G7Api | null {
  return ((window as Window & { G7Core?: { api?: G7Api } }).G7Core?.api ?? null);
}

function unwrap<T>(response: unknown): T {
  const value = response as { data?: { data?: T } | T };
  const outer = value?.data;

  if (outer && typeof outer === 'object' && 'data' in outer) {
    return (outer as { data: T }).data;
  }

  return outer as T;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const responseData = (error as { response?: { data?: unknown }; data?: unknown }).response?.data
      ?? (error as { data?: unknown }).data;

    if (typeof responseData === 'object' && responseData !== null) {
      const responseMessage = (responseData as { message?: unknown }).message;
      if (typeof responseMessage === 'string' && responseMessage) return responseMessage;

      const errors = (responseData as { errors?: unknown }).errors;
      if (typeof errors === 'object' && errors !== null) {
        for (const value of Object.values(errors as Record<string, unknown>)) {
          if (typeof value === 'string' && value) return value;
          if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) return value[0];
        }
      }
    }

    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function unwrapAssets(response: unknown): ImageAsset[] {
  const value = unwrap<ImageAsset[] | { data?: ImageAsset[] }>(response);
  return Array.isArray(value) ? value : (value?.data ?? []);
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;

  const extension = file.name.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp'].includes(extension ?? '');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  uploadEndpoint = '/api/modules/codingfor-imagehost/images',
  listEndpoint = '/api/modules/codingfor-imagehost/images',
  statusBase = '/api/modules/codingfor-imagehost/images/',
  batchStatusEndpoint = '/api/modules/codingfor-imagehost/images/status',
  beginUploadEndpoint = '/api/modules/codingfor-imagehost/images/uploads',
  chunkEndpointBase = '/api/modules/codingfor-imagehost/images/uploads/',
  completeEndpointBase = '/api/modules/codingfor-imagehost/images/uploads/',
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMb = 50,
  memberMaxSizeMb = 250,
  chunkSizeMb = 16,
  title = 'Image Embed',
  description = 'Upload images and copy their WebP Embed code.',
  chooseLabel = 'Choose images',
  insertLabel = 'Insert in post',
  insertAllLabel = 'Insert all in post',
  insertedLabel = 'Inserted',
  targetTextareaSelector = '',
  compact = false,
  copyLabel = 'Copy Embed',
  copyAllLabel = 'Copy batch Embed',
  copiedLabel = 'Copied',
  copyAllCopiedLabel = 'Batch copied',
  processingLabel = 'Converting…',
  readyLabel = 'Ready',
  deleteLabel = 'Delete',
  emptyLabel = 'No uploaded images yet.',
  className = '',
  ...rest
}) => {
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [pending, setPending] = useState<PendingPreview[]>([]);
  const [batchAssetIds, setBatchAssetIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [copiedHash, setCopiedHash] = useState('');
  const [insertedHash, setInsertedHash] = useState('');
  const [batchCopied, setBatchCopied] = useState(false);
  const [batchInserted, setBatchInserted] = useState(false);
  const previewUrls = useRef(new Set<string>());
  const chunkSize = Math.max(1, chunkSizeMb) * 1024 * 1024;

  const updatePending = (id: string, patch: Partial<PendingPreview>): void => {
    setPending((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const mergeAssets = (nextAssets: ImageAsset[]): void => {
    setAssets((current) => {
      const byId = new Map(current.map((asset) => [asset.id, asset]));
      nextAssets.forEach((asset) => byId.set(asset.id, asset));
      return Array.from(byId.values()).sort((a, b) => b.id - a.id);
    });
  };

  useEffect(() => {
    const api = getApi();
    if (!api) return;

    api.get(listEndpoint)
      .then((response) => mergeAssets(unwrapAssets(response)))
      .catch((requestError: unknown) => setError(getErrorMessage(requestError, 'Unable to load media.')));
  }, [listEndpoint]);

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  const refreshAssets = async (ids: number[]): Promise<ImageAsset[]> => {
    const api = getApi();
    if (!api) throw new Error('G7 API is not available.');

    for (let attempt = 0; attempt < 300; attempt += 1) {
      const response = await api.get(`${batchStatusEndpoint}?ids=${ids.join(',')}`);
      const current = unwrapAssets(response);
      mergeAssets(current);
      if (current.length === ids.length && current.every((asset) => asset.status === 'ready' || asset.status === 'failed')) {
        return current;
      }

      await wait(2000);
    }

    throw new Error('Media conversion timed out.');
  };

  const uploadDirect = async (file: File, pendingId: string): Promise<ImageAsset> => {
    const api = getApi();
    if (!api) throw new Error('G7 API is not available.');

    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(uploadEndpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event: { loaded: number; total?: number }) => {
        if (event.total) updatePending(pendingId, { progress: Math.round((event.loaded / event.total) * 20), stage: 'uploading' });
      },
    });
    const asset = unwrap<ImageAsset>(response);
    mergeAssets([asset]);
    setBatchAssetIds((current) => [...new Set([...current, asset.id])]);
    return asset;
  };

  const uploadChunked = async (file: File, pendingId: string): Promise<ImageAsset> => {
    const api = getApi();
    if (!api) throw new Error('G7 API is not available.');

    const totalChunks = Math.ceil(file.size / chunkSize);
    const beginForm = new FormData();
    beginForm.append('filename', file.name);
    beginForm.append('mime_type', file.type || 'application/octet-stream');
    beginForm.append('size', String(file.size));
    beginForm.append('total_chunks', String(totalChunks));
    const beginResponse = await api.post(beginUploadEndpoint, beginForm);
    const session = unwrap<ImageAsset>(beginResponse);
    mergeAssets([session]);
    setBatchAssetIds((current) => [...new Set([...current, session.id])]);

    for (let index = 0; index < totalChunks; index += 1) {
      const chunkForm = new FormData();
      chunkForm.append('chunk', file.slice(index * chunkSize, Math.min(file.size, (index + 1) * chunkSize), file.type));
      chunkForm.append('chunk_index', String(index));
      await api.post(`${chunkEndpointBase}${session.id}/chunks`, chunkForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event: { loaded: number; total?: number }) => {
          const chunkProgress = event.total ? event.loaded / event.total : 1;
          updatePending(pendingId, {
            progress: Math.min(20, Math.round(((index + chunkProgress) / totalChunks) * 20)),
            stage: `uploading ${index + 1}/${totalChunks}`,
          });
        },
      });
    }

    const completeResponse = await api.post(`${completeEndpointBase}${session.id}/complete`, new FormData());
    const asset = unwrap<ImageAsset>(completeResponse);
    mergeAssets([asset]);
    updatePending(pendingId, { progress: 20, stage: 'queued' });
    return asset;
  };

  const uploadFile = async (file: File, pendingId: string): Promise<void> => {
    if (!isImageFile(file)) throw new Error('Only JPG, PNG, and WebP files can be uploaded.');

    const requiresChunk = file.size > maxSizeMb * 1024 * 1024;
    const asset = requiresChunk
      ? await uploadChunked(file, pendingId)
      : await uploadDirect(file, pendingId);
    updatePending(pendingId, { progress: asset.progress_percent ?? 20, stage: asset.processing_stage ?? asset.status });
    const readyAssets = await refreshAssets([asset.id]);
    const readyAsset = readyAssets.find((item) => item.id === asset.id) ?? asset;

    if (readyAsset.status === 'failed') {
      updatePending(pendingId, { progress: 0, stage: 'failed', error: readyAsset.error_code ?? 'Media conversion failed.' });
      throw new Error(readyAsset.error_code ?? 'Media conversion failed.');
    }

    updatePending(pendingId, { progress: 100, stage: 'ready' });
    setPending((current) => current.filter((item) => item.id !== pendingId));
  };

  const handleFiles = async (fileList: FileList | null): Promise<void> => {
    if (!fileList) return;
    setError('');
    setBatchAssetIds([]);

    const files = Array.from(fileList).slice(0, 100);
    const jobs: Array<{ file: File; pendingId: string }> = [];
    const previews: PendingPreview[] = [];

    files.forEach((file, index) => {
      const isImage = isImageFile(file);
      const maxBytes = memberMaxSizeMb * 1024 * 1024;
      const pendingId = `pending-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`;
      if (!isImage || file.size > maxBytes) {
        previews.push({ id: pendingId, name: file.name, url: '', progress: 0, stage: 'rejected', error: `${file.name}: unsupported file or size (${formatBytes(file.size)}).` });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      previews.push({ id: pendingId, name: file.name, url: previewUrl, progress: 0, stage: 'queued' });
      jobs.push({ file, pendingId });
    });

    setPending(previews);
    let cursor = 0;
    const worker = async (): Promise<void> => {
      while (cursor < jobs.length) {
        const job = jobs[cursor];
        cursor += 1;
        try {
          await uploadFile(job.file, job.pendingId);
          const previewUrl = previews.find((item) => item.id === job.pendingId)?.url;
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrls.current.delete(previewUrl);
          }
        } catch (uploadError: unknown) {
          updatePending(job.pendingId, { error: getErrorMessage(uploadError, 'Upload failed.'), stage: 'failed' });
          setError(getErrorMessage(uploadError, 'Upload failed.'));
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(2, jobs.length) }, () => worker()));
  };

  const copyText = async (text: string): Promise<void> => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  };

  const embedFor = (asset: ImageAsset): string => {
    if (asset.embed_html) return asset.embed_html;
    return asset.display_url ? `<img src="${asset.display_url}" alt="" loading="lazy">` : '';
  };

  const insertTextIntoTarget = (snippet: string): boolean => {
    if (!targetTextareaSelector || typeof document === 'undefined') return false;
    const textarea = document.querySelector<HTMLTextAreaElement>(targetTextareaSelector);
    if (!textarea) return false;

    const current = textarea.value ?? '';
    const start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : current.length;
    const end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : current.length;
    const prefix = start > 0 && current[start - 1] !== '\n' ? '\n' : '';
    const suffix = end < current.length && current[end] !== '\n' ? '\n' : '\n';
    const nextValue = `${current.slice(0, start)}${prefix}${snippet}${suffix}${current.slice(end)}`;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(textarea, nextValue);
    } else {
      textarea.value = nextValue;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    textarea.focus();
    return true;
  };

  const insertEmbed = (asset: ImageAsset): void => {
    const snippet = embedFor(asset);
    if (!snippet) return;
    if (insertTextIntoTarget(snippet)) {
      setInsertedHash(asset.hash);
      window.setTimeout(() => setInsertedHash(''), 1500);
    }
  };

  const insertBatch = (): void => {
    const embeds = assets
      .filter((asset) => batchAssetIds.includes(asset.id) && asset.status === 'ready')
      .map(embedFor)
      .filter(Boolean);
    if (embeds.length === 0) return;

    if (insertTextIntoTarget(embeds.join('\n'))) {
      setBatchInserted(true);
      window.setTimeout(() => setBatchInserted(false), 1500);
    }
  };

  const copyEmbed = async (asset: ImageAsset): Promise<void> => {
    try {
      await copyText(embedFor(asset));
      setCopiedHash(asset.hash);
      window.setTimeout(() => setCopiedHash(''), 1500);
    } catch (copyError: unknown) {
      setError(getErrorMessage(copyError, 'Copy failed.'));
    }
  };

  const copyBatch = async (): Promise<void> => {
    const embeds = assets
      .filter((asset) => batchAssetIds.includes(asset.id) && asset.status === 'ready')
      .map(embedFor)
      .filter(Boolean);
    if (embeds.length === 0) return;

    try {
      await copyText(embeds.join('\n'));
      setBatchCopied(true);
      window.setTimeout(() => setBatchCopied(false), 1500);
    } catch (copyError: unknown) {
      setError(getErrorMessage(copyError, 'Copy failed.'));
    }
  };

  const deleteAsset = async (asset: ImageAsset): Promise<void> => {
    const api = getApi();
    if (!api) return;

    try {
      await api.delete(`${statusBase}${asset.id}`);
      setAssets((current) => current.filter((item) => item.id !== asset.id));
      setBatchAssetIds((current) => current.filter((id) => id !== asset.id));
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, 'Delete failed.'));
    }
  };

  return (
    <section className={`rounded-card border border-rule bg-paper-2 p-5 ${className}`.trim()} {...rest}>
      <div className="border-b border-rule pb-4">
        {compact ? (
          <h2 className="text-[16px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
        ) : (
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-ink">{title}</h1>
        )}
        <p className="mt-1 text-[13px] leading-6 text-muted">{description}</p>
      </div>

      <label className="mt-5 inline-flex cursor-pointer rounded-ctl bg-accent px-4 py-2 text-[13px] font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-hover">
        {chooseLabel}
        <input
          type="file"
          accept={accept}
          multiple
          aria-label={chooseLabel}
          className="sr-only"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.currentTarget.value = '';
          }}
        />
      </label>

      {error && (
        <p role="alert" aria-live="polite" className="mt-3 rounded-ctl border border-danger-border bg-danger-wash px-3 py-2 text-[12px] text-danger">
          {error}
        </p>
      )}

      {pending.length > 0 && (
        <div className="mt-5 divide-y divide-rule border-t border-b border-rule">
          {pending.map((item) => (
            <div key={item.id} className="flex gap-3 py-3">
              {item.url && <img src={item.url} alt="" className="h-16 w-16 rounded-ctl object-cover" />}
              <div className="min-w-0 flex-1 text-[12px] text-muted">
                <p className="truncate text-ink">{item.name}</p>
                <p className="mt-1 tnum">{item.error ?? `${item.stage} · ${item.progress}%`}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-rule">
                  <div
                    className="h-full w-full origin-left bg-accent transition-transform duration-150"
                    style={{ transform: `scaleX(${Math.max(0, Math.min(100, item.progress)) / 100})` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold tracking-[0.08em] text-muted">{readyLabel}</h2>
          {assets.some((asset) => batchAssetIds.includes(asset.id) && asset.status === 'ready') && (
            <div className="flex flex-wrap items-center gap-2">
              {targetTextareaSelector ? (
                <button type="button" className="cursor-pointer rounded-ctl bg-accent px-2.5 py-1.5 text-[11px] font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-hover" onClick={() => insertBatch()}>
                  {batchInserted ? insertedLabel : insertAllLabel}
                </button>
              ) : null}
              <button type="button" className="cursor-pointer rounded-ctl border border-rule px-2.5 py-1.5 text-[11px] font-medium text-ink transition-colors duration-150 hover:border-rule-2" onClick={() => void copyBatch()}>
                {batchCopied ? copyAllCopiedLabel : copyAllLabel}
              </button>
            </div>
          )}
        </div>
        {assets.length === 0 && pending.length === 0 ? (
          <p className="mt-3 text-[13px] text-faint">{emptyLabel}</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {assets.map((asset) => (
              <article key={asset.id} className="overflow-hidden rounded-ctl bg-paper">
                {asset.thumb_url ? (
                  <img src={asset.thumb_url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                ) : null}
                <div className="p-3">
                  <p className="truncate text-[12px] text-ink">{asset.original_filename}</p>
                  <p className="mt-1 tnum text-[11px] text-muted">
                    {asset.status === 'ready' ? readyLabel : asset.status === 'failed' ? asset.error_code : `${processingLabel} ${asset.progress_percent ?? 0}%`}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {asset.status === 'ready' && targetTextareaSelector ? (
                      <button type="button" className="cursor-pointer rounded-ctl bg-accent px-2.5 py-1.5 text-[11px] font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-hover" onClick={() => insertEmbed(asset)}>
                        {insertedHash === asset.hash ? insertedLabel : insertLabel}
                      </button>
                    ) : null}
                    {asset.status === 'ready' && (
                      <button type="button" className="cursor-pointer rounded-ctl border border-rule px-2.5 py-1.5 text-[11px] font-medium text-ink transition-colors duration-150 hover:border-rule-2" onClick={() => void copyEmbed(asset)}>
                        {copiedHash === asset.hash ? copiedLabel : copyLabel}
                      </button>
                    )}
                    <button type="button" className="cursor-pointer rounded-ctl border border-rule px-2.5 py-1.5 text-[11px] text-muted transition-colors duration-150 hover:border-danger-border hover:text-danger" onClick={() => void deleteAsset(asset)}>
                      {deleteLabel}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

ImageUploader.displayName = 'ImageUploader';
