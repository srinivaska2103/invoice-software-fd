'use client';

import { MainLayout } from '@/layouts/MainLayout';
import { CustomersComponent } from '@/views/CustomersComponent';

export default function CustomersPage() {
  return (
    <MainLayout>
      <CustomersComponent />
    </MainLayout>
  );
}
