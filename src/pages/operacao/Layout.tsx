import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/operacao/Sidebar';

export const LayoutOperacao: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#080508] flex flex-col lg:flex-row text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen w-full overflow-y-auto pb-20 lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
};
