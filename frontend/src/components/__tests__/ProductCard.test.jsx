import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../ProductCard';
import { describe, it, expect } from 'vitest';

describe('ProductCard', () => {
  it('renders name, price placeholder when missing, and image', () => {
    const p = { _id: 't1', name: 'Test Product', images: [], price: null, slug: 't1' };
    render(
      <MemoryRouter>
        <ProductCard p={p} />
      </MemoryRouter>
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/Rs —/)).toBeInTheDocument();
    // image alt should be present
    const img = screen.getByAltText('Test Product');
    expect(img).toBeInTheDocument();
  });
});
