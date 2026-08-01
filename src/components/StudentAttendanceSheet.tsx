import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface StudentItem {
  id: string;
  number: number;
  name: string;
}

const PORTAL_API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URLS = [
  PORTAL_API,
  'https://api.wsyelhi.com/api',
  'http://localhost:4001/api',
];

export const StudentAttendanceSheet: React.FC = () => {
  const [reportTitle, setReportTitle] = useState('سجل الحضور والغياب اليومي للطلاب');
  const [schoolName, setSchoolName] = useState('المدرسة الابتدائية / المتوسطة / الثانوية');
  const [teacherName, setTeacherName] = useState('معلم/ة المادة');
  const [subjectName, setSubjectName] = useState('القرآن الكريم والدراسات الإسلامية');
  const [gradeName, setGradeName] = useState('الصف الأول - الفصل الأول (شعبة ١)');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Bulk paste modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [newStudentName, setNewStudentName] = useState('');

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 4500);
  };

  // No automatic random names - students must be uploaded via Excel or entered manually
  const handleAddBlankStudentRow = () => {
    const nextNum = students.length + 1;
    const newStd: StudentItem = {
      id: `std-${Date.now()}`,
      number: nextNum,
      name: `طالب جديد ${nextNum} (انقر للتعديل)`
    };
    setStudents([...students, newStd]);
    showStatus('تم إضافة طالب جديد، يمكنك النقر على الاسم لتعديله ✏️');
  };

  const handleClearAllStudents = () => {
    if (students.length === 0) return;
    if (window.confirm('هل أنت متأكد من مسح جميع الأسماء في القائمة؟')) {
      setStudents([]);
      showStatus('تم مسح قائمة الطلاب بنجاح 🗑️');
    }
  };



  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        const extractedNames: string[] = [];
        const ignoreHeaders = [
          'المملكة العربية السعودية',
          'وزارة التعليم',
          'الإدارة العامة',
          'اسم الطالب',
          'اسم الطالبة',
          'سجل الحضور',
          'كشف بأسماء',
          'رقم السجل',
          'المجموع الكلي',
          'توقيع المعلم',
          'مدير المدرسة',
          'ReportID',
          'VISION',
          'النظام الدراسي'
        ];

        // Strategy 1: Find the column index of "اسم الطالب" / "الاسم" / "Student Name"
        let nameColIdx = -1;
        let headerRowIdx = -1;

        for (let r = 0; r < Math.min(aoa.length, 25); r++) {
          const row = aoa[r];
          if (Array.isArray(row)) {
            for (let c = 0; c < row.length; c++) {
              const val = String(row[c] || '').trim();
              if (
                val.includes('اسم الطالب') ||
                val.includes('اسم الطالبة') ||
                val === 'الاسم' ||
                val === 'الأسماء' ||
                val.toLowerCase().includes('student name') ||
                val.includes('اسم رباعي') ||
                val.includes('اسم الطالب رباعي')
              ) {
                nameColIdx = c;
                headerRowIdx = r;
                break;
              }
            }
          }
          if (nameColIdx !== -1) break;
        }

        if (nameColIdx !== -1 && headerRowIdx !== -1) {
          // Extract names from that specific column below headerRowIdx
          for (let r = headerRowIdx + 1; r < aoa.length; r++) {
            const row = aoa[r];
            if (Array.isArray(row) && row[nameColIdx] !== undefined && row[nameColIdx] !== null) {
              const cellText = String(row[nameColIdx]).trim();
              const isIgnored = ignoreHeaders.some(w => cellText.includes(w));
              if (
                cellText.length >= 5 &&
                !isIgnored &&
                !/^\d+$/.test(cellText) &&
                cellText.split(/\s+/).length >= 2
              ) {
                if (!extractedNames.includes(cellText)) {
                  extractedNames.push(cellText);
                }
              }
            }
          }
        }

        // Strategy 2: If no explicit header column found (or extracted 0 names), scan all cells
        if (extractedNames.length === 0) {
          aoa.forEach((row) => {
            if (Array.isArray(row)) {
              row.forEach((cell) => {
                if (cell !== undefined && cell !== null) {
                  const text = String(cell).trim();
                  const wordCount = text.split(/\s+/).length;
                  const isIgnored = ignoreHeaders.some(w => text.includes(w));
                  const containsNumbers = /[0-9\/\\:\-]/.test(text);
                  if (!isIgnored && !containsNumbers && wordCount >= 2 && text.length >= 6 && text.length <= 60) {
                    if (!extractedNames.includes(text)) {
                      extractedNames.push(text);
                    }
                  }
                }
              });
            }
          });
        }

        if (extractedNames.length > 0) {
          setStudents(prev => {
            const existingNames = new Set(prev.map(s => s.name.trim()));
            const newItems: StudentItem[] = [];

            extractedNames.forEach((name, i) => {
              const cleanName = name.trim();
              if (!existingNames.has(cleanName)) {
                newItems.push({
                  id: `std-xls-${Date.now()}-${i}`,
                  number: 0,
                  name: cleanName
                });
                existingNames.add(cleanName);
              }
            });

            const combined = [...prev, ...newItems];
            return combined.map((s, index) => ({ ...s, number: index + 1 }));
          });
          showStatus(`تم استيراد ${extractedNames.length} اسم طالب/ة وإضافتهم إلى القائمة الحالية بنجاح! 🚀`);
        } else {
          showStatus('لم نتمكن من العثور على أسماء طلاب عربية في الملف. تأكد من وجود عمود "اسم الطالب".');
        }
      } catch (err: any) {
        console.error('Excel parse error:', err);
        showStatus('حدث خطأ أثناء قراءة ملف Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    processExcelFile(file);
  };

  const handleReadSelectedFile = () => {
    if (selectedFile) {
      processExcelFile(selectedFile);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleAddSingleStudent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newStudentName.trim()) {
      showStatus('الرجاء كتابة اسم الطالب/ة أولاً');
      return;
    }
    const nextNum = students.length + 1;
    const newStudent: StudentItem = {
      id: `std-man-${Date.now()}`,
      number: nextNum,
      name: newStudentName.trim()
    };
    setStudents([...students, newStudent]);
    setNewStudentName('');
    showStatus('تمت إضافة الاسم بنجاح');
  };

  const handleAddBulkNames = () => {
    const lines = bulkText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2);

    if (lines.length === 0) {
      showStatus('الرجاء لصق قائمة أسماء صحيحة');
      return;
    }

    const startNum = students.length + 1;
    const newItems: StudentItem[] = lines.map((name, idx) => ({
      id: `std-bulk-${Date.now()}-${idx}`,
      number: startNum + idx,
      name
    }));

    setStudents([...students, ...newItems]);
    setBulkText('');
    setShowBulkModal(false);
    showStatus(`تمت إضافة ${newItems.length} اسم بنجاح! ✨`);
  };

  const handleDeleteStudent = (id: string) => {
    const updated = students
      .filter(s => s.id !== id)
      .map((s, idx) => ({ ...s, number: idx + 1 }));
    setStudents(updated);
  };

  const startEdit = (student: StudentItem) => {
    setEditingId(student.id);
    setEditingName(student.name);
  };

  const saveEdit = (id: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, name: editingName } : s));
    setEditingId(null);
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const aoa: any[][] = [];
      aoa.push([`المملكة العربية السعودية — وزارة التعليم | ${reportTitle} | منصة وسيلة — رؤية 2030`]);
      aoa.push([`المادة / المقرر: ${subjectName}`, `الشعبة / الصف: ${gradeName}`, `المؤسسة: ${schoolName}`]);
      aoa.push([]);

      const headerRow = ['م', 'اسم الطالبة / الطالب'];
      for (let w = 1; w <= 18; w++) {
        headerRow.push(`الأسبوع ${w}`);
      }
      aoa.push(headerRow);

      students.forEach((s) => {
        const rowData: any[] = [s.number, s.name];
        for (let w = 1; w <= 18; w++) {
          rowData.push('88888');
        }
        aoa.push(rowData);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);

      ws['!cols'] = [
        { wch: 5 },
        { wch: 28 },
        ...Array(18).fill({ wch: 10 })
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'سجل الحضور اليومي');
      XLSX.writeFile(wb, `${reportTitle} - ${subjectName}.xlsx`);
      showStatus('تم تصدير ملف Excel (.xlsx) الرسمي بنجاح 📊');
    } catch (err: any) {
      console.error(err);
      showStatus('حدث خطأ أثناء تصدير ملف Excel');
    }
  };

  const weeksNumbers = Array.from({ length: 18 }, (_, i) => i + 1);

  /* ─── Client-side HD PDF generator (Full A4 Page Fill) ─── */
  const generatePDFLocally = async () => {
    const el = document.getElementById('ext-printable-attendance');
    if (!el) {
      showStatus('لم يتم العثور على نموذج الطباعة');
      return;
    }
    showStatus('جاري تحضير ملف PDF عالي الجودة كامل الصفحة... ⚙️');
    try {
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      // Full A4 Landscape stretch (0mm margins) for full-page presentation
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`سجل-الحضور-${subjectName || 'المادة'}.pdf`);
      showStatus('تم تحميل ملف PDF بنجاح 🎉');
    } catch (err: any) {
      console.error(err);
      showStatus('حدث خطأ أثناء إنشاء ملف PDF');
    }
  };

  /* ─── Fast & Direct PDF Download via Puppeteer Backend Server ─── */
  const handleDownloadPDF = async () => {
    if (students.length === 0) {
      showStatus('يرجى إضافة أسماء الطلاب أولاً قبل التحميل');
      return;
    }

    const printableEl = document.getElementById('ext-printable-attendance');
    if (printableEl) {
      showStatus('جاري تحضير وتوليد ملف PDF المعتمد عبر سيرفر Puppeteer... ⚙️');
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page { size: A4 landscape; margin: 0mm; }
            * { box-sizing: border-box; font-family: 'Cairo', sans-serif; }
            body { margin: 0; padding: 0; background: #ffffff; direction: rtl; width: 100vw; height: 100vh; }
            #ext-printable-attendance { width: 100vw !important; height: 100vh !important; box-sizing: border-box !important; margin: 0 !important; padding: 1.5mm 2mm !important; border-radius: 0 !important; border: 1.5px solid #059669 !important; }
          </style>
        </head>
        <body>
          ${printableEl.outerHTML}
        </body>
        </html>
      `;
      for (const baseUrl of API_URLS) {
        try {
          const res = await fetch(`${baseUrl}/generate-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html: htmlContent, title: `سجل-الحضور-${subjectName || 'المادة'}` })
          });
          if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `سجل-الحضور-${subjectName || 'المادة'}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            showStatus('تم تحميل ملف PDF المعتمد من سيرفر Puppeteer بنجاح 🚀');
            return;
          }
        } catch { /* try next */ }
      }
    }

    // Fallback to local generator
    await generatePDFLocally();
  };

  return (
    <div className="student-attendance-sheet-container" style={{ direction: 'rtl', padding: '10px 0' }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #ext-printable-attendance, #ext-printable-attendance * {
            visibility: visible !important;
          }
          #ext-printable-attendance {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 2px !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .vision-2030-badge {
            display: none !important;
          }
          .empty-state-row {
            display: none !important;
          }
          * {
            overflow: visible !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          ::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          @page {
            size: A4 landscape;
            margin: 2mm;
          }
        }
      `}</style>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls, .csv"
        style={{ display: 'none' }}
      />



      {statusMsg && (
        <div className="no-print" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #10b981', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold', textAlign: 'center' }}>
          {statusMsg}
        </div>
      )}

      {/* Control inputs card */}
      <div className="no-print" style={{ background: '#ffffff', border: '1.5px solid #0d9488', borderRadius: '12px', marginBottom: '20px', padding: '16px', boxShadow: '0 4px 12px rgba(15,118,110,0.08)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#0f766e', marginBottom: '4px' }}>المدرسة:</label>
            <input
              type="text"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #99f6e4', background: '#ffffff', color: '#0f172a', fontWeight: '600', fontSize: '12.5px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#0f766e', marginBottom: '4px' }}>المعلم/ة:</label>
            <input
              type="text"
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #99f6e4', background: '#ffffff', color: '#0f172a', fontWeight: '600', fontSize: '12.5px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#0f766e', marginBottom: '4px' }}>المادة / المقرر:</label>
            <input
              type="text"
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #99f6e4', background: '#ffffff', color: '#0f172a', fontWeight: '600', fontSize: '12.5px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#0f766e', marginBottom: '4px' }}>الشعبة / الصف:</label>
            <input
              type="text"
              value={gradeName}
              onChange={e => setGradeName(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #99f6e4', background: '#ffffff', color: '#0f172a', fontWeight: '600', fontSize: '12.5px', outline: 'none' }}
            />
          </div>
        </div>

        {/* Action buttons bar - Compact and side by side */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #ccfbf1', paddingTop: '12px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', border: '1px solid #0d9488', borderRadius: '7px', padding: '2px 3px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'transparent',
                  color: '#0f766e',
                  border: 'none',
                  fontWeight: 'bold',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>📂</span>
                <span>رفع Excel</span>
              </button>
              <button
                onClick={handleReadSelectedFile}
                style={{
                  background: 'linear-gradient(135deg, rgb(15, 118, 110), rgb(13, 148, 136))',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 'bold',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 5px rgba(15, 118, 110, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>🔍</span>
                <span>اقرأ الملف</span>
              </button>
            </div>

            <button
              onClick={() => setShowBulkModal(true)}
              style={{
                background: '#ffffff',
                color: '#0f766e',
                border: '1px solid #99f6e4',
                fontWeight: 'bold',
                padding: '6px 11px',
                borderRadius: '7px',
                fontSize: '11.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ✏️ لصق قائمة أسماء
            </button>
            {/* Direct Input Box with Add Student Button */}
            <form
              onSubmit={handleAddSingleStudent}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ffffff', border: '1.5px solid #0d9488', borderRadius: '8px', padding: '2px 4px' }}
            >
              <input
                type="text"
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                placeholder="اكتب اسم الطالب هنا..."
                style={{
                  border: 'none',
                  outline: 'none',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0f172a',
                  width: '165px',
                  background: 'transparent'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, rgb(15, 118, 110), rgb(13, 148, 136))',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 'bold',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(15, 118, 110, 0.25)'
                }}
              >
                ➕ إضافة
              </button>
            </form>

            <button
              onClick={handleAddBlankStudentRow}
              style={{
                background: '#f0fdf4',
                color: '#0f766e',
                border: '1px solid #99f6e4',
                fontWeight: 'bold',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '11.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ➕ إضافة صف فارغ
            </button>
            {students.length > 0 && (
              <button
                onClick={handleClearAllStudents}
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  fontWeight: 'bold',
                  padding: '6px 11px',
                  borderRadius: '7px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🗑️ مسح القائمة
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExportExcel}
              className="mc-btn"
              style={{ background: '#15803d', color: '#ffffff', border: 'none', fontWeight: 'bold', padding: '8px 16px', borderRadius: '8px' }}
            >
              📊 تحميل Excel (.xlsx)
            </button>
            <button
              onClick={handleDownloadPDF}
              className="mc-btn"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 'bold',
                padding: '8px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px'
              }}
            >
              📄 تحميل PDF
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Paste Modal */}
      {showBulkModal && (
        <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '22px', width: '100%', maxWidth: '480px', direction: 'rtl' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '17px', fontWeight: 'bold' }}>لصق قائمة أسماء الطلاب (كل اسم في سطر)</h3>
            <textarea
              rows={7}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder="سارة بنت محمد العتيبي&#10;نورة بنت عبد الله القحطاني&#10;فاطمة بنت خالد الدوسري..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', marginBottom: '14px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowBulkModal(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleAddBulkNames}
                style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
              >
                إضافة الأسماء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Sheet exactly matching the official Ministry layout */}
      <div
        id="ext-printable-attendance"
        style={{
          background: '#ffffff',
          border: '2px solid #059669',
          borderRadius: '16px',
          padding: '18px 24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          direction: 'rtl',
          color: '#0f172a'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr 1.4fr 1.3fr',
            alignItems: 'center',
            borderBottom: '2.5px solid #059669',
            paddingBottom: '14px',
            marginBottom: '14px'
          }}
        >
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#065f46', lineHeight: 1.5 }}>
            <div>المملكة العربية السعودية</div>
            <div>وزارة التعليم</div>
            <div>الإدارة العامة للتعليم بمنطقة ........................</div>
            <div>مدرسة: <strong>{schoolName}</strong></div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgb(15, 118, 110), rgb(13, 148, 136))',
                color: '#ffffff',
                padding: '7px 28px',
                borderRadius: '50px',
                fontSize: '19px',
                fontWeight: 900,
                display: 'inline-block',
                boxShadow: '0 3px 10px rgba(15, 118, 110, 0.25)'
              }}
            >
              {reportTitle}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '6px 14px', borderRadius: '12px', border: '1.5px solid #a7f3d0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <img
                src="/logo.png"
                alt="وسيلة"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = 'https://api.wsyelhi.com/wsylh-logo-full.png';
                }}
                style={{ height: '68px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>

        {/* Sub-Header bar full 100% width */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f0fdf4',
            border: '1.5px solid #0f766e',
            borderRadius: '10px',
            padding: '8px 18px',
            fontSize: '13.5px',
            fontWeight: 800,
            color: '#0f766e',
            width: '100%',
            margin: '0 0 14px 0'
          }}
        >
          <div>
            <span style={{ color: '#0d9488' }}>المادة / المقرر : </span>
            <span>{subjectName}</span>
          </div>
          <div>
            <span style={{ color: '#0d9488' }}>الشعبة / الصف : </span>
            <span>{gradeName}</span>
          </div>
        </div>

        {/* 18 Weeks Attendance Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            textAlign: 'center',
            border: '1.5px solid #0f766e'
          }}
        >
          <thead>
            <tr>
              <th style={{ background: 'linear-gradient(135deg, rgb(15, 118, 110), rgb(13, 148, 136))', color: '#fff', border: '1px solid #0d9488', padding: '8px 4px', width: '35px' }}>
                م
              </th>
              <th style={{ background: 'linear-gradient(135deg, rgb(15, 118, 110), rgb(13, 148, 136))', color: '#fff', border: '1px solid #0d9488', padding: '8px 10px', minWidth: '170px' }}>
                اسم الطالب / الطالبة
              </th>
              {weeksNumbers.map(num => (
                <th
                  key={num}
                  style={{
                    background: 'linear-gradient(135deg, rgb(15, 118, 110), rgb(13, 148, 136))',
                    color: '#fff',
                    border: '1px solid #0d9488',
                    padding: '4px 2px',
                    fontSize: '10px',
                    minWidth: '40px'
                  }}
                >
                  <div style={{ marginBottom: '2px' }}>الأسبوع</div>
                  <div
                    style={{
                      display: 'inline-block',
                      width: '18px',
                      height: '18px',
                      lineHeight: '16px',
                      borderRadius: '50%',
                      background: '#fff',
                      color: '#0f766e',
                      fontWeight: 900,
                      fontSize: '10px'
                    }}
                  >
                    {num}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr className="empty-state-row no-print">
                <td colSpan={22} style={{ padding: '40px 16px', textAlign: 'center', background: '#f0fdf4', color: '#64748b' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#0f766e', marginBottom: '6px' }}>
                    قائمة الطلاب فارغة حالياً
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    قم برفع ملف <strong>Excel (.xlsx)</strong> من زر (رفع Excel) بالأعلى، أو اضغط على <strong>(➕ إضافة)</strong> لإدخال الأسماء يدوياً.
                  </div>
                </td>
              </tr>
            ) : (
              students.map(s => (
                <tr key={s.id} style={{ background: s.number % 2 === 0 ? '#ecfdf5' : '#ffffff' }}>
                  <td style={{ border: '1px solid #6ee7b7', padding: '4px', fontWeight: 800, color: '#065f46', background: s.number % 2 === 0 ? '#d1fae5' : '#f0fdf4', textAlign: 'center' }}>
                    {s.number}
                  </td>
                  <td style={{ border: '1px solid #6ee7b7', padding: '4px 8px', textAlign: 'right', fontWeight: 700, color: '#1f2937' }}>
                    {editingId === s.id ? (
                      <div className="no-print" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          style={{ flex: 1, padding: '2px 6px', fontSize: '12px', border: '1px solid #059669', borderRadius: '4px' }}
                        />
                        <button onClick={() => saveEdit(s.id)} style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer' }}>✓</button>
                        <button onClick={() => setEditingId(null)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{s.name}</span>
                        <div className="no-print" style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => startEdit(s)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}>✎</button>
                          <button onClick={() => handleDeleteStudent(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}>✕</button>
                        </div>
                      </div>
                    )}
                  </td>
                  {weeksNumbers.map(num => (
                    <td key={num} style={{ border: '1px solid #6ee7b7', padding: '4px 2px', textAlign: 'center', background: s.number % 2 === 0 ? '#f0fdf4' : '#ffffff' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              border: '1.5px solid #10b981',
                              display: 'inline-block',
                              background: '#ffffff'
                            }}
                          />
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer verification & Wsylh branding */}
        <div
          style={{
            marginTop: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1.5px dashed #cbd5e1',
            paddingTop: '10px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#475569'
          }}
        >
          <div>
            <span>المؤسسة التعليمية: </span>
            <strong style={{ color: '#0f766e' }}>{schoolName}</strong>
          </div>
          <div>
            <span>توقيع معلم/ة المادة: </span>
            <strong style={{ color: '#0f766e' }}>..........................................</strong>
          </div>
          <div>
            <span>اعتماد مدير/ة المدرسة: </span>
            <strong style={{ color: '#0f766e' }}>..........................................</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
