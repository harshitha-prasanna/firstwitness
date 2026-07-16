export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );

    const data = await res.json();

    return {
      fullAddress: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
      pincode: data.address?.postcode,
      country: data.address?.country,
    };
  } catch (e) {
    return {
      fullAddress: `${lat}, ${lng}`,
    };
  }
}
