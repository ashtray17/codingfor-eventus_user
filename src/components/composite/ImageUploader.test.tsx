// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
