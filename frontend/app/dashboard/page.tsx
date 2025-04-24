'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '../components/app-sidebar'

export default function Dashboard() {
  const router = useRouter();
  useEffect(() => {
    router.push('/dashboard/chat');
  }, [router]);
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto ml-64">
        <p>Redirecting to chat page...</p>
      </main>
    </div>
  );
}
