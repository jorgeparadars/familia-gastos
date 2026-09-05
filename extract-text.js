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
        system: `Eres un extractor de gastos personales/familiares en efectivo en México. El usuario describe un gasto en lenguaje natural. Responde SOLO JSON sin markdown ni backticks. Campos: monto (número), proveedor (string), concepto (string), categoria (una de: Casa, Hipoteca, Comida Casa, Comida Postre, Comida Chatarra, Comida Fuera, Café Fuera, Salud, Cuidado Personal, Terapias, Educación, Vehículos, Gasolina, Country, Entretenimiento, Ropa, Viajes, Servicios, Donaciones, Regalos, Alcohol), fecha (YYYY-MM-DD, usa ${today} si no se menciona). Guía de categoría: Comida Casa = ingredientes/despensa para cocinar en casa. Comida Chatarra = papas, dulces, cacahuates, snacks empaquetados. Comida Postre = postres de súper o restaurante (nieve, pastel, pan dulce, donas, mazapán). Comida Fuera = comer en restaurante, propinas de restaurante, licuados comprados fuera. Café Fuera = cualquier café comprado fuera de casa (Caffenio, Starbucks, etc.). Cuidado Personal = desodorante, pasta de dientes, cremas, facial, masaje relajante. Terapias = terapia física o psicológica. Servicios = pagos a personal de apoyo (niñera, jardinero) y servicios recurrentes (agua, luz). Usa null si no encuentras el campo.`,
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
