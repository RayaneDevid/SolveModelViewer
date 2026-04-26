import { corsHeaders } from './cors.ts';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
  }
}

export function errorResponse(e: unknown): Response {
  if (e instanceof ApiError) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: e.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  console.error('[unhandled]', e);
  return new Response(JSON.stringify({ error: 'Erreur interne' }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
