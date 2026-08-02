import React, { useState, useEffect } from 'react';

interface EducationStage {
  id: string;
  name: string;
  tracks: Array<{
    id: string;
    name: string;
    grades: Array<{
      id: string;
      name: string;
      semesters: Array<{
        id: string;
        name: string;
      }>;
    }>;
  }>;
}

interface GradeSubjectItem {
  gradeSubjectId: string;
  subjectId: string;
  name: string;
}

interface LessonItem {
  id: string;
  gradeSubjectId: string;
  lessonTitle: string;
  items: Array<{
    type: string;
    title: string;
    url?: string;
    filePath?: string;
    thumbnailUrl?: string;
  }>;
}
type LessonActivityItem = LessonItem;

const RAW_API_URLS = [
  'https://api.wsyelhi.com/portal-api',
  'https://api.wsyelhi.com/api',
  import.meta.env.VITE_API_URL || 'https://api.wsyelhi.com/portal-api',
  'http://localhost:5000/api'
];
const API_URLS = Array.from(new Set(RAW_API_URLS));

const fetchFromDatabase = async (endpoint: string): Promise<any | null> => {
  for (const baseUrl of API_URLS) {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`);
      if (res.ok) {
        const json = await res.json();
        if (json && typeof json === 'object' && 'data' in json && json.data !== undefined) {
          return json.data;
        }
        if (Array.isArray(json)) return json;
        if (json && typeof json === 'object') return json;
      }
    } catch {
      // try next url
    }
  }
  return null;
};

export const ServerActivitiesViewer: React.FC = () => {
  const [stages, setStages] = useState<EducationStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');

  const [subjects, setSubjects] = useState<GradeSubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [activities, setActivities] = useState<LessonActivityItem[]>([]);
  const [selectedLessonTitle, setSelectedLessonTitle] = useState<string>('ALL');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('ALL');

  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true);

  // Inline preview item inside the page
  const [activePreview, setActivePreview] = useState<{ lessonTitle: string; item: any } | null>(null);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 4500);
  };

  const getFallbackStages = (): EducationStage[] => [
    {
      id: 'stg-elem',
      name: 'المرحلة الابتدائية',
      tracks: [
        {
          id: 'trk-elem-gen',
          name: 'المسار العام',
          grades: [
            { id: 'gr-elem-1', name: 'الصف الأول الابتدائي', semesters: [{ id: 'sem-1', name: 'الفصل الدراسي الأول' }, { id: 'sem-2', name: 'الفصل الدراسي الثاني' }, { id: 'sem-3', name: 'الفصل الدراسي الثالث' }] },
            { id: 'gr-elem-2', name: 'الصف الثاني الابتدائي', semesters: [{ id: 'sem-1', name: 'الفصل الدراسي الأول' }, { id: 'sem-2', name: 'الفصل الدراسي الثاني' }, { id: 'sem-3', name: 'الفصل الدراسي الثالث' }] },
            { id: 'gr-elem-3', name: 'الصف الثالث الابتدائي', semesters: [{ id: 'sem-1', name: 'الفصل الدراسي الأول' }, { id: 'sem-2', name: 'الفصل الدراسي الثاني' }, { id: 'sem-3', name: 'الفصل الدراسي الثالث' }] },
            { id: 'gr-elem-4', name: 'الصف الرابع الابتدائي', semesters: [{ id: 'sem-1', name: 'الفصل الدراسي الأول' }, { id: 'sem-2', name: 'الفصل الدراسي الثاني' }, { id: 'sem-3', name: 'الفصل الدراسي الثالث' }] },
            { id: 'gr-elem-5', name: 'الصف الخامس الابتدائي', semesters: [{ id: 'sem-1', name: 'الفصل الدراسي الأول' }, { id: 'sem-2', name: 'الفصل الدراسي الثاني' }, { id: 'sem-3', name: 'الفصل الدراسي الثالث' }] },
            { id: 'gr-elem-6', name: 'الصف السادس الابتدائي', semesters: [{ id: 'sem-1', name: 'الفصل الدراسي الأول' }, { id: 'sem-2', name: 'الفصل الدراسي الثاني' }, { id: 'sem-3', name: 'الفصل الدراسي الثالث' }] },
          ]
        }
      ]
    },
    {
      id: 'stg-mid',
      name: 'المرحلة المتوسطة',
      tracks: [
        {
          id: 'trk-mid-gen',
          name: 'المسار العام',
          grades: [
            { id: 'gr-mid-1', name: 'الصف الأول المتوسط', semesters: [{ id: 'sem-1', name: 'الفصل الدراسي الأول' }, { id: 'sem-2', name: 'الفصل الدراسي الثاني' }, { id: 'sem-3', name: 'الفصل الدراسي الثالث' }] },
            { id: 'gr-mid-2', name: 'الصف الثاني المتوسط', semesters: [{ id: 'sem-1', name: 'الفصل الدراسي الأول' }, { id: 'sem-2', name: 'الفصل الدراسي الثاني' }, { id: 'sem-3', name: 'الفصل الدراسي الثالث' }] },
            { id: 'gr-mid-3', name: 'الصف الثالث المتوسط', semesters: [{ id: 'sem-1', name: 'الفصل الدراسي الأول' }, { id: 'sem-2', name: 'الفصل الدراسي الثاني' }, { id: 'sem-3', name: 'الفصل الدراسي الثالث' }] },
          ]
        }
      ]
    },
    {
      id: 'stg-high',
      name: 'المرحلة الثانوية',
      tracks: [
        {
          id: 'trk-high-gen',
          name: 'المسار العام',
          grades: [
            { id: 'gr-high-1', name: 'الصف الأول الثانوي', semesters: [{ id: 'sem-1', name: 'الفصل الدراسي الأول' }, { id: 'sem-2', name: 'الفصل الدراسي الثاني' }, { id: 'sem-3', name: 'الفصل الدراسي الثالث' }] },
            { id: 'gr-high-2', name: 'الصف الثاني الثانوي', semesters: [{ id: 'sem-1', name: 'الفصل الدراسي الأول' }, { id: 'sem-2', name: 'الفصل الدراسي الثاني' }, { id: 'sem-3', name: 'الفصل الدراسي الثالث' }] },
            { id: 'gr-high-3', name: 'الصف الثالث الثانوي', semesters: [{ id: 'sem-1', name: 'الفصل الدراسي الأول' }, { id: 'sem-2', name: 'الفصل الدراسي الثاني' }, { id: 'sem-3', name: 'الفصل الدراسي الثالث' }] },
          ]
        }
      ]
    }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlGradeId = searchParams.get('gradeId');
      const urlSemesterId = searchParams.get('semesterId');
      const urlGradeSubjectId = searchParams.get('gradeSubjectId');
      const urlStageId = searchParams.get('stageId');
      if (urlStageId) setSelectedStageId(urlStageId);
      if (urlGradeId) setSelectedGradeId(urlGradeId);
      if (urlSemesterId) setSelectedSemesterId(urlSemesterId);
      if (urlGradeSubjectId) setSelectedSubjectId(urlGradeSubjectId);
    }
  }, []);

  useEffect(() => {
    const fetchStages = async () => {
      const data = await fetchFromDatabase('/stages');
      if (data && Array.isArray(data) && data.length > 0) {
        setStages(data);
        setIsServerConnected(true);
        return;
      }
      setStages(getFallbackStages());
      setIsServerConnected(false);
    };
    fetchStages();
  }, []);

  const selectedStage = stages.find(s => s.id === selectedStageId);
  const availableTracks = selectedStage?.tracks || [];
  const selectedTrack = availableTracks[0];
  const availableGrades = selectedTrack?.grades || [];
  const selectedGrade = selectedStageId ? availableGrades.find(g => g.id === selectedGradeId) : undefined;
  const defaultSemesters = [
    { id: 'sem-1', name: 'الفصل الدراسي الأول' },
    { id: 'sem-2', name: 'الفصل الدراسي الثاني' },
    { id: 'sem-3', name: 'الفصل الدراسي الثالث' }
  ];
  const availableSemesters = selectedGrade
    ? ((selectedGrade.semesters && selectedGrade.semesters.length > 0) ? selectedGrade.semesters : defaultSemesters)
    : [];
  const selectedSemester = selectedGradeId ? availableSemesters.find(s => s.id === selectedSemesterId) : undefined;
  const selectedSubjectObj = subjects.find(s => s.gradeSubjectId === selectedSubjectId || s.subjectId === selectedSubjectId);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedGradeId || !selectedSemesterId) {
        setSubjects([]);
        setSelectedSubjectId('');
        return;
      }
      const data = await fetchFromDatabase(`/subjects?gradeId=${selectedGradeId}&semesterId=${selectedSemesterId}`);
      if (data && Array.isArray(data) && data.length > 0) {
        setSubjects(data);
        setSelectedSubjectId(data[0].gradeSubjectId || data[0].id);
        setIsServerConnected(true);
        return;
      }
      setSubjects([]);
      setSelectedSubjectId('');
      showStatus('⚠️ لم يتم العثور على أي مواد في قاعدة البيانات لهذه المرحلة والفصل');
    };
    fetchSubjects();
  }, [selectedGradeId, selectedSemesterId]);

  const fetchActivities = async () => {
    if (!selectedSubjectId) {
      setActivities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchFromDatabase(`/activities?gradeSubjectId=${selectedSubjectId}`);
    if (data && Array.isArray(data) && data.length > 0) {
      setActivities(data);
      setSelectedLessonTitle('ALL');
      setSelectedActivityType('ALL');
      setLoading(false);
      setIsServerConnected(true);
      return;
    }
    setActivities([]);
    setSelectedLessonTitle('ALL');
    setSelectedActivityType('ALL');
    showStatus('لا توجد أنشطة مضافة لهذه المادة في قاعدة البيانات');
    setLoading(false);
    setIsServerConnected(false);
  };

  useEffect(() => {
    if (selectedSubjectId) {
      fetchActivities();
    } else {
      setActivities([]);
    }
  }, [selectedSubjectId]);

  const getActivityBadgeColor = (type: string) => {
    const t = (type || '').toUpperCase();
    switch (t) {
      case 'PDF':
        return { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3', label: '📄 ملف PDF', gradient: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)' };
      case 'VIDEO':
      case 'MP4':
        return { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd', label: '🎥 فيديو', gradient: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' };
      case 'GAME':
        return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: '🎮 لعبة تفاعلية', gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' };
      case 'WORKSHEET':
        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: '📝 ورقة عمل', gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' };
      case 'PRESENTATION':
        return { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff', label: '🖥️ عرض مرئي', gradient: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)' };
      case 'EXAM':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: '📋 اختبار وتقويم', gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' };
      case 'HOMEWORK':
        return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: '📚 واجب منزلي', gradient: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' };
      default:
        return { bg: '#fdf4ff', color: '#c026d3', border: '#f5d0fe', label: '🚀 مشروع تطبيقي', gradient: 'linear-gradient(135deg, #fae8ff 0%, #f5d0fe 100%)' };
    }
  };

  const [selectedLessonFilter, setSelectedLessonFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const allCombinedLessons = React.useMemo(() => {
    const set = new Set<string>();
    activities.forEach(a => {
      if (a.lessonTitle?.trim()) set.add(a.lessonTitle.trim());
    });
    return Array.from(set);
  }, [activities]);

  const databaseActivityTypes = React.useMemo(() => {
    const defaultTypes = [
      { id: 'ALL', title: '⭐ الكل' },
      { id: 'WORKSHEET', title: '📝 ورقة عمل' },
      { id: 'PRESENTATION', title: '🖥️ عرض مرئي' },
      { id: 'GAME', title: '🎮 لعبة تفاعلية' },
      { id: 'PROJECT', title: '🚀 مشروع تطبيقي' }
    ];

    const dbTypesSet = new Set<string>();
    activities.forEach(act => {
      act.items?.forEach(it => {
        if (it.type) dbTypesSet.add(it.type);
      });
    });

    if (dbTypesSet.size > 0) {
      const list = [{ id: 'ALL', title: '⭐ الكل' }];
      dbTypesSet.forEach(type => {
        const badge = getActivityBadgeColor(type);
        list.push({ id: type, title: badge.label });
      });
      return list;
    }

    return defaultTypes;
  }, [activities]);

  const filteredActivities = React.useMemo(() => {
    return activities
      .filter(act => {
        if (selectedLessonFilter && act.lessonTitle?.trim() !== selectedLessonFilter.trim()) {
          return false;
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const matchLesson = act.lessonTitle?.toLowerCase().includes(q);
        const matchItem = act.items?.some(it => it.title?.toLowerCase().includes(q) || it.url?.toLowerCase().includes(q));
        return matchLesson || matchItem;
      })
      .sort((a, b) => {
        const titleA = a.lessonTitle || '';
        const titleB = b.lessonTitle || '';
        return sortOrder === 'asc'
          ? titleA.localeCompare(titleB, 'ar')
          : titleB.localeCompare(titleA, 'ar');
      });
  }, [activities, selectedLessonFilter, searchQuery, sortOrder]);

  const activityItemCards = React.useMemo(() => {
    const cards: Array<{
      cardId: string;
      activity: LessonActivityItem;
      item: any;
      itemIndex: number;
    }> = [];

    filteredActivities.forEach(act => {
      if (act.items && Array.isArray(act.items) && act.items.length > 0) {
        act.items.forEach((item, itemIndex) => {
          if (selectedActivityType !== 'ALL' && item.type !== selectedActivityType) {
            return;
          }
          cards.push({
            cardId: `${act.id}-item-${itemIndex}`,
            activity: act,
            item,
            itemIndex,
          });
        });
      }
    });

    return cards;
  }, [filteredActivities, selectedActivityType]);



  return (
    <div className="activities-viewer-container" style={{ direction: 'rtl', padding: '4px 0', fontFamily: "'Cairo', sans-serif" }}>

      {statusMsg && (
        <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', color: '#065f46', border: '1px solid #6ee7b7', padding: '10px 16px', borderRadius: '12px', marginBottom: '14px', fontWeight: 700, textAlign: 'center', fontSize: '12.5px', boxShadow: '0 2px 8px rgba(16,185,129,0.12)' }}>
          {statusMsg}
        </div>
      )}

      {/* ── Filter Selection Card ── */}
      <div style={{
        background: 'linear-gradient(160deg, #f8f7ff 0%, #f0f9ff 50%, #fdf4ff 100%)',
        border: '1.5px solid rgba(167,139,250,0.2)',
        borderRadius: '24px',
        boxShadow: '0 8px 28px rgba(139,92,246,0.07), 0 2px 8px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', padding: '24px' }}>

          {/* Step 1: Stage (Always visible) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#6d28d9', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>1</span>
              اختر المرحلة الدراسية
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', width: '100%' }}>
              {stages.map(s => {
                const active = s.id === selectedStageId;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStageId(s.id); setSelectedGradeId(''); setSelectedSemesterId(''); setSelectedSubjectId(''); setSubjects([]); setActivities([]); }}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '50px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      border: active ? '2px solid #8b5cf6' : '1.5px solid #e2e8f0',
                      background: active ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : '#ffffff',
                      color: active ? '#ffffff' : '#64748b',
                      boxShadow: active ? '0 4px 14px rgba(139,92,246,0.35)' : '0 1px 4px rgba(0,0,0,0.04)',
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', borderTop: '1.5px solid rgba(16,185,129,0.12)', paddingTop: '14px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0d9488', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'linear-gradient(135deg,#34d399,#0d9488)', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>2</span>
                اختر الصف
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
                      onClick={() => { setSelectedGradeId(g.id); setSelectedSemesterId(''); setSelectedSubjectId(''); setSubjects([]); setActivities([]); }}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '50px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        border: active ? '2px solid #0d9488' : '1.5px solid #e2e8f0',
                        background: active ? 'linear-gradient(135deg, #34d399 0%, #0d9488 100%)' : '#ffffff',
                        color: active ? '#ffffff' : '#64748b',
                        boxShadow: active ? '0 4px 14px rgba(13,148,136,0.32)' : '0 1px 4px rgba(0,0,0,0.04)',
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', borderTop: '1.5px solid rgba(245,158,11,0.15)', paddingTop: '14px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#b45309', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'linear-gradient(135deg,#fbbf24,#d97706)', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>3</span>
                اختر الفصل الدراسي
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', width: '100%' }}>
                {availableSemesters.map(s => {
                  const active = s.id === selectedSemesterId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSemesterId(s.id); setSelectedSubjectId(''); setSubjects([]); setActivities([]); }}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '50px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        border: active ? '2px solid #acab7bff' : '1.5px solid #e2e8f0',
                        background: active ? 'linear-gradient(135deg, #fbbf24 0%, #e4c8a7ff 100%)' : '#ffffff',
                        color: active ? '#ffffff' : '#64748b',
                        boxShadow: active ? '0 4px 14px rgba(217,119,6,0.30)' : '0 1px 4px rgba(0,0,0,0.04)',
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '440px', borderTop: '1.5px solid rgba(236,72,153,0.15)', paddingTop: '14px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#be185d', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'linear-gradient(135deg,#f472b6,#be185d)', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>4</span>
                اختر المادة
              </div>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '50px',
                  border: '2px solid #f9a8d4',
                  background: 'linear-gradient(135deg,#fff0f9,#fce7f3)',
                  color: '#dba2a9ff',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 14px rgba(190,24,93,0.10)',
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

        </div>

        {/* Bottom Summary Bar */}
        <div style={{
          background: 'linear-gradient(90deg,#f5f3ff 0%,#ecfdf5 50%,#fff7ed 100%)',
          borderTop: '1.5px solid rgba(167,139,250,0.15)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {selectedStage && <span style={{ padding: '6px 16px', borderRadius: '50px', fontSize: '12.5px', fontWeight: 700, background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', color: '#5b21b6', boxShadow: '0 2px 6px rgba(139,92,246,0.12)' }}>{selectedStage.name} ✓</span>}
          {selectedGrade && <span style={{ padding: '6px 16px', borderRadius: '50px', fontSize: '12.5px', fontWeight: 700, background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', color: '#065f46', boxShadow: '0 2px 6px rgba(16,185,129,0.12)' }}>{selectedGrade.name} ✓</span>}
          {selectedSemester && <span style={{ padding: '6px 16px', borderRadius: '50px', fontSize: '12.5px', fontWeight: 700, background: 'linear-gradient(135deg,#fef3c7,#fde68a)', color: '#ccbf6aff', boxShadow: '0 2px 6px rgba(245,158,11,0.12)' }}>{selectedSemester.name} ✓</span>}
          {selectedSubjectObj && <span style={{ padding: '6px 16px', borderRadius: '50px', fontSize: '12.5px', fontWeight: 700, background: 'linear-gradient(135deg,#fce7f3,#fbcfe8)', color: '#9d174d', boxShadow: '0 2px 6px rgba(236,72,153,0.12)' }}>{selectedSubjectObj.name} ✓</span>}
        </div>
      </div>

      {/* ── Toolbar ── */}
      {selectedSubjectId && (activities.length > 0 || allCombinedLessons.length > 0) && (
        <div className="activities-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, background: 'rgba(16, 232, 160, 0.08)', border: '1.5px solid rgba(167,139,250,0.2)', borderRadius: 18, padding: '12px 18px', boxShadow: '0 4px 16px rgba(139,92,246,0.06)' }}>
          <div className="toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#5b21b6' }}>الأنشطة</h3>
            <span style={{ fontSize: 11.5, background: 'linear-gradient(135deg,#ddd6fe,#ede9fe)', color: '#5b21b6', padding: '4px 12px', borderRadius: 50, fontWeight: 800, boxShadow: '0 2px 6px rgba(139,92,246,0.15)' }}>{activityItemCards.length} نشاط</span>
          </div>

          <div className="toolbar-right" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter by Lesson Dropdown */}
            {allCombinedLessons.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', whiteSpace: 'nowrap' }}>
                  عرض أنشطة درس:
                </span>
                <select
                  value={selectedLessonFilter}
                  onChange={e => setSelectedLessonFilter(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 50,
                    border: selectedLessonFilter ? '2px solid #7c3aed' : '1.5px solid #ddd6fe',
                    background: selectedLessonFilter ? '#ede9fe' : '#ffffff',
                    color: '#3b0764',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    outline: 'none',
                    maxWidth: 220,
                    fontFamily: "'Cairo', sans-serif"
                  }}
                >
                  <option value="">جميع الدروس  ({allCombinedLessons.length}) </option>
                  {allCombinedLessons.map((lTitle, idx) => (
                    <option key={idx} value={lTitle}>{lTitle}</option>
                  ))}
                </select>
                {selectedLessonFilter && (
                  <button
                    onClick={() => setSelectedLessonFilter('')}
                    style={{ fontSize: 11, padding: '5px 10px', borderRadius: 50, border: '1.5px solid #ddd6fe', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', fontWeight: 700 }}
                    title="إلغاء تصفية الدرس"
                  >
                    ✖ إلغاء
                  </button>
                )}
              </div>
            )}

            {/* Filter by Type Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', whiteSpace: 'nowrap' }}>
                🎯 النوع:
              </span>
              <select
                value={selectedActivityType}
                onChange={e => setSelectedActivityType(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 50,
                  border: '1.5px solid #ddd6fe',
                  background: '#ffffff',
                  color: '#3b0764',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  outline: 'none',
                  fontFamily: "'Cairo', sans-serif"
                }}
              >
                {databaseActivityTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1.5px solid #ddd6fe', borderRadius: 50, padding: '6px 14px', boxShadow: '0 1px 4px rgba(139,92,246,0.08)' }}>
              <span style={{ fontSize: 13, color: '#a78bfa' }}>🔍</span>
              <input
                type="text"
                placeholder="بحث عن نشاط أو درس..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12.5, fontWeight: 600, color: '#3b0764', width: 160, fontFamily: "'Cairo', sans-serif" }}
              />
            </div>

            {/* Sort Toggle Button */}
            <button
              type="button"
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 50,
                border: '1.5px solid #a78bfa',
                background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
                color: '#6d28d9',
                fontFamily: "'Cairo', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                outline: 'none',
              }}
              title="اضغط لتغيير اتجاه الترتيب"
            >
              <span>⇅ {sortOrder === 'asc' ? 'أبجدي (أ - ي)' : 'تنازلي (ي - أ)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Inline Preview Box ── */}
      {activePreview && (
        <div style={{
          background: 'linear-gradient(135deg,#fdf4ff 0%,#f0fdf4 100%)',
          border: '2px solid #a7f3d0',
          borderRadius: '20px',
          padding: '18px 22px',
          marginBottom: '20px',
          boxShadow: '0 8px 28px rgba(16,185,129,0.10)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #d1fae5', paddingBottom: '12px', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '11.5px', background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', color: '#065f46', padding: '4px 12px', borderRadius: '50px', fontWeight: 800, marginLeft: '8px' }}>
                معاينة النشاط
              </span>
              <span style={{ fontSize: '14.5px', fontWeight: 900, color: '#065f46' }}>
                {activePreview.item.title}
              </span>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px', fontWeight: 600 }}>📖 الدرس: {activePreview.lessonTitle}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  if (activePreview.item.url) window.open(activePreview.item.url, '_blank');
                  else window.open('game.html', '_blank');
                }}
                style={{ background: 'linear-gradient(135deg,#34d399,#059669)', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.25)' }}
              >
                🚀 فتح في نافذة كاملة
              </button>
              <button
                onClick={() => setActivePreview(null)}
                style={{ background: '#ffffff', color: '#6b7280', border: '1.5px solid #e5e7eb', padding: '8px 14px', borderRadius: '50px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                إغلاق ✖
              </button>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '16px', padding: '24px', border: '1.5px dashed #a7f3d0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '48px' }}>
              {activePreview.item.type === 'GAME' ? '🎮' : activePreview.item.type === 'PRESENTATION' ? '🖥️' : activePreview.item.type === 'WORKSHEET' ? '📝' : '💡'}
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#065f46', fontWeight: 900 }}>{activePreview.item.title}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', maxWidth: '500px', lineHeight: 1.6 }}>
              {activePreview.item.type === 'GAME'
                ? 'لعبة تعليمية تفاعلية ثلاثية الأبعاد (3D) من قاعدة بيانات المنصة.'
                : 'نشاط تعليمي تفاعلي مرتبط بأهداف الدرس.'}
            </p>
            <button
              onClick={() => {
                if (activePreview.item.type === 'GAME') window.open('game.html', '_blank');
                else if (activePreview.item.url) window.open(activePreview.item.url, '_blank');
                else showStatus('تم فتح ورقة العمل التفاعلية ✅');
              }}
              style={{ background: 'linear-gradient(135deg,#34d399,#059669)', color: 'white', border: 'none', padding: '11px 26px', borderRadius: '50px', fontSize: '13.5px', fontWeight: 800, cursor: 'pointer', marginTop: '6px', boxShadow: '0 4px 16px rgba(5,150,105,0.28)' }}
            >
              {activePreview.item.type === 'GAME' ? '🎮 تشغيل اللعبة الآن 3D' : '▶️ مشاهدة المحتوى التفاعلي'}
            </button>
          </div>
        </div>
      )}

      {/* ── Activity Cards Grid ── */}
      {!selectedSubjectId ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(160deg,#fdf4ff,#f0f9ff)', borderRadius: 24, border: '1.5px solid rgba(167,139,250,0.2)', boxShadow: '0 4px 16px rgba(139,92,246,0.05)' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📚</div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#5b21b6', margin: '0 0 8px 0' }}>حدد المادة أولاً</h3>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>اختر المرحلة والصف والفصل والمادة من الأعلى لعرض الأنشطة</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(135deg,#fdf4ff,#eff6ff)', borderRadius: 24, color: '#7c3aed', fontWeight: 800, fontSize: 15, border: '1.5px solid rgba(167,139,250,0.2)' }}>⏳ جاري تحميل أنشطة الدروس من قاعدة البيانات...</div>
      ) : activityItemCards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: 'linear-gradient(160deg,#fff7ed,#fdf4ff)', borderRadius: 24, border: '2px dashed #e9d5ff', color: '#94a3b8' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📭</div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#5b21b6', margin: '0 0 8px 0' }}>
            {selectedLessonFilter ? `لا توجد أنشطة مضافة لدرس "${selectedLessonFilter}"` : searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد أنشطة مضافة لهذه المادة بعد'}
          </h3>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            {selectedLessonFilter ? 'قم بإلغاء التصفية لعرض باقي الدروس' : searchQuery ? 'جرب البحث بكلمات أخرى' : 'يمكنك إضافة أنشطة جديدة للمادة من لوحة التحكم'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {activityItemCards.map(({ cardId, activity, item }) => {
            const hasCover = item.thumbnailUrl;
            const badge = getActivityBadgeColor(item.type);
            return (
              <div
                key={cardId}
                style={{
                  background: '#ffffff',
                  border: `1.5px solid ${badge.border}`,
                  borderRadius: 20,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: `0 4px 16px ${badge.border}55`,
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px) scale(1.01)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 36px ${badge.border}88`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${badge.border}55`;
                }}
                onClick={() => {
                  if (item.url) window.open(item.url, '_blank');
                  else setActivePreview({ lessonTitle: activity.lessonTitle, item });
                }}
              >
                {/* Cover / Header */}
                <div style={{ width: '100%', height: '130px', position: 'relative', background: badge.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {hasCover ? (
                    <img
                      src={hasCover}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ fontSize: 48, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}>
                      {item.type === 'GAME' ? '🎮' : item.type === 'PRESENTATION' ? '🖥️' : item.type === 'WORKSHEET' ? '📝' : item.type === 'EXAM' ? '📋' : '💡'}
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', padding: '4px 12px', borderRadius: 50, fontSize: 10.5, fontWeight: 800, color: badge.color, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                    {badge.label}
                  </div>
                </div>

                {/* Info Body */}
                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>📖 الدرس:</span>
                    <span style={{ color: '#374151', fontWeight: 700 }}>{activity.lessonTitle}</span>
                  </div>
                  <div style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: '#111827',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    🎯 {item.title || 'نشاط بدون عنوان'}
                  </div>
                </div>

                {/* Card Footer */}
                <div style={{ padding: '10px 16px', borderTop: `1px solid ${badge.border}`, background: badge.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: badge.color, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                    👁️ عرض النشاط
                  </span>
                  <span style={{ fontSize: 10.5, color: badge.color, fontWeight: 600, opacity: 0.75 }}>✨ تفاعلي</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
