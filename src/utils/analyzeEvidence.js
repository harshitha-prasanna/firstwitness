// Calls Claude's vision API to analyze captured evidence photos and generate a case summary.
// WARNING: This calls the API directly from the browser using your API key, which exposes
// the key to anyone inspecting network requests. Fine for testing — for production, route
// this through your own backend server instead.

export async function analyzeEvidencePhotos(caseData) {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: 'No API key configured. Add REACT_APP_ANTHROPIC_API_KEY to your .env file in the project root, then restart npm start.' };
  }

  const photos = caseData.photos || [];
  if (photos.length === 0) {
    return { error: 'No photos to analyze.' };
  }

  const imageBlocks = photos.slice(0, 4).map(photo => {
    const base64Data = photo.data.split(',')[1];
    const mediaType = photo.data.match(/data:(image\/\w+);/)?.[1] || 'image/jpeg';
    return {
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: base64Data },
    };
  });

  const crimeLabel = caseData.crimeType === 'other' ? caseData.otherDescription : caseData.crimeType;

  const promptText = `You are assisting with documenting evidence for a ${crimeLabel} incident report in India, to be used as supporting material for a police FIR filing. You are reviewing ${photos.length} photographs taken by a civilian witness at the scene, in sequence.

Write a short, factual, neutral case summary based ONLY on what is visibly present in these photos. Do not speculate about who is at fault or assign blame. Structure your response as:

1. A 2-3 sentence objective description of what the photos show
2. A bullet list of notable visible details (damage, objects, positions, conditions) — 3-5 bullets
3. One line noting any limitations of this evidence (e.g. lighting conditions, no faces visible, etc.)

Keep the entire response under 180 words. Write in plain, professional language suitable for a formal report.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [...imageBlocks, { type: 'text', text: promptText }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { error: `API request failed: ${response.status}. ${errText.slice(0, 200)}` };
    }

    const data = await response.json();
    const text = data.content?.find(block => block.type === 'text')?.text || '';
    return { summary: text };
  } catch (err) {
    return { error: `Network error: ${err.message}` };
  }
}