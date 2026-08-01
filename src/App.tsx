import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ActivitiesPage } from './pages/Activities';
import { SyllabusPage } from './pages/Syllabus';
import { AttendancePage } from './pages/Attendance';

const PAGE_TITLES: Record<string, string> = {
  '/activities': 'الأنشطة والموارد',
  '/syllabus': 'توزيع المنهج',
  '/attendance': 'الحضور والغياب',
  '/': 'الأنشطة والموارد',
};

export const App: React.FC = () => {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'بوابة وسيلة';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Cairo',sans-serif]">

      {/* Simple Header - Logo + Page Title only */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">

          {/* Wasyla Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md">
              وسيلة
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200" />

          {/* Current Page Title */}
          <h1 className="text-slate-800 font-bold text-lg">
            {pageTitle}
          </h1>

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
