'use client';

import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { CryptoProvider } from '@/contexts/CryptoContext';
import { motion } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CryptoProvider>
      <div className="min-h-screen bg-[#0A0A0F]">
        <Sidebar />
        <div className="lg:ml-64">
          <Navbar />
          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 lg:p-6 pb-24 lg:pb-6"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </CryptoProvider>
  );
}
