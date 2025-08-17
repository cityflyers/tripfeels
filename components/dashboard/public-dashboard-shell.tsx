"use client";

import { useState } from "react";
import Header from "@/components/dashboard/header";
import Sidebar from "@/components/dashboard/sidebar";

export default function PublicDashboardShell({ children, loading = false }: { children: React.ReactNode, loading?: boolean }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header mobileSidebarOpen={mobileSidebarOpen} setMobileSidebarOpen={setMobileSidebarOpen} loading={loading} />
      <div className="flex flex-1 min-h-0">
        <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} loading={loading} />
        <main className="flex-1 overflow-y-auto p-0 bg-gray-50 dark:bg-gray-800">
          {children}
        </main>
      </div>
    </div>
  );
} 