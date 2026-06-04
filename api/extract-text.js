export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  const { texto } = req.body;
  if (!texto) return res.status(400).json({ error: 'No texto provided' });
 
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
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Eres un asistente que interpreta notas rápidas de gastos personales/familiares en efectivo.
Texto del usuario: "${texto}"
Fecha de hoy: ${today}
 
Extrae SOLO JSON (sin texto adicional, sin markdown):
{
  "monto": número (si dice "250 pesos" → 250),
  "concepto": descripción breve,
  "proveedor": lugar o tienda si se menciona,
  "categoria": una de: Casa, Comida, Salud, Educación, Vehículos, Gasolina, Country, Entretenimiento, Ropa, Viajes, Servicios, Donaciones, Alcohol, Takeout,
  "fecha": YYYY-MM-DD (usa ${today} si no se especifica)
}
Si no puedes determinar algo, pon null.`
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
    console.error('extract-text.js error:', err);
    return res.status(500).json({ error: err.message });
  }
}
