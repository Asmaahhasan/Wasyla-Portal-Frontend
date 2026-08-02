import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ActivitiesPage } from './pages/Activities';
import { SyllabusPage } from './pages/Syllabus';
import { AttendancePage } from './pages/Attendance';
import { WASILA_LOGO_BASE64 } from './assets/logoBase64';

const PAGE_TITLES: Record<string, string> = {
  '/activities': 'الأنشطة والموارد التعليمية',
  '/syllabus': 'توزيع المنهج الدراسي',
  '/attendance': 'سجل الحضور والغياب',
  '/': 'الأنشطة والموارد التعليمية',
};

const PAGE_ICONS: Record<string, string> = {
  '/activities': '📚',
  '/syllabus': '📅',
  '/attendance': '📋',
  '/': '📚',
};

export const App: React.FC = () => {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'بوابة وسيلة التعليمية';
  const pageIcon = PAGE_ICONS[location.pathname] ?? '✨';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Cairo',sans-serif]">

      {/* Ultra-Clean Pristine White Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">

          {/* Right Side (RTL Start): Page Title & Icon Pill */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/70 flex items-center justify-center text-sm shadow-xs font-bold">
              {pageIcon}
            </div>
            <h1 className="text-slate-800 font-extrabold text-base md:text-lg tracking-tight">
              {pageTitle}
            </h1>
          </div>

          {/* Left Side (RTL End): Clean Seamless Logo (No Box Wrapper) */}
          <div className="flex items-center">
            <img
              src={WASILA_LOGO_BASE64}
              alt="وسيلة | WSYLH"
              className="h-8 md:h-9 w-auto object-contain transition-transform hover:scale-105"
            />
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<ActivitiesPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/syllabus" element={<SyllabusPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
        </Routes>
      </main>

    </div>
  );
};

export default App;
