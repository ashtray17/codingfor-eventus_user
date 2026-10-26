// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ImageUploader } from './ImageUploader';

describe('ImageUploader', () => {
  it('renders the upload surface without a G7 API during static rendering', () => {
    render(
      <ImageUploader
        title="Image Embed"
        description="Upload an image"
        chooseLabel="Choose"
      />
    );

    expect(screen.getByRole('heading', { name: 'Image Embed' })).toBeTruthy();
    expect(screen.getByText('Upload an image')).toBeTruthy();
    expect(screen.getByText('Choose')).toBeTruthy();
  });

  it('inserts ready image embed HTML directly into targetTextareaSelector and fires input event', async () => {
    (window as unknown as { G7Core?: unknown }).G7Core = {
      api: {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 7,
                hash: 'abc123',
                original_filename: 'stadium.webp',
                status: 'ready',
                display_url: '/media/stadium.webp',
                embed_html: '<img src="/media/stadium.webp" alt="" loading="lazy">',
              },
            ],
          },
        }),
        post: vi.fn(),
        delete: vi.fn(),
      },
    };

    const onInput = vi.fn();
    render(
      <div>
        <textarea name="content" aria-label="Content" defaultValue="Hello world" onInput={onInput} />
        <ImageUploader
          compact
          targetTextareaSelector="textarea[name='content']"
          title="Attach Images"
          insertLabel="Insert in post"
        />
      </div>
    );

    const insertBtn = await waitFor(() => screen.getByRole('button', { name: 'Insert in post' }));
    fireEvent.click(insertBtn);

    const textarea = document.querySelector<HTMLTextAreaElement>("textarea[name='content']");
    expect(textarea?.value).toContain('<img src="/media/stadium.webp" alt="" loading="lazy">');
    expect(onInput).toHaveBeenCalled();

    delete (window as unknown as { G7Core?: unknown }).G7Core;
  });
});
