'use client';

import { MainLayout } from '@/layouts/MainLayout';
import { ProductsComponent } from '@/views/ProductsComponent';

export default function ProductsPage() {
  return (
    <MainLayout>
      <ProductsComponent />
    </MainLayout>
  );
}
