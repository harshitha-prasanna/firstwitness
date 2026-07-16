import React from 'react';

export default function Confirmation({ caseData, go, setCaseData }) {
  const photoCount = caseData.photos?.length || 0;
  const stationName = caseData.selectedStation?.name || 'Police Station';
  const time = new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

  const startNew = () => {
    setCaseData({ crimeType: null, language: 'en', photos: [], location: null, timestamp: null });
    go('splash');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center' }}>
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ maxWidth: 480 }}>
          <div style={{ width: 80, height: 80, border: '2px solid #25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36, color: '#25D366' }}>✓</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Evidence sent.</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 32 }}>
            Package delivered to {stationName} via WhatsApp. Keep this screen as proof.
          </div>

          <div style={{ background: '#0d0000', border: '0.5px solid #1a0000', borderRadius: 14, padding: '18px', textAlign: 'left', marginBottom: 24 }}>
            {[
              ['Sent at', time],
              ['Station', stationName],
              ['Photos', `${photoCount} · GPS-tagged`],
              ['Package', 'BSA 2023 compliant PDF'],
              ['Status', 'Delivered'],
            ].map(([label, val], i, arr) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '0.5px solid #1a0000' : 'none' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#25D366' }}>{val}</span>
              </div>
            ))}
          </div>

          <button onClick={startNew} style={{ width: '100%', background: '#E63946', border: 'none', borderRadius: 14, padding: '15px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            Start new case
          </button>
        </div>
      </div>
    </div>
  );
}