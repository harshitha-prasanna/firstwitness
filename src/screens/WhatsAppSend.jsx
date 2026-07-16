import React, { useState, useEffect } from 'react';
import { downloadEvidencePDF } from '../utils/generatePDF';
import { reverseGeocode } from '../utils/reverseGeocode';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

async function fetchPlaceDetails(placeId, apiKey) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?key=${apiKey}&place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,rating`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Place Details API request failed');
  const data = await res.json();
  if (data.status !== 'OK') throw new Error(data.error_message || 'Place Details request failed');
  return data.result;
}

async function searchPoliceStations(lat, lng, radius, apiKey) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${apiKey}&location=${lat},${lng}&radius=${radius}&type=police`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Places Nearby Search request failed');
  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.log('Places API response:', data.status, data.error_message || '');
    return [];
  }
  return data.results || [];
}

async function searchOverpassPolice(lat, lng, radius) {
  const query = `[
out:json][timeout:25];
(
  node["amenity"="police"](around:${radius},${lat},${lng});
  way["amenity"="police"](around:${radius},${lat},${lng});
  relation["amenity"="police"](around:${radius},${lat},${lng});
);
out center;`;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return [];
    const data = await res.json();
    const elems = data.elements || [];
    const results = elems.map((el) => {
      const tags = el.tags || {};
      const latc = el.lat ?? el.center?.lat ?? null;
      const lngc = el.lon ?? el.center?.lon ?? el.center?.lon ?? null;
      return {
        id: el.id,
        osmType: el.type,
        name: tags.name || 'Police Station',
        address: tags['addr:full'] || [tags['addr:housename'], tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ') || 'Address unavailable',
        phone: tags.phone || tags['contact:phone'] || '',
        website: tags.website || '',
        lat: latc,
        lng: lngc,
      };
    }).filter(r => r.lat && r.lng);
    return results;
  } catch (err) {
    console.log('Overpass error', err);
    return [];
  }
}

async function findNearestPoliceStations(lat, lng, apiKey) {
  const radii = [5000, 10000, 20000, 40000];
  const accum = new Map(); // place_id -> place object

  for (const radius of radii) {
    const results = await searchPoliceStations(lat, lng, radius, apiKey).catch(() => []);
    if (!results || results.length === 0) continue;
    results.forEach((place) => {
      if (!place.place_id) return;
      if (!accum.has(place.place_id)) accum.set(place.place_id, place);
    });
    // if we've collected a decent set, stop early
    if (accum.size >= 12) break;
  }

  const unique = Array.from(accum.values()).slice(0, 30);
  if (unique.length === 0) return [];

  const stations = await Promise.all(
    unique.map(async (place) => {
      const details = await fetchPlaceDetails(place.place_id, apiKey).catch(() => null);
      const location = place.geometry?.location || details?.geometry?.location || null;
      const phone = details?.international_phone_number || details?.formatted_phone_number || '';
      const mapsLink = `https://www.google.com/maps/search/?api=1&query=police&query_place_id=${place.place_id}`;
      const distance = location ? Number(haversine(lat, lng, location.lat, location.lng)) : Number.POSITIVE_INFINITY;

      return {
        placeId: place.place_id,
        name: details?.name || place.name || 'Police Station',
        address: details?.formatted_address || place.vicinity || 'Address unavailable',
        phone,
        website: details?.website || '',
        rating: details?.rating ?? null,
        openStatus: details?.opening_hours ? (details.opening_hours.open_now ? 'OPEN' : 'CLOSED') : (details?.opening_hours ? (details.opening_hours.open_now ? 'OPEN' : 'CLOSED') : 'Unknown'),
        email: details?.email || '',
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        mapsLink,
        distance,
      };
    })
  );

  // sort by numeric distance and return top 10
  stations.sort((a, b) => (a.distance || Number.POSITIVE_INFINITY) - (b.distance || Number.POSITIVE_INFINITY));
  // convert distances back to string with 1 decimal (or N/A)
  return stations.slice(0, 10).map((s) => ({ ...s, distance: Number.isFinite(s.distance) ? s.distance.toFixed(1) : 'N/A' }));
}

function buildFallbackStation(lat, lng) {
  const query = encodeURIComponent('Nearest Police Control Room');
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${query}+${lat},${lng}`;
  return {
    placeId: null,
    name: 'Nearest Police Control Room',
    address: 'Search on Google Maps for the nearest police control room',
    phone: '',
    website: '',
    rating: null,
    openStatus: 'Unknown',
    email: '',
    mapsLink,
    distance: 'N/A',
  };
}

export default function WhatsAppSend({ caseData, go }) {
  const [stations, setStations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState(null);

  const lat = caseData.location?.lat;
  const lng = caseData.location?.lng;
  const googleApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

  // Build a short AI-style summary from the case data
  const buildAiSummary = () => {
    const t = new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    const summary = `Summary: ${caseData.crimeType || 'Unknown'} reported at ${address?.fullAddress || (lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Unknown')} on ${t}. ${caseData.photos?.length || 0} photographic evidence items captured. Nearest station: ${selected?.name || 'N/A'} (${selected?.distance || 'N/A'} km). Requesting immediate assistance.`;
    return summary;
  };

  const buildVoiceInstruction = () => {
    return `Please move to a safe location immediately. Do not disturb the scene. Preserve any evidence. If you are in danger, call emergency services now. Keep this phone available for officers.`;
  };

  const playVoiceInstruction = () => {
    const text = buildVoiceInstruction();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = caseData.language || 'en-IN';
      window.speechSynthesis.speak(utter);
    } else {
      alert('Text-to-speech not supported in this browser.');
    }
  };

  const shareToFamily = (station) => {
    const aiSummaryText = buildAiSummary();
    const incidentAddressLocal = address?.fullAddress || (lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Unknown');
    const policeMessage = `From: Local Police Department\n${aiSummaryText}\nAddress: ${incidentAddressLocal}\nGoogle Maps: ${station.mapsLink}`;
    const encoded = encodeURIComponent(policeMessage);
    // open WhatsApp web composer with message
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    go('confirmation', { selectedStation: station, action: 'share_family' });
  };

  useEffect(() => {
    const loadStations = async () => {
      console.log('Started searching...');
      console.log('Lat:', lat);
      console.log('Lng:', lng);

      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 10000);

      if (!lat || !lng) {
        console.log('No location');
        setLoading(false);
        return;
      }

      let addr = null;
      try {
        addr = await reverseGeocode(lat, lng);
        setAddress(addr);
      } catch (err) {
        console.log('Reverse geocode failed', err);
      }

      // generate PDF including AI summary and voice instruction
      const aiSummaryText = buildAiSummary();
      const voiceInstructionText = buildVoiceInstruction();
      downloadEvidencePDF(caseData, addr, aiSummaryText, voiceInstructionText);
      console.log('PDF generated.');

      if (!googleApiKey) {
          console.log('Missing Google Maps API key — using Overpass fallback');
          // Try Overpass to get police stations from OpenStreetMap
          try {
            let overResults = [];
            for (const r of [5000, 10000, 20000]) {
              const res = await searchOverpassPolice(lat, lng, r);
              if (res && res.length > 0) {
                overResults = overResults.concat(res);
              }
              if (overResults.length >= 10) break;
            }
            if (overResults.length > 0) {
              const enriched = overResults
                .map((p) => ({ ...p, distance: p.lat && p.lng ? Number(haversine(lat, lng, p.lat, p.lng)).toFixed(1) : 'N/A', mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.lat + ',' + p.lng)}` }))
                .sort((a, b) => (Number(a.distance) || Number.POSITIVE_INFINITY) - (Number(b.distance) || Number.POSITIVE_INFINITY))
                .slice(0, 10);
              setStations(enriched);
              setSelected(enriched[0]);
            } else {
              const fallback = buildFallbackStation(lat, lng);
              setStations([fallback]);
              setSelected(fallback);
            }
          } catch (err) {
            console.log('Overpass fallback failed', err);
            const fallback = buildFallbackStation(lat, lng);
            setStations([fallback]);
            setSelected(fallback);
          }
          setLoading(false);
          return;
      }

      try {
        const results = await findNearestPoliceStations(lat, lng, googleApiKey);
        if (results.length > 0) {
          setStations(results);
          setSelected(results[0]);
        } else {
          // Try Overpass fallback if Google returned no results
          console.log('Google returned no results — trying Overpass fallback');
          let overResults = [];
          for (const r of [5000, 10000, 20000]) {
            const res = await searchOverpassPolice(lat, lng, r);
            if (res && res.length > 0) overResults = overResults.concat(res);
            if (overResults.length >= 10) break;
          }
          if (overResults.length > 0) {
            const enriched = overResults
              .map((p) => ({ ...p, distance: p.lat && p.lng ? Number(haversine(lat, lng, p.lat, p.lng)).toFixed(1) : 'N/A', mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.lat + ',' + p.lng)}` }))
              .sort((a, b) => (Number(a.distance) || Number.POSITIVE_INFINITY) - (Number(b.distance) || Number.POSITIVE_INFINITY))
              .slice(0, 10);
            setStations(enriched);
            setSelected(enriched[0]);
          } else {
            const fallback = buildFallbackStation(lat, lng);
            setStations([fallback]);
            setSelected(fallback);
          }
        }
      } catch (err) {
        console.log('Google Places error', err);
        const fallback = buildFallbackStation(lat, lng);
        setStations([fallback]);
        setSelected(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, [lat, lng, caseData, googleApiKey]);

  

  const incidentAddress = address?.fullAddress || (lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Unknown');
  const photoCount = caseData.photos?.length || 0;
  const time = new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

  const message = selected ? `FIRSTWITNESS EVIDENCE REPORT
Incident: ${caseData.crimeType || 'Unknown'}
Time: ${time}
GPS: ${lat?.toFixed(5)}°N, ${lng?.toFixed(5)}°E
Nearest station: ${selected.name} (${selected.distance} km away)
Photos: ${photoCount} captured, GPS-tagged
BSA 2023 chain-of-custody log attached.
Requesting immediate assistance.` : '';

  const normalizePhone = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9+]/g, '');
    if (digits.startsWith('+')) return digits;
    const cleaned = digits.replace(/^0+/, '');
    // If it's a 10-digit local number, prefix India country code.
    if (cleaned.length === 10) return `+91${cleaned}`;
    // Short emergency codes like 112, 108 should be left as-is.
    if (cleaned.length <= 5) return cleaned;
    // Otherwise return cleaned number (may already be international without +)
    return cleaned;
  };

  const handleCall = (station) => {
    const normalized = normalizePhone(station.phone);
    if (!normalized) return;
    // Always use tel: URL — on desktop this will invoke the system's telephony handler
    window.location.href = `tel:${normalized}`;
    go('confirmation', { selectedStation: station, action: 'call' });
  };

  const handleEmergency = (number, label) => {
    if (!number) return;
    // Use tel: for emergency numbers as well (e.g., 112)
    window.location.href = `tel:${number}`;
    go('confirmation', { selectedStation: { name: label }, action: 'call' });
  };

  const handleNavigate = (station) => {
    window.open(station.mapsLink, '_blank');
    go('confirmation', { selectedStation: station, action: 'navigate' });
  };

  const handleShare = (station) => {
    const aiSummaryText = buildAiSummary();
    const voiceInstructionText = buildVoiceInstruction();
    downloadEvidencePDF(caseData, address, aiSummaryText, voiceInstructionText);
    const subject = 'Evidence Report';
    const body = `Incident: ${caseData.crimeType || 'Unknown'}
GPS: ${lat?.toFixed(5)}°N, ${lng?.toFixed(5)}°E
Address: ${incidentAddress}
Google Maps: ${station.mapsLink}`;

    if (station.phone) {
      const number = station.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(`${subject}
${body}`)}`, '_blank');
    } else {
      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    }
    go('confirmation', { selectedStation: station, action: 'share' });
  };

  const handleEmail = (station) => {
    if (!station.email) return;
    const subject = 'Evidence Report';
    const body = `Incident: ${caseData.crimeType || 'Unknown'}
GPS: ${lat?.toFixed(5)}°N, ${lng?.toFixed(5)}°E
Address: ${incidentAddress}
Google Maps: ${station.mapsLink}`;
    window.open(`mailto:${encodeURIComponent(station.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    go('confirmation', { selectedStation: station, action: 'email' });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 36, height: 36, border: '3px solid #1a0000', borderTop: '3px solid #E63946', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: '#E63946', fontSize: 14, fontWeight: 600 }}>Searching for police stations near your location...</div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!lat || !lng) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: '#FF6B6B', fontWeight: 700 }}>Location not available</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 400 }}>
          Your browser blocked location access. Click the 🔒 icon in your address bar → Site settings → allow Location, then go back and try again.
        </div>
        <button onClick={() => go('voiceGuide')} style={{ background: '#E63946', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>← Go back</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <div className="page" style={{ paddingTop: 48 }}>

        <div style={{ height: 3, background: '#1a0000', borderRadius: 2, marginBottom: 32, maxWidth: 560 }}>
          <div style={{ width: '85%', height: '100%', background: '#E63946', borderRadius: 2 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <button onClick={() => go('voiceGuide')} style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Send to police</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#E63946', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>Real stations near you</div>
          </div>
          <div style={{ marginLeft: 'auto', background: '#E6394620', border: '0.5px solid #E6394650', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#E63946' }}>3/4</div>
        </div>

        <div style={{ maxWidth: 600, background: '#0d0000', border: '0.5px solid #1a0000', borderRadius: 10, padding: '10px 14px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#25D366' }}>📍</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            Your GPS location: <strong style={{ color: '#25D366' }}>{lat.toFixed(5)}, {lng.toFixed(5)}</strong>
          </span>
        </div>

        <div style={{ maxWidth: 600, background: '#7a1414', border: '1px solid #b02a2a', borderRadius: 14, padding: '18px 20px', marginBottom: 20, color: '#fff' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🚨 EMERGENCY</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {[
              { label: 'National Emergency', number: '112' },
              { label: 'Women Helpline', number: '1091' },
              { label: 'Cyber Crime', number: '1930' },
              { label: 'Ambulance', number: '108' },
            ].map((c) => (
              <button
                key={c.number}
                onClick={() => handleEmergency(c.number, `${c.label} ${c.number}`)}
                style={{
                  background: '#E63946',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 10px',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: 14 }}>{c.label}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>{c.number}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 600 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#E63946', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
            {stations.length} police station{stations.length !== 1 ? 's' : ''} found nearby
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {stations.map((s) => (
              <div
                key={`${s.name}-${s.mapsLink}-${s.address}`}
                onClick={() => setSelected(s)}
                style={{
                  background: selected?.name === s.name && selected?.mapsLink === s.mapsLink ? '#001a0a' : '#0d0000',
                  border: `0.5px solid ${selected?.name === s.name && selected?.mapsLink === s.mapsLink ? '#25D366' : '#1a0000'}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: selected?.name === s.name && selected?.mapsLink === s.mapsLink ? '#002b14' : '#1a0000', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🛡️</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selected?.name === s.name && selected?.mapsLink === s.mapsLink ? '#25D366' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{s.distance} km</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  <div>Rating: {s.rating ?? 'Not available'}</div>
                  <div>Status: {s.openStatus}</div>
                  <div>Phone: {s.phone || 'Not available'}</div>
                  <div>{s.website ? <a href={s.website} target="_blank" rel="noreferrer" style={{ color: '#25D366' }}>{new URL(s.website).host}</a> : 'Website unavailable'}</div>
                  <div>Coordinates: {s.lat && s.lng ? `${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}` : 'Unavailable'}</div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCall(s);
                    }}
                    disabled={!s.phone}
                    style={{
                      flex: '1 1 120px',
                      minWidth: 120,
                      background: s.phone ? '#25D366' : '#3a3a3a',
                      border: 'none',
                      borderRadius: 10,
                      color: '#fff',
                      padding: '12px 14px',
                      fontWeight: 700,
                      cursor: s.phone ? 'pointer' : 'not-allowed',
                    }}
                  >
                    📞 Call
                  </button>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleNavigate(s);
                    }}
                    style={{
                      flex: '1 1 120px',
                      minWidth: 120,
                      background: '#1f8eff',
                      border: 'none',
                      borderRadius: 10,
                      color: '#fff',
                      padding: '12px 14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🗺 Navigate
                  </button>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleShare(s);
                    }}
                    style={{
                      flex: '1 1 120px',
                      minWidth: 120,
                      background: '#6f42c1',
                      border: 'none',
                      borderRadius: 10,
                      color: '#fff',
                      padding: '12px 14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    📤 Share PDF
                  </button>
                </div>

                {s.email ? (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEmail(s);
                    }}
                    style={{
                      flex: '1 1 120px',
                      minWidth: 120,
                      background: '#ff9800',
                      border: 'none',
                      borderRadius: 10,
                      color: '#fff',
                      padding: '12px 14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✉ Email
                  </button>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                    No direct email available
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: '#E63946', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Message preview</div>
          <div style={{ background: '#001a0a', border: '0.5px solid #25D36650', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            {selected ? (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #25D36633', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, background: '#002b14', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛡️</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{selected.name}</div>
                    <div style={{ fontSize: 11, color: '#25D36699' }}>{selected.phone || 'No number on file'}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', background: '#002b14', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#25D366' }}>WhatsApp</div>
                </div>
                <pre style={{ padding: '14px 16px', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                  {message}
                </pre>
                <div style={{ display: 'flex', gap: 10, padding: '12px 16px' }}>
                  <button onClick={(e) => { e.stopPropagation(); playVoiceInstruction(); }} style={{ background: '#FFD166', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>🔊 Play voice</button>
                  <button onClick={(e) => { e.stopPropagation(); shareToFamily(selected); }} style={{ background: '#4CC9F0', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>👪 Share to family (as Police)</button>
                </div>
              </>
            ) : (
              <div style={{ padding: '20px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Select a station above to preview the message, or download the PDF directly below.</div>
            )}
          </div>

          {/* Removed Download and Send buttons as requested */}
        </div>
      </div>
    </div>
  );
}
