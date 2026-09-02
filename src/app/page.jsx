'use client';

import { MainLayout } from '@/layouts/MainLayout';
import { DashboardComponent } from '@/views/DashboardComponent';

export default function Page() {
  return (
    <MainLayout>
      <DashboardComponent />
    </MainLayout>
  );
}
