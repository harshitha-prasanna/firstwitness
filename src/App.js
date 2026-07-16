import React, { useState } from 'react';
import SplashScreen from './screens/SplashScreen';
import CrimeSelect from './screens/CrimeSelect';
import VoiceGuide from './screens/VoiceGuide';
import WhatsAppSend from './screens/WhatsAppSend';
import Confirmation from './screens/Confirmation';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [caseData, setCaseData] = useState({
    crimeType: null,
    language: 'en',
    photos: [],
    location: null,
    timestamp: null,
  });

  const go = (screenName, updates = {}) => {
    setCaseData(prev => ({ ...prev, ...updates }));
    setScreen(screenName);
  };

  const screens = {
    splash: SplashScreen,
    crimeSelect: CrimeSelect,
    voiceGuide: VoiceGuide,
    whatsappSend: WhatsAppSend,
    confirmation: Confirmation,
  };
  const Screen = screens[screen];
  console.log({ SplashScreen, CrimeSelect, VoiceGuide, WhatsAppSend, Confirmation });

  return (
    <div className="app-shell">
      <Screen caseData={caseData} go={go} setCaseData={setCaseData} />
    </div>
  );
}