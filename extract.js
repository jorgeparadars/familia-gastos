export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, mediaType } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided' });

  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image }
            },
            {
              type: 'text',
              text: `Eres un asistente que extrae datos de tickets o comprobantes de gastos personales/familiares.
Extrae SOLO estos campos en JSON (sin texto adicional, sin markdown):
{
  "monto": número sin signo de pesos (solo el total final),
  "concepto": descripción breve de qué se compró,
  "proveedor": nombre del negocio o tienda,
  "categoria": una de: Casa, Comida, Salud, Educación, Vehículos, Gasolina, Country, Entretenimiento, Ropa, Viajes, Servicios, Donaciones, Alcohol, Takeout,
  "fecha": en formato YYYY-MM-DD si aparece en el ticket, si no usa ${today}
}
Si no puedes leer algo con claridad, pon null.`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Claude API error: ' + err });
    }

    const data = await response.json();
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error('extract.js error:', err);
    return res.status(500).json({ error: err.message });
  }
}
