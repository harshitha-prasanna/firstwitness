import React, { useState, useEffect, useRef } from 'react';
import { generateEvidencePDF } from "../utils/generatePDF";

const PROTOCOLS = {
  assault: {
    en: [
      { title: 'Scene overview', instruction: 'Step back 5 feet. Capture the full area where the incident happened. Do not move anything.' },
      { title: 'Victim position', instruction: 'Photograph where the victim is or was standing. Include surroundings in the frame.' },
      { title: 'Weapons or objects', instruction: 'If any objects were used, photograph them clearly without touching or moving them.' },
      { title: 'Entry and exit points', instruction: 'Capture all doors, gates or paths the attacker may have used to enter or escape.' },
    ],
    hi: [
      { title: 'दृश्य अवलोकन', instruction: '5 फीट पीछे जाएं। घटना स्थल का पूरा क्षेत्र कैप्चर करें। कुछ भी न हिलाएं।' },
      { title: 'पीड़ित की स्थिति', instruction: 'जहां पीड़ित खड़ा था, वहां की फोटो लें। आसपास का क्षेत्र भी दिखाएं।' },
      { title: 'हथियार या वस्तुएं', instruction: 'यदि कोई वस्तु उपयोग की गई हो, तो उसे बिना छुए फोटो लें।' },
      { title: 'प्रवेश और निकास', instruction: 'सभी दरवाजे, गेट या रास्ते जो हमलावर ने उपयोग किए, उन्हें कैप्चर करें।' },
    ],
    ta: [
      { title: 'காட்சி கண்ணோட்டம்', instruction: '5 அடி பின்னால் செல்லுங்கள். சம்பவம் நடந்த முழு பகுதியையும் படம் எடுங்கள்.' },
      { title: 'பாதிக்கப்பட்டவர் நிலை', instruction: 'பாதிக்கப்பட்டவர் நின்ற இடத்தை சுற்றுப்புறத்துடன் படம் எடுங்கள்.' },
      { title: 'ஆயுதங்கள் அல்லது பொருட்கள்', instruction: 'பயன்படுத்திய பொருட்களை தொடாமல் படம் எடுங்கள்.' },
      { title: 'நுழைவு மற்றும் வெளியேற்றம்', instruction: 'தாக்குபவர் பயன்படுத்திய அனைத்து வழிகளையும் படம் எடுங்கள்.' },
    ],
  },
  theft: {
    en: [
      { title: 'Point of entry', instruction: 'Photograph where the thief entered — broken lock, open window, forced door.' },
      { title: 'Area of theft', instruction: 'Capture the area where items were stolen. Show empty spaces, open drawers.' },
      { title: 'Items left behind', instruction: 'Photograph anything the thief may have left — tools, footprints, packaging.' },
      { title: 'Surrounding exterior', instruction: 'Capture the outside of the premises and any possible escape routes.' },
    ],
    hi: [
      { title: 'प्रवेश बिंदु', instruction: 'चोर ने जहां से प्रवेश किया वहां की फोटो लें — टूटा ताला, खुली खिड़की।' },
      { title: 'चोरी का क्षेत्र', instruction: 'जहां से सामान चुराया गया वहां की फोटो लें। खाली जगह और दराज दिखाएं।' },
      { title: 'छोड़ी गई वस्तुएं', instruction: 'चोर ने जो कुछ छोड़ा हो — औजार, पैरों के निशान — उसकी फोटो लें।' },
      { title: 'आसपास का क्षेत्र', instruction: 'परिसर के बाहर और सभी भागने के रास्तों की फोटो लें।' },
    ],
    ta: [
      { title: 'நுழைவு புள்ளி', instruction: 'திருடன் நுழைந்த இடத்தை படம் எடுங்கள் — உடைந்த பூட்டு, திறந்த ஜன்னல்.' },
      { title: 'திருட்டு பகுதி', instruction: 'பொருட்கள் திருடப்பட்ட இடத்தை படம் எடுங்கள்.' },
      { title: 'விட்டுச் சென்ற பொருட்கள்', instruction: 'திருடன் விட்டுச் சென்றவற்றை படம் எடுங்கள்.' },
      { title: 'சுற்றுப்புற பகுதி', instruction: 'வளாகத்தின் வெளியே மற்றும் தப்பிக்கும் வழிகளை படம் எடுங்கள்.' },
    ],
  },
  domestic: {
    en: [
      { title: 'Overall room', instruction: 'Quietly photograph the room where the incident happened. Stay safe first.' },
      { title: 'Signs of struggle', instruction: 'Capture broken items, overturned furniture, or damage to the space.' },
      { title: 'Visible injuries', instruction: 'If the victim consents, photograph any visible injuries from a respectful distance.' },
      { title: 'Exit routes', instruction: 'Photograph all exits. This helps establish the layout for the report.' },
    ],
    hi: [
      { title: 'पूरा कमरा', instruction: 'घटना वाले कमरे की चुपचाप फोटो लें। पहले अपनी सुरक्षा सुनिश्चित करें।' },
      { title: 'संघर्ष के संकेत', instruction: 'टूटी हुई वस्तुएं, उलटा फर्नीचर या नुकसान की फोटो लें।' },
      { title: 'चोटें यदि दिखाई दें', instruction: 'यदि पीड़ित सहमति दे, तो सम्मानजनक दूरी से फोटो लें।' },
      { title: 'निकास मार्ग', instruction: 'सभी निकास की फोटो लें। यह रिपोर्ट के लिए लेआउट स्थापित करता है।' },
    ],
    ta: [
      { title: 'முழு அறை', instruction: 'சம்பவம் நடந்த அறையை அமைதியாக படம் எடுங்கள். முதலில் பாதுகாப்பாக இருங்கள்.' },
      { title: 'போராட்டத்தின் அறிகுறிகள்', instruction: 'உடைந்த பொருட்கள், கவிழ்ந்த தளபாடங்களை படம் எடுங்கள்.' },
      { title: 'காயங்கள் தெரிந்தால்', instruction: 'பாதிக்கப்பட்டவர் அனுமதி கொடுத்தால், மரியாதையான தூரத்தில் படம் எடுங்கள்.' },
      { title: 'வெளியேறும் வழி', instruction: 'வெளியேறும் வழிகளை படம் எடுங்கள்.' },
    ],
  },
  accident: {
    en: [
      { title: 'Wide shot of scene', instruction: 'Stand safely away and photograph the full accident scene including all vehicles.' },
      { title: 'Vehicle positions', instruction: 'Capture exact positions of all vehicles before they are moved.' },
      { title: 'Road and skid marks', instruction: 'Photograph any skid marks, debris, or road damage clearly.' },
      { title: 'Traffic signals and signs', instruction: 'Capture nearby traffic lights, speed limit signs, and road markings.' },
    ],
    hi: [
      { title: 'दृश्य का विस्तृत शॉट', instruction: 'सुरक्षित दूरी से सभी वाहनों सहित पूरे दुर्घटना स्थल की फोटो लें।' },
      { title: 'वाहनों की स्थिति', instruction: 'हटाए जाने से पहले सभी वाहनों की सटीक स्थिति कैप्चर करें।' },
      { title: 'सड़क और स्किड मार्क', instruction: 'किसी भी स्किड मार्क, मलबे या सड़क क्षति की स्पष्ट फोटो लें।' },
      { title: 'ट्रैफिक संकेत', instruction: 'पास के ट्रैफिक लाइट, गति सीमा संकेत और सड़क चिह्न कैप्चर करें।' },
    ],
    ta: [
      { title: 'காட்சியின் பரந்த படம்', instruction: 'பாதுகாப்பான தூரத்தில் நின்று அனைத்து வாகனங்களுடன் முழு விபத்து காட்சியை படம் எடுங்கள்.' },
      { title: 'வாகன நிலைகள்', instruction: 'நகர்த்துவதற்கு முன் அனைத்து வாகனங்களின் சரியான நிலைகளை படம் எடுங்கள்.' },
      { title: 'சாலை மற்றும் சறுக்கல் தடங்கள்', instruction: 'சறுக்கல் தடங்கள், குப்பைகளை படம் எடுங்கள்.' },
      { title: 'போக்குவரத்து சமிக்ஞைகள்', instruction: 'அருகிலுள்ள போக்குவரத்து விளக்குகளை படம் எடுங்கள்.' },
    ],
  },
  other: {
    en: [
      { title: 'Wide scene shot', instruction: 'Step back and capture the full area related to the incident. Do not move or touch anything.' },
      { title: 'Close-up of evidence', instruction: 'Take a clear close-up photo of the main thing that shows what happened.' },
      { title: 'Surrounding context', instruction: 'Photograph the surrounding area, any nearby signs, numbers, or landmarks.' },
      { title: 'Any additional angle', instruction: 'Take one more photo from a different angle to support your evidence.' },
    ],
    hi: [
      { title: 'पूरा दृश्य', instruction: 'पीछे हटें और घटना से संबंधित पूरे क्षेत्र को कैप्चर करें। कुछ भी न छुएं।' },
      { title: 'सबूत का क्लोज-अप', instruction: 'मुख्य चीज़ की स्पष्ट क्लोज-अप फोटो लें जो दिखाती है कि क्या हुआ।' },
      { title: 'आसपास का संदर्भ', instruction: 'आसपास के क्षेत्र, किसी भी संकेत या लैंडमार्क की फोटो लें।' },
      { title: 'अतिरिक्त कोण', instruction: 'अपने सबूत का समर्थन करने के लिए एक अलग कोण से फोटो लें।' },
    ],
    ta: [
      { title: 'முழு காட்சி', instruction: 'பின்வாங்கி சம்பவம் தொடர்பான முழு பகுதியையும் படம் எடுங்கள்.' },
      { title: 'ஆதாரத்தின் நெருக்கப் படம்', instruction: 'என்ன நடந்தது எனக் காட்டும் முக்கிய பொருளின் தெளிவான படம் எடுங்கள்.' },
      { title: 'சுற்றுப்புற சூழல்', instruction: 'சுற்றுப்புற பகுதி, அறிகுறிகள் அல்லது அடையாளங்களை படம் எடுங்கள்.' },
      { title: 'கூடுதல் கோணம்', instruction: 'உங்கள் ஆதாரத்தை ஆதரிக்க வேறு கோணத்தில் ஒரு படம் எடுங்கள்.' },
    ],
  },
};

export default function VoiceGuide({ caseData, go, setCaseData }) {
  const { crimeType = 'assault', language = 'en', otherDescription = '' } = caseData;
  const steps = PROTOCOLS[crimeType]?.[language] || PROTOCOLS[crimeType]?.en || PROTOCOLS.other.en;
  const [currentStep, setCurrentStep] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [location, setLocation] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [generating, setGenerating] = useState(false);
const [generationStep, setGenerationStep] = useState("");
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (voiceEnabled) speak(steps[currentStep]?.instruction);
    // eslint-disable-next-line
  }, [currentStep, voiceEnabled]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      }
    } catch (err) {
      setCameraError('Camera access denied. Click "Allow" when your browser asks for camera permission, then refresh.');
    }
  };

  const speak = (text) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-IN';
    utt.rate = 0.85;
    utt.volume = 1;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const enableVoice = () => {
    setVoiceEnabled(true);
    speak(steps[currentStep]?.instruction);
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    const photo = {
      id: Date.now(),
      data: dataUrl,
      step: currentStep,
      stepTitle: steps[currentStep]?.title,
      timestamp: new Date().toISOString(),
      lat: location?.lat || null,
      lng: location?.lng || null,
    };

    const newPhotos = [...photos, photo];
    setPhotos(newPhotos);

    // More photos remaining
    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep((s) => s + 1), 400);
      return;
    }

    // LAST PHOTO
    streamRef.current?.getTracks().forEach((t) => t.stop());

    setGenerating(true);

    try {
      setGenerationStep('Locking GPS...');
      await new Promise((r) => setTimeout(r, 400));

      setGenerationStep('Preparing metadata...');
      await new Promise((r) => setTimeout(r, 400));

      const updatedCase = {
        ...caseData,
        photos: newPhotos,
        location,
      };

      setGenerationStep('Generating Evidence PDF...');
      await new Promise((r) => setTimeout(r, 400));

      const pdf = generateEvidencePDF(updatedCase);

      setGenerationStep('Finalizing package...');
      await new Promise((r) => setTimeout(r, 500));

      setCaseData((prev) => ({
        ...prev,
        photos: newPhotos,
        location,
        pdf,
      }));

      go('whatsappSend', {
        photos: newPhotos,
        location,
        pdf,
      });

    } catch (err) {
      alert('Failed to generate PDF');
      console.error(err);
    }
  };

  const step = steps[currentStep];
  const progress = (currentStep / steps.length) * 100;

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <div className="page" style={{ paddingTop: 48 }}>

        <div style={{ height: 3, background: '#1a0000', borderRadius: 2, marginBottom: 32, maxWidth: 560 }}>
          <div style={{ width: `${progress + 10}%`, height: '100%', background: '#E63946', borderRadius: 2, transition: 'width 0.4s' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button onClick={() => { window.speechSynthesis?.cancel(); streamRef.current?.getTracks().forEach(t => t.stop()); go('crimeSelect'); }} style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Capture evidence</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#E63946', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>Photo {currentStep + 1} of {steps.length} · {crimeType === 'other' ? (otherDescription.slice(0, 30) || 'Custom') : crimeType}</div>
          </div>
          <div style={{ marginLeft: 'auto', background: '#E6394620', border: '0.5px solid #E6394650', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#E63946' }}>2/4</div>
        </div>

        {!voiceEnabled && (
          <div style={{ maxWidth: 700, background: '#1a0306', border: '1px solid #E63946', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ fontSize: 13, color: '#fff' }}>🔇 Voice is muted by your browser until you tap once.</div>
            <button onClick={enableVoice} style={{ background: '#E63946', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              🔊 Enable voice
            </button>
          </div>
        )}

        <div style={{ maxWidth: 700, display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
          <div>
            <div style={{ background: '#0d0000', border: '1px solid #1a0000', borderRadius: 18, overflow: 'hidden', position: 'relative', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>

              {cameraError ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🚫</div>
                  <div style={{ fontSize: 12, color: '#FF6B6B', lineHeight: 1.5 }}>{cameraError}</div>
                </div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}

              <div style={{ position: 'absolute', top: 14, left: 14, width: 22, height: 22, borderTop: '2px solid #E63946', borderLeft: '2px solid #E63946', borderRadius: '4px 0 0 0', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderTop: '2px solid #E63946', borderRight: '2px solid #E63946', borderRadius: '0 4px 0 0', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 14, left: 14, width: 22, height: 22, borderBottom: '2px solid #E63946', borderLeft: '2px solid #E63946', borderRadius: '0 0 0 4px', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 14, right: 14, width: 22, height: 22, borderBottom: '2px solid #E63946', borderRight: '2px solid #E63946', borderRadius: '0 0 4px 0', pointerEvents: 'none' }} />

              <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.85)', border: `0.5px solid ${speaking ? '#E63946' : '#E6394640'}`, borderRadius: 20, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, maxWidth: '85%' }}>
                <div style={{ width: 7, height: 7, background: '#E63946', borderRadius: '50%', opacity: speaking ? 1 : 0.4, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>{speaking ? 'Speaking...' : cameraReady ? 'Camera live' : 'Starting camera...'}</span>
              </div>

              {location && (
                <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'rgba(0,0,0,0.85)', border: '0.5px solid #25D36650', borderRadius: 20, padding: '4px 10px' }}>
                  <span style={{ fontSize: 11, color: '#25D366', fontWeight: 600 }}>📍 GPS locked</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                {steps.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 42, borderRadius: 10, background: i < photos.length ? '#1a0306' : '#0d0000', border: `0.5px solid ${i < photos.length ? '#E63946' : '#1a0000'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#E63946' }}>
                    {i < photos.length ? '✓' : ''}
                  </div>
                ))}
              </div>
              <div onClick={handleCapture} style={{ width: 68, height: 68, borderRadius: '50%', background: cameraReady ? '#E63946' : '#3a0000', border: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: cameraReady ? 'pointer' : 'default', fontSize: 28, flexShrink: 0 }}>
                📷
              </div>
            </div>
          </div>

          <div style={{ background: '#0d0000', border: '1px solid #1a0000', borderRadius: 14, padding: '20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E63946', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Step {currentStep + 1}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{step?.title}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 16 }}>{step?.instruction}</div>
            <button onClick={() => speak(step?.instruction)} style={{ background: '#E6394615', border: '0.5px solid #E6394640', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#E63946', cursor: 'pointer' }}>
              🔊 Replay voice
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {generating && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.92)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: '5px solid #222',
                borderTop: '5px solid #E63946',
                animation: 'spin .8s linear infinite',
              }}
            />

            <h2
              style={{
                color: 'white',
                marginTop: 30,
              }}
            >
              Building Evidence Package
            </h2>

            <p
              style={{
                color: '#E63946',
                marginTop: 10,
              }}
            >
              {generationStep}
            </p>

            <style>{`
              @keyframes spin{
                to{
                  transform:rotate(360deg);
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}