import React, { useState } from 'react';

const CRIMES = [
  { id: 'assault', label: 'Assault', hint: 'Physical attack', icon: '🏃' },
  { id: 'theft', label: 'Theft', hint: 'Property stolen', icon: '🔓' },
  { id: 'domestic', label: 'Domestic', hint: 'Violence at home', icon: '🏠' },
  { id: 'accident', label: 'Accident', hint: 'Road incident', icon: '🚗' },
  { id: 'other', label: 'Other', hint: 'Describe it yourself', icon: '✍️' },
];

const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
  { id: 'ta', label: 'தமிழ்' },
];

export default function CrimeSelect({ caseData, go }) {
  const [selected, setSelected] = useState(caseData.crimeType || 'assault');
  const [lang, setLang] = useState(caseData.language || 'en');
  const [otherDesc, setOtherDesc] = useState(caseData.otherDescription || '');

  const canProceed = selected !== 'other' || otherDesc.trim().length > 2;

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <div className="page" style={{ paddingTop: 48 }}>

        <div style={{ height: 3, background: '#1a0000', borderRadius: 2, marginBottom: 32, maxWidth: 560 }}>
          <div style={{ width: '25%', height: '100%', background: '#E63946', borderRadius: 2 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <button onClick={() => go('splash')} style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>What happened?</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#E63946', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>Step 1 of 4</div>
          </div>
          <div style={{ marginLeft: 'auto', background: '#E6394620', border: '0.5px solid #E6394650', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#E63946' }}>1/4</div>
        </div>

        <div style={{ maxWidth: 560 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#E63946', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Select incident type</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.25, letterSpacing: -0.3, marginBottom: 8 }}>One tap. We handle the rest.</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>App will auto-build your evidence protocol</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            {CRIMES.map(c => (
              <div
                key={c.id}
                onClick={() => setSelected(c.id)}
                style={{
                  background: selected === c.id ? '#1a0306' : '#0d0000',
                  border: `1px solid ${selected === c.id ? '#E63946' : '#2a0000'}`,
                  borderRadius: 14, padding: '22px 18px', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 14, opacity: selected === c.id ? 1 : 0.4 }}>{c.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 12, color: selected === c.id ? 'rgba(230,57,70,0.6)' : 'rgba(255,255,255,0.2)' }}>{c.hint}</div>
              </div>
            ))}
          </div>

          {selected === 'other' && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#E63946', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Describe what happened</div>
              <textarea
                value={otherDesc}
                onChange={e => setOtherDesc(e.target.value)}
                placeholder="e.g. Someone vandalized my shop's shutter overnight..."
                rows={3}
                style={{
                  width: '100%', background: '#0d0000', border: '1px solid #2a0000', borderRadius: 12,
                  padding: '14px 16px', fontSize: 14, color: '#fff', fontFamily: 'inherit', resize: 'vertical', outline: 'none'
                }}
              />
            </div>
          )}

          <div style={{ fontSize: 12, fontWeight: 700, color: '#E63946', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Language</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 36 }}>
            {LANGS.map(l => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                style={{
                  flex: 1, background: lang === l.id ? '#E6394615' : '#0d0000',
                  border: `0.5px solid ${lang === l.id ? '#E63946' : '#2a0000'}`,
                  borderRadius: 10, padding: '12px 4px', fontSize: 14, fontWeight: 600,
                  color: lang === l.id ? '#E63946' : 'rgba(255,255,255,0.3)', cursor: 'pointer',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            disabled={!canProceed}
            onClick={() => go('voiceGuide', { crimeType: selected, otherDescription: selected === 'other' ? otherDesc : '', language: lang, timestamp: new Date().toISOString() })}
            style={{
              width: '100%', maxWidth: 420, background: canProceed ? '#E63946' : '#3a0000',
              border: 'none', borderRadius: 14, padding: '17px 24px', fontSize: 16, fontWeight: 700,
              color: canProceed ? '#fff' : 'rgba(255,255,255,0.3)', cursor: canProceed ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}
          >
            Begin voice guide 🎙️
          </button>
        </div>
      </div>
    </div>
  );
}