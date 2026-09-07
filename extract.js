export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { image, mediaType } = await req.json();
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
        max_tokens: 1200,
        system: `Extrae los gastos de un ticket de compra mexicano. El ticket puede incluir productos de distintas categorías (por ejemplo comida y ropa) en una sola compra: en ese caso, DESGLOSA el ticket en varios gastos, uno por cada categoria distinta que identifiques, sumando los montos de los articulos que compartan categoria. Si todo el ticket es de una sola categoria, regresa un solo gasto en el arreglo.

Responde SOLO JSON sin markdown ni backticks, con este formato exacto:
{"proveedor": "nombre del comercio o null", "fecha": "YYYY-MM-DD (usa ${today} si no aparece)", "gastos": [{"monto": numero, "concepto": "string breve", "categoria": "string"}]}

Catalogo de categorias validas (usa exactamente uno de estos valores): Casa, Comida Casa, Comida Postre, Comida Chatarra, Comida Fuera, Cafe Fuera, Salud, Cuidado Personal, Terapias, Educacion, Vehiculos, Gasolina, Country, Entretenimiento, Ropa, Viajes, Servicios, Donaciones, Regalos, Alcohol.

Guia: super/despensa = Comida Casa; restaurante/comida para llevar = Comida Fuera; postres = Comida Postre; botanas/refrescos = Comida Chatarra; cafeteria = Cafe Fuera; bebidas alcoholicas SIEMPRE en Alcohol (fila propia); farmacia = Salud; aseo personal = Cuidado Personal; ropa/calzado = Ropa; gasolina = Gasolina; articulos hogar/limpieza/ferreteria = Casa. Si no puedes leer el ticket, regresa {"gastos":[]}.`,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
          { type: 'text', text: 'Extrae y desglosa los gastos del ticket.' }
        ]}]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    const text = data.content?.find(b => b.type === 'text')?.text || '{}';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export const config = { runtime: 'edge' };
