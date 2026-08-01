import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface EducationStage {
  id: string;
  name: string;
  tracks: Array<{
    id: string;
    name: string;
    grades: Array<{
      id: string;
      name: string;
      semesters: Array<{ id: string; name: string }>;
    }>;
  }>;
}

interface GradeSubjectItem {
  gradeSubjectId: string;
  subjectId: string;
  name: string;
}

interface SyllabusWeekItem {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  unitTitle: string;
  lessonTitle: string;
  notes?: string;
  isHoliday?: boolean;
  region?: string;
}

const REGION_OPTIONS = [
  { id: 'GENERAL', name: '1. عام (جميع مناطق المملكة - التوزيع الموحد)' },
  { id: 'MAKKAH', name: '2. مكة المكرمة والرياض وجدة' }
];

const PORTAL_API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URLS = [
  PORTAL_API,
  'https://api.wsyelhi.com/api',
  'http://localhost:4001/api',
];

const fetchFromDatabase = async (endpoint: string): Promise<{ ok: boolean; data: any }> => {
  for (const baseUrl of API_URLS) {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`);
      if (res.ok) {
        const data = await res.json();
        return { ok: true, data };
      }
    } catch { /* try next url */ }
  }
  return { ok: false, data: null };
};

export const SyllabusDistributionViewer: React.FC = () => {
  const [stages, setStages] = useState<EducationStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [subjects, setSubjects] = useState<GradeSubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('GENERAL');
  const [weeks, setWeeks] = useState<SyllabusWeekItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  const [schoolName, setSchoolName] = useState<string>('مدرسة الأفق السعودية');
  const [teacherName, setTeacherName] = useState<string>('');
  const [principalName, setPrincipalName] = useState<string>('');

  const showStatus = (msg: string) => { setStatusMsg(msg); setTimeout(() => setStatusMsg(''), 4500); };

  const getFallbackStages = (): EducationStage[] => [
    {
      id: 'stg-elem', name: 'المرحلة الابتدائية', tracks: [{
        id: 'trk-elem-gen', name: 'المسار العام', grades: [
          { id: 'gr-elem-1', name: 'الصف الأول الابتدائي', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }, { id: 'sem-3', name: 'الفصل الثالث' }] },
          { id: 'gr-elem-2', name: 'الصف الثاني الابتدائي', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }, { id: 'sem-3', name: 'الفصل الثالث' }] },
          { id: 'gr-elem-3', name: 'الصف الثالث الابتدائي', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }, { id: 'sem-3', name: 'الفصل الثالث' }] },
          { id: 'gr-elem-4', name: 'الصف الرابع الابتدائي', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }, { id: 'sem-3', name: 'الفصل الثالث' }] },
          { id: 'gr-elem-5', name: 'الصف الخامس الابتدائي', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }, { id: 'sem-3', name: 'الفصل الثالث' }] },
          { id: 'gr-elem-6', name: 'الصف السادس الابتدائي', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }, { id: 'sem-3', name: 'الفصل الثالث' }] },
        ]
      }]
    },
    {
      id: 'stg-mid', name: 'المرحلة المتوسطة', tracks: [{
        id: 'trk-mid-gen', name: 'المسار العام', grades: [
          { id: 'gr-mid-1', name: 'الصف الأول المتوسط', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }, { id: 'sem-3', name: 'الفصل الثالث' }] },
          { id: 'gr-mid-2', name: 'الصف الثاني المتوسط', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }, { id: 'sem-3', name: 'الفصل الثالث' }] },
          { id: 'gr-mid-3', name: 'الصف الثالث المتوسط', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }, { id: 'sem-3', name: 'الفصل الثالث' }] },
        ]
      }]
    },
    {
      id: 'stg-high', name: 'المرحلة الثانوية', tracks: [
        {
          id: 'trk-high-gen', name: 'المسار العام', grades: [
            { id: 'gr-high-1', name: 'الصف الأول الثانوي', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }, { id: 'sem-3', name: 'الفصل الثالث' }] },
            { id: 'gr-high-2', name: 'الصف الثاني الثانوي', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }, { id: 'sem-3', name: 'الفصل الثالث' }] },
            { id: 'gr-high-3', name: 'الصف الثالث الثانوي', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }, { id: 'sem-3', name: 'الفصل الثالث' }] },
          ]
        },
        {
          id: 'trk-high-cs', name: 'مسار علوم الحاسب', grades: [
            { id: 'gr-high-2-cs', name: 'الصف الثاني (مسار حاسب)', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }] },
            { id: 'gr-high-3-cs', name: 'الصف الثالث (مسار حاسب)', semesters: [{ id: 'sem-1', name: 'الفصل الأول' }, { id: 'sem-2', name: 'الفصل الثاني' }] },
          ]
        },
      ]
    },
  ];

  useEffect(() => {
    (async () => {
      const { ok, data } = await fetchFromDatabase('/stages');
      if (ok && Array.isArray(data) && data.length > 0) { setStages(data); setIsServerConnected(true); return; }
      setStages([]); setIsServerConnected(false); showStatus('🔴 تعذر الاتصال بقاعدة البيانات لجلب المراحل الدراسية. يرجى التأكد من تشغيل السيرفر https://api.wsyelhi.com');
    })();
  }, []);

  const selectedStage = stages.find(s => s.id === selectedStageId);
  const availableTracks = selectedStage?.tracks || [];
  const selectedTrack = availableTracks[0];
  const availableGrades = selectedTrack?.grades || [];
  const selectedGrade = selectedStageId ? availableGrades.find(g => g.id === selectedGradeId) : undefined;
  const availableSemesters = selectedGrade ? ((selectedGrade.semesters && selectedGrade.semesters.length > 0) ? selectedGrade.semesters : defaultSems) : [];
  const selectedSemester = selectedGradeId ? availableSemesters.find(s => s.id === selectedSemesterId) : undefined;

  useEffect(() => {
    (async () => {
      if (!selectedGradeId || !selectedSemesterId) {
        setSubjects([]);
        setSelectedSubjectId('');
        return;
      }
      setLoadingSubjects(true);
      const { ok, data } = await fetchFromDatabase(`/subjects?gradeId=${selectedGradeId}&semesterId=${selectedSemesterId}`);
      if (ok && Array.isArray(data) && data.length > 0) { setSubjects(data); setSelectedSubjectId(data[0].gradeSubjectId || data[0].id); setLoadingSubjects(false); setIsServerConnected(true); return; }
      setSubjects([]); setSelectedSubjectId(''); setLoadingSubjects(false); showStatus('⚠️ لم يتم العثور على أي مواد في قاعدة البيانات لهذه المرحلة والفصل');
    })();
  }, [selectedGradeId, selectedSemesterId]);

  const fetchSyllabusWeeks = async () => {
    if (!selectedSubjectId) return;
    setLoading(true);
    const { ok, data } = await fetchFromDatabase(`/syllabus-weeks?gradeSubjectId=${selectedSubjectId}&region=${selectedRegion}`);
    if (ok && Array.isArray(data)) {
      setWeeks(data);
      setShowPreview(true);
      setLoading(false);
      setIsServerConnected(true);
      return;
    }
    setWeeks([]);
    setShowPreview(false);
    showStatus('لا توجد بيانات توزيع مضافة لهذه المادة في قاعدة البيانات');
    setLoading(false);
    setIsServerConnected(false);
  };

  useEffect(() => { if (selectedSubjectId) fetchSyllabusWeeks(); }, [selectedSubjectId, selectedRegion]);

  const selectedSubjectObj = subjects.find(s => s.gradeSubjectId === selectedSubjectId || s.subjectId === selectedSubjectId) || subjects[0];
  const selectedRegionObj = REGION_OPTIONS.find(r => r.id === selectedRegion) || REGION_OPTIONS[0];

  const handleDownloadPdf = async () => {
    const el = document.getElementById('printable-syllabus');
    if (!el) { showStatus('عنصر المعاينة غير موجود، أعد فتح النافذة'); return; }
    setPdfLoading(true);
    try {
      const htmlContent = el.outerHTML;
      const subjectName = selectedSubjectObj?.name || 'المادة';
      const gradeName = selectedGrade?.name || '';
      const stageName = selectedStage?.name || '';
      const pdfTitle = `توزيع ${subjectName} ${gradeName} ${stageName}`.replace(/\s+/g, ' ').trim();
      const pdfExportUrl = 'https://api.wsyelhi.com/api/syllabus-weeks/export-pdf';
      const response = await fetch(pdfExportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlContent, title: pdfTitle }),
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || contentType.includes('application/json')) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `فشل إنشاء PDF (${response.status})`);
      }
      const blobData = await response.blob();
      const pdfBlob = new Blob([blobData], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pdfTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { window.URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 1000);
      showStatus('✅ تم توليد وتنزيل ملف الـ PDF بنجاح');
    } catch (err: any) {
      showStatus('❌ فشل تنزيل PDF: ' + (err.message || 'تحقق من تشغيل السيرفر'));
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!weeks.length) { showStatus('لا توجد بيانات للتصدير'); return; }
    const aoa: any[][] = [['الأسبوع', 'من تاريخ', 'إلى تاريخ', 'عنوان الوحدة', 'الدرس المقرر', 'ملاحظات'], ...weeks.map(w => [w.weekNumber, w.startDate, w.endDate, w.unitTitle, w.lessonTitle, w.notes || ''])];
    const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, 'توزيع المنهج'); XLSX.writeFile(wb, `توزيع-المنهج-${selectedSubjectObj?.name || 'المادة'}.xlsx`);
    showStatus('تم تصدير ملف Excel بنجاح 📊');
  };

  const cleanDateLine = (str: string) => {
    if (!str) return '';
    let s = str.trim();
    s = s.replace(/^من\s+من\s+/g, 'من ');
    s = s.replace(/^إلى\s+من\s+/g, 'من ');
    s = s.replace(/^إلى\s+إلى\s+/g, 'إلى ');
    if (!s.startsWith('من ') && !s.startsWith('إلى ')) {
      s = `من ${s}`;
    }
    return s;
  };

  const getArabicOrdinalWeek = (n: number): string => {
    const ordinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر', 'السادس عشر', 'السابع عشر', 'الثامن عشر'];
    return `الأسبوع ${ordinals[n - 1] || n}`;
  };

  const bA = { padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 as const, border: '2px solid #009688', background: 'rgb(46, 165, 176)', color: '#ffffff', cursor: 'pointer' as const, transition: 'all 0.15s' };
  const bI = { padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 as const, border: '1px solid #b2dfdb', background: '#ffffff', color: '#00796b', cursor: 'pointer' as const, transition: 'all 0.15s' };
  const cS = { background: '#ffffff', border: '1.5px solid #b2dfdb', borderRadius: '10px', padding: '12px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' };
  const sB: React.CSSProperties = { background: '#009688', color: '#ffffff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900 };

  return (
    <div style={{ direction: 'rtl', fontFamily: "'Cairo', sans-serif" }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-syllabus, #printable-syllabus * { visibility: visible !important; }
          #printable-syllabus { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 10px !important; border: none !important; box-shadow: none !important; }
          .no-print { display: none !important; }
          * { overflow: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: A4 landscape; margin: 8mm; }
        }
      `}</style>

      {statusMsg && <div className="no-print" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #10b981', padding: '8px 16px', borderRadius: '8px', marginBottom: '14px', fontWeight: 'bold', textAlign: 'center', fontSize: '13px' }}>{statusMsg}</div>}

      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', maxWidth: '1200px', margin: '0 auto 24px auto', width: '100%' }}>
        {/* ── Filter Card (User Screenshot Style - Wide & Spacious) ── */}
        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: '24px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.04), 0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginBottom: '20px',
          width: '100%'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', padding: '24px' }}>

            {/* Step 1: Stage (Always visible) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', textAlign: 'center' }}>
                <span style={{ color: '#3b82f6', fontWeight: 900, marginLeft: '6px', fontSize: '15px' }}>1</span> اختر المرحلة الدراسية
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', width: '100%' }}>
                {stages.map(s => {
                  const active = s.id === selectedStageId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedStageId(s.id); setSelectedGradeId(''); setSelectedSemesterId(''); setSelectedSubjectId(''); setSubjects([]); }}
                      style={{
                        padding: '7px 18px',
                        borderRadius: '11px',
                        fontSize: '13px',
                        fontWeight: 700,
                        border: 'none',
                        background: active ? 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)' : '#f1f5f9',
                        color: active ? '#ffffff' : '#475569',
                        boxShadow: active ? '0 4px 14px rgba(59, 130, 246, 0.3)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        fontFamily: "'Cairo', sans-serif"
                      }}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Grade (Visible when stage selected) */}
            {selectedStageId && availableGrades.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', textAlign: 'center' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 900, marginLeft: '6px', fontSize: '15px' }}>2</span> اختر الصف
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', width: '100%' }}>
                  {availableGrades.map(g => {
                    const active = g.id === selectedGradeId;
                    const shortName = g.name
                      .replace('الصف ', '')
                      .replace(' الابتدائي', '')
                      .replace(' المتوسط', '')
                      .replace(' الثانوي', '');
                    return (
                      <button
                        key={g.id}
                        onClick={() => { setSelectedGradeId(g.id); setSelectedSemesterId(''); setSelectedSubjectId(''); setSubjects([]); }}
                        style={{
                          padding: '7px 18px',
                          borderRadius: '11px',
                          fontSize: '13px',
                          fontWeight: 700,
                          border: 'none',
                          background: active ? 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)' : '#f1f5f9',
                          color: active ? '#ffffff' : '#475569',
                          boxShadow: active ? '0 4px 14px rgba(59, 130, 246, 0.3)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          fontFamily: "'Cairo', sans-serif"
                        }}
                      >
                        {shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Semester (Visible when grade selected) */}
            {selectedGradeId && availableSemesters.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', textAlign: 'center' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 900, marginLeft: '6px', fontSize: '15px' }}>3</span> اختر الفصل الدراسي
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', width: '100%' }}>
                  {availableSemesters.map(s => {
                    const active = s.id === selectedSemesterId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedSemesterId(s.id); setSelectedSubjectId(''); }}
                        style={{
                          padding: '7px 18px',
                          borderRadius: '11px',
                          fontSize: '13px',
                          fontWeight: 700,
                          border: 'none',
                          background: active ? 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)' : '#f1f5f9',
                          color: active ? '#ffffff' : '#475569',
                          boxShadow: active ? '0 4px 14px rgba(59, 130, 246, 0.3)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          fontFamily: "'Cairo', sans-serif"
                        }}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Subject (Visible when semester selected) */}
            {selectedSemesterId && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '440px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', textAlign: 'center' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 900, marginLeft: '6px', fontSize: '15px' }}>4</span> اختر المادة {loadingSubjects && <span style={{ fontSize: '12px', color: '#94a3b8' }}>...</span>}
                </div>
                <select
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '14px',
                    border: '2px solid #6366f1',
                    background: '#ffffff',
                    color: '#1e1b4b',
                    fontWeight: 800,
                    fontSize: '14px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.12)',
                    fontFamily: "'Cairo', sans-serif"
                  }}
                >
                  {subjects.map(sub => {
                    const id = sub.gradeSubjectId || sub.subjectId;
                    return (
                      <option key={id} value={id}>
                        {sub.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Region Selection */}
            {selectedSubjectId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#047857' }}>🗺️ نطاق التوزيع:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {REGION_OPTIONS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRegion(r.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: r.id === selectedRegion ? '1.5px solid #059669' : '1px solid #cbd5e1',
                        background: r.id === selectedRegion ? '#ecfdf5' : '#ffffff',
                        color: r.id === selectedRegion ? '#047857' : '#64748b',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Summary Bar - Pastel Gradient */}
          <div style={{
            background: 'linear-gradient(90deg, #ecfdf5 0%, #e0f2fe 100%)',
            borderTop: '1px solid rgba(209, 250, 229, 0.9)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {selectedStage && <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, background: '#e0e7ff', color: '#4338ca', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>{selectedStage.name} ✓</span>}
            {selectedGrade && <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, background: '#d1fae5', color: '#059669', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>{selectedGrade.name} ✓</span>}
            {selectedSemester && <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, background: '#fef3c7', color: '#d97706', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>{selectedSemester.name} ✓</span>}
            {selectedSubjectObj && <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, background: '#fce7f3', color: '#db2777', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>{selectedSubjectObj.name} ✓</span>}
          </div>
        </div>

        {/* بيانات المدرسة */}
        <div style={{ background: '#ffffff', border: '1.5px solid #b2dfdb', borderRadius: '10px', padding: '12px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>📝 بيانات المدرسة والتوقيع (تظهر في الـ PDF)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px' }}>
            <div><label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>🏫 اسم المدرسة:</label><input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #bfdbfe', background: '#f8fafc', color: '#0f172a', fontWeight: 600, fontSize: '12px', outline: 'none' }} /></div>
            <div><label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>👨‍🏫 اسم المعلم/ة:</label><input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="اكتب اسم المعلم/ة..." style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #bfdbfe', background: '#f8fafc', color: '#0f172a', fontWeight: 600, fontSize: '12px', outline: 'none' }} /></div>
            <div><label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>👔 اسم المدير/ة:</label><input type="text" value={principalName} onChange={e => setPrincipalName(e.target.value)} placeholder="اكتب اسم المدير/ة..." style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #bfdbfe', background: '#f8fafc', color: '#0f172a', fontWeight: 600, fontSize: '12px', outline: 'none' }} /></div>
          </div>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1.5px solid #e2e8f0', marginTop: '4px' }}>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading || weeks.length === 0}
            className="mc-btn"
            style={{
              width: '100%',
              background: pdfLoading || weeks.length === 0
                ? 'linear-gradient(135deg,#94a3b8,#64748b)'
                : 'linear-gradient(135deg,#6366f1,#4f46e5)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              padding: '13px 20px',
              borderRadius: '14px',
              fontSize: '14.5px',
              cursor: pdfLoading || weeks.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: pdfLoading || weeks.length === 0 ? 'none' : '0 6px 22px rgba(145, 179, 237, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: weeks.length === 0 ? 0.6 : 1,
              transition: 'all 0.2s',
              letterSpacing: '0.3px'
            }}
          >
            {pdfLoading ? (
              <span style={{ fontSize: 18 }}>⏳</span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            )}
            {pdfLoading ? 'جاري إنشاء PDF...' : 'تحميل PDF'}
          </button>
        </div>
      </div>

      {/* Prestige PDF Layout - MAIN screen view + PDF export source */}
      {weeks.length > 0 && (
        <div
          id="printable-syllabus"
          style={{ padding: '16px', background: '#ffffff', width: '100%', direction: 'rtl', fontFamily: "'Cairo', Arial, sans-serif", borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 12 }}
        >
          {/* Prestigious Light Ministry Executive Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 1fr',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
              color: '#0f172a',
              padding: '10px 16px',
              borderRadius: 12,
              marginBottom: 10,
              border: '1.5px solid #059669',
              borderBottom: '3px solid #d97706',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.05)'
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 900, fontSize: 11.5, color: '#065f46', letterSpacing: 0.2 }}>المملكة العربية السعودية</span>
                <span style={{ fontWeight: 800, fontSize: 11, color: '#0f172a' }}>وزارة التعليم</span>
                <span style={{ fontWeight: 800, fontSize: 9.5, color: '#d97706', marginTop: 1 }}>إدارة التعليم العام</span>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#064e3b', letterSpacing: '-0.3px' }}>
                {selectedRegion === 'GENERAL' ? 'الخطة الدراسية والتوزيع الزمني للمنهج' : 'توزيع المنهج المعتمد (مكة المكرمة - جدة - الطائف)'}
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: 11, fontWeight: 800, color: '#0d9488' }}>
                منصة وسيلة — المحتوى الدراسي لعام 1448 هـ
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <img
                src="https://api.wsyelhi.com/wsylh-logo-full.png"
                alt="وسيلة"
                style={{ height: 42, width: 'auto', objectFit: 'contain' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>

          {/* Sub-Header Info Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 6,
              background: 'linear-gradient(to left, #f0fdf4, #f0f9ff, #fffbeb)',
              border: '1.5px solid #0284c7',
              borderRadius: 8,
              padding: '4px 10px',
              marginBottom: 8,
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(2, 132, 199, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#0369a1', whiteSpace: 'nowrap' }}>📚 المادة:</span>
              <span style={{ fontSize: 11.5, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>{selectedSubjectObj?.name || ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRight: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#0369a1', whiteSpace: 'nowrap' }}>🎓 الصف:</span>
              <span style={{ fontSize: 11.5, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>{selectedGrade?.name || ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRight: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#0369a1', whiteSpace: 'nowrap' }}>📅 الفصل:</span>
              <span style={{ fontSize: 11.5, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>{selectedSemester?.name || ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRight: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#0369a1', whiteSpace: 'nowrap' }}>⏳ العام:</span>
              <span style={{ fontSize: 11.5, fontWeight: 900, color: '#0d9488', whiteSpace: 'nowrap' }}>1448 هـ (2026 - 2027 م)</span>
            </div>
          </div>

          {/* Executive Matrix Weeks Grid - 6 columns stretch - EXACT admin design */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridAutoRows: '1fr', gap: 6, marginBottom: 10, width: '100%', flex: 1, alignItems: 'stretch' }}>
            {weeks.map((w, idx) => {
              const topic = (w as any).title || w.lessonTitle || w.unitTitle || '';
              const isHoliday = w.isHoliday || (w as any).weekType === 'HOLIDAY' || (topic.includes('إجازة') && !topic.includes('اليوم الوطني'));
              const isExam = !isHoliday && ((w as any).weekType === 'EXAM' || topic.includes('اختبار'));
              const parts = topic.split('|').map((p: string) => p.trim());
              const displayHeader = isHoliday ? 'إجازة رسمية' : isExam ? 'أسبوع الاختبارات' : getArabicOrdinalWeek(w.weekNumber ?? idx + 1);
              const startDate = (w as any).startDateHijri || w.startDate || '';
              const endDate = (w as any).endDateHijri || w.endDate || '';
              return (
                <div
                  key={w.id || idx}
                  style={{
                    border: isHoliday ? '1.5px solid #fed7aa' : isExam ? '1.5px solid #a7f3d0' : '1.5px solid #bfdbfe',
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: isHoliday ? '#fff7ed' : isExam ? '#f0fdf4' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <div
                    style={{
                      background: isHoliday
                        ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                        : isExam
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: '#ffffff',
                      padding: '4px 6px',
                      fontWeight: 900,
                      fontSize: 10.5,
                      textAlign: 'center',
                      borderBottom: isHoliday ? '1.5px solid #fed7aa' : isExam ? '1.5px solid #a7f3d0' : '1.5px solid #93c5fd'
                    }}
                  >
                    <span>{displayHeader}</span>
                  </div>
                  <div style={{ padding: '5px 6px', fontSize: 9.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 4 }}>
                    {(startDate || endDate) && (
                      <div style={{ background: '#f0f9ff', border: '1px solid #7dd3fc', borderRadius: 5, padding: '2px 4px', fontSize: 8.5, color: '#0369a1', textAlign: 'center', fontWeight: 800, marginBottom: 2, lineHeight: 1.3 }}>
                        <span>📅 </span>
                        {startDate && <div style={{ display: 'inline' }}>{startDate} </div>}
                        {endDate && <div style={{ display: 'inline' }}>{endDate}</div>}
                      </div>
                    )}
                    {((): React.ReactNode[] => {
                      const isWeek5NationalDay = (w.weekNumber ?? idx + 1) === 5 && !parts.some(p => p.includes('اليوم الوطني') || p.includes('إجازة'));
                      const effectiveParts = isWeek5NationalDay
                        ? [parts[0] || '', 'إجازة اليوم الوطني السعودي', ...parts.slice(1)].filter(Boolean)
                        : parts;
                      return effectiveParts.map((p, pIdx) => {
                        const isSpecialHoliday = p.includes('إجازة') || p.includes('عطلة') || p.includes('اليوم الوطني');
                        const isSpecialExam = p.includes('اختبار') || p.includes('تقويم') || p.includes('امتحان');
                        if (isSpecialHoliday) return (
                          <div key={pIdx} style={{ background: '#ffedd5', color: '#9a3412', padding: '5px 6px', borderRadius: 8, border: '1.5px solid #fdba74', fontSize: 9.5, fontWeight: 800, textAlign: 'center', margin: '2px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, lineHeight: 1.3 }}>
                            <span>📍</span><span>🌴</span><span>{p}</span>
                          </div>
                        );
                        if (isSpecialExam && !isExam) return (
                          <div key={pIdx} style={{ background: '#dcfce7', color: '#166534', padding: '4px 6px', borderRadius: 6, border: '1.5px solid #86efac', fontSize: 9, fontWeight: 800, textAlign: 'center', margin: '2px 0' }}>
                            <span>📝 {p}</span>
                          </div>
                        );
                        return (
                          <div key={pIdx} style={{ display: 'flex', gap: 4, fontSize: 9, fontWeight: 700, color: '#1e293b', lineHeight: 1.3, alignItems: 'baseline' }}>
                            <span style={{ color: '#d97706', fontWeight: 900, fontSize: 8 }}>❖</span>
                            <span>{p}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Official Signatures Table */}
          <div
            style={{
              marginTop: 6,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10,
              padding: '5px 12px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 800,
              color: '#1e293b',
              width: '100%'
            }}
          >
            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#64748b', fontSize: 9.5, fontWeight: 700, whiteSpace: 'nowrap' }}>المؤسسة التعليمية:</span>
              <span style={{ fontWeight: 900, color: '#0f766e', fontSize: 11, whiteSpace: 'nowrap' }}>{schoolName || '........................................'}</span>
            </div>
            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#64748b', fontSize: 9.5, fontWeight: 700, whiteSpace: 'nowrap' }}>توقيع معلم/ة المادة:</span>
              <span style={{ fontWeight: 900, color: '#0f766e', fontSize: 11, whiteSpace: 'nowrap' }}>{teacherName || '........................................'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#64748b', fontSize: 9.5, fontWeight: 700, whiteSpace: 'nowrap' }}>اعتماد مدير/ة المدرسة:</span>
              <span style={{ fontWeight: 900, color: '#0f766e', fontSize: 11, whiteSpace: 'nowrap' }}>{principalName || '........................................'}</span>
            </div>
          </div>

          {/* Footer Line */}
          <div
            style={{
              marginTop: 6, padding: '4px 8px', textAlign: 'center', fontSize: 9, fontWeight: 700,
              color: '#64748b', borderTop: '1px dashed #cbd5e1',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
          </div>
        </div>
      )}
    </div>
  );
};