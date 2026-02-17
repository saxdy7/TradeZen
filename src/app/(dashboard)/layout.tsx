'use client';

import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <Sidebar />
      <div className="ml-64">
        <Navbar />
        <AnimatePresence mode="wait">
          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
