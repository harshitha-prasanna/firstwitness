import jsPDF from 'jspdf';

export function generateEvidencePDF(caseData, address, aiSummary = '', voiceInstruction = '') {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 0;

  // ── Header bar ──────────────────────────────────────────
  doc.setFillColor(230, 57, 70); // #E63946
  doc.rect(0, 0, pageWidth, 8, 'F');

  y = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text('FIRSTWITNESS', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text('Evidence Documentation Report', margin, y + 18);

  // BSA badge top right
  doc.setFillColor(230, 57, 70);
  doc.roundedRect(pageWidth - margin - 140, y - 20, 140, 22, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('BSA 2023 COMPLIANT', pageWidth - margin - 130, y - 5);

  y += 40;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);

  // ── Case details box ────────────────────────────────────
  y += 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text('Case Details', margin, y);

  y += 10;
  doc.setDrawColor(230, 57, 70);
  doc.setLineWidth(1.2);
  doc.line(margin, y, margin + 90, y);

  const addressText = address?.fullAddress || (caseData.location ? `${caseData.location.lat.toFixed(5)}, ${caseData.location.lng.toFixed(5)}` : '—');

  const details = [
    ['Incident Type', (caseData.crimeType || 'Unknown').toUpperCase()],
    ['Case Started', caseData.timestamp ? new Date(caseData.timestamp).toLocaleString('en-IN') : '—'],
    ['Incident Address', addressText],
    ['Photos Captured', `${caseData.photos?.length || 0}`],
    ['Language', (caseData.language || 'en').toUpperCase()],
    ['Report Generated', new Date().toLocaleString('en-IN')],
  ];

  y += 24;
  doc.setFontSize(10);
  details.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(String(val), pageWidth - margin - 150 - margin);
    doc.text(lines, margin + 150, y);
    y += 18 * lines.length + 2;
  });

  // ── Chain of custody table ──────────────────────────────
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text('Chain of Custody Log', margin, y);
  y += 10;
  doc.setDrawColor(230, 57, 70);
  doc.line(margin, y, margin + 150, y);

  y += 20;
  const colX = [margin, margin + 30, margin + 190, margin + 340, margin + 460];
  const headers = ['#', 'Step', 'Timestamp (Local)', 'GPS', 'Status'];

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 14, pageWidth - margin * 2, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  headers.forEach((h, i) => doc.text(h, colX[i], y));

  y += 22;
  doc.setFont('helvetica', 'normal');
  (caseData.photos || []).forEach((photo, i) => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    if (i % 2 === 0) {
      doc.setFillColor(255, 245, 245);
      doc.rect(margin, y - 14, pageWidth - margin * 2, 20, 'F');
    }
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(String(i + 1), colX[0], y);
    doc.text(photo.stepTitle || `Step ${i + 1}`, colX[1], y, { maxWidth: 150 });
    doc.text(new Date(photo.timestamp).toLocaleString('en-IN'), colX[2], y);
    doc.text(photo.lat ? `${photo.lat.toFixed(4)}, ${photo.lng.toFixed(4)}` : '—', colX[3], y);
    doc.setTextColor(37, 211, 102);
    doc.text('Verified', colX[4], y);
    y += 20;
  });

  // ── Photos section ───────────────────────────────────────
  if (caseData.photos?.length > 0) {
    doc.addPage();
    y = 50;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text('Photographic Evidence', margin, y);
    y += 10;
    doc.setDrawColor(230, 57, 70);
    doc.line(margin, y, margin + 170, y);
    y += 20;

    const imgW = 240;
    const imgH = 180;
    let x = margin;
    let col = 0;

    caseData.photos.forEach((photo, i) => {
      if (y + imgH > 760) {
        doc.addPage();
        y = 50;
        x = margin;
        col = 0;
      }
      try {
        doc.addImage(photo.data, 'JPEG', x, y, imgW, imgH);
      } catch (e) {
        doc.setFillColor(230, 230, 230);
        doc.rect(x, y, imgW, imgH, 'F');
      }
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`Photo ${i + 1}: ${photo.stepTitle || ''}`, x, y + imgH + 14);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(new Date(photo.timestamp).toLocaleString('en-IN'), x, y + imgH + 26);

      col++;
      if (col === 2) {
        col = 0;
        x = margin;
        y += imgH + 50;
      } else {
        x = margin + imgW + 20;
      }
    });
  }

  // ── AI Summary section ───────────────────────────────────
  if (aiSummary) {
    doc.addPage();
    y = 50;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text('AI Summary', margin, y);
    y += 10;
    doc.setDrawColor(230, 57, 70);
    doc.line(margin, y, margin + 90, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    const summaryLines = doc.splitTextToSize(String(aiSummary), pageWidth - margin * 2);
    doc.text(summaryLines, margin, y);
  }

  // ── Voice instruction (text) ─────────────────────────────
  if (voiceInstruction) {
    doc.addPage();
    y = 50;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text('Voice Instruction (written)', margin, y);
    y += 10;
    doc.setDrawColor(230, 57, 70);
    doc.line(margin, y, margin + 170, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    const voiceLines = doc.splitTextToSize(String(voiceInstruction), pageWidth - margin * 2);
    doc.text(voiceLines, margin, y);
  }

  // ── Footer on every page ────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('Generated by FirstWitness · BSA 2023 Section 63 Compliant', margin, footerY);
    doc.text(`Page ${p} of ${pageCount}`, pageWidth - margin - 60, footerY);
  }

  return doc;
}

export function downloadEvidencePDF(caseData, address, aiSummary = '', voiceInstruction = '') {
  const doc = generateEvidencePDF(caseData, address, aiSummary, voiceInstruction);
  const filename = `FirstWitness_${caseData.crimeType || 'case'}_${Date.now()}.pdf`;
  doc.save(filename);
}