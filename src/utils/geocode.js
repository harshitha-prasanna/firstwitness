// Converts GPS coordinates into a real readable address using OpenStreetMap's Nominatim API (free, no API key needed)
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();

    if (data.display_name) {
      return {
        fullAddress: data.display_name,
        road: data.address?.road || '',
        suburb: data.address?.suburb || data.address?.neighbourhood || '',
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
        postcode: data.address?.postcode || '',
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}