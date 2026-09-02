'use client';

import { MainLayout } from '@/layouts/MainLayout';
import { CreateInvoiceComponent } from '@/views/CreateInvoiceComponent';

export default function CreateInvoicePage() {
  return (
    <MainLayout>
      <CreateInvoiceComponent />
    </MainLayout>
  );
}
