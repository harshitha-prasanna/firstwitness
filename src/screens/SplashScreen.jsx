import React from 'react';

export default function SplashScreen({ go }) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: '#8B0000', top: -150, left: -100, filter: 'blur(120px)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: '#C1121F', top: 150, right: -120, filter: 'blur(100px)', opacity: 0.4 }} />
      </div>
      <div className="page" style={{ justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#E6394680', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 18 }}>
            FirstWitness · v1.0
          </div>
          <div style={{ fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: -2, marginBottom: 16 }}>
            Before the <span style={{ color: '#E63946' }}>police</span> arrive.
          </div>
          <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 36, maxWidth: 460 }}>
            Voice-guided evidence collection for every Indian civilian. BSA 2023 compliant.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
            {['Offline-first', 'Hindi · English', 'BSA 2023', '28 states'].map(tag => (
              <span key={tag} style={{
                background: tag === 'Offline-first' ? '#E6394615' : 'rgba(255,255,255,0.05)',
                border: `0.5px solid ${tag === 'Offline-first' ? '#E6394640' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                color: tag === 'Offline-first' ? '#FF6B6B' : 'rgba(255,255,255,0.5)', letterSpacing: 0.3
              }}>
                {tag}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, maxWidth: 420 }}>
            <button onClick={() => go('crimeSelect')} style={{ flex: 1, background: '#E63946', border: 'none', borderRadius: 14, padding: '17px 24px', fontSize: 16, fontWeight: 700, color: '#fff' }}>
              Start documenting →
            </button>
            <button onClick={() => go('crimeSelect')} style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '17px 24px', fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>
              Resume case
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}