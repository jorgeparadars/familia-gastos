export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { texto } = await req.json();
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: `Eres un extractor de gastos personales/familiares en efectivo en México. El usuario describe un gasto en lenguaje natural. Responde SOLO JSON sin markdown ni backticks. Campos: monto (número), proveedor (string), concepto (string), categoria (una de: Casa, Comida, Salud, Educación, Vehículos, Gasolina, Country, Entretenimiento, Ropa, Viajes, Servicios, Donaciones, Alcohol, Takeout), fecha (YYYY-MM-DD, usa ${today} si no se menciona). Usa null si no encuentras el campo.`,
        messages: [{ role: 'user', content: texto }]
      })
    });
    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export const config = { runtime: 'edge' };
