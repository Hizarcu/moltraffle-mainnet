const ALLOWED_ORIGINS = [
  'https://moltraffle.fun',
  'http://localhost:3000',
];

export function corsHeaders(request?: Request) {
  const origin = request?.headers.get('origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
