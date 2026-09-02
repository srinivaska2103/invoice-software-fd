'use client';

import { MainLayout } from '@/layouts/MainLayout';
import { InvoicesComponent } from '@/views/InvoicesComponent';

export default function InvoicesPage() {
  return (
    <MainLayout>
      <InvoicesComponent />
    </MainLayout>
  );
}
