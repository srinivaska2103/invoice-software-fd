'use client';

import { MainLayout } from '@/layouts/MainLayout';
import { StockComponent } from '@/views/StockComponent';

export default function StockPage() {
  return (
    <MainLayout>
      <StockComponent />
    </MainLayout>
  );
}
