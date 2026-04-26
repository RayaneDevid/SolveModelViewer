import { handleCors, corsHeaders } from '../_shared/cors.ts';

const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Solve 3D Library API',
    version: '1.0.0',
    description: 'API Edge Functions pour la bibliothèque de modèles 3D Solve Naruto',
  },
  servers: [{ url: Deno.env.get('SUPABASE_URL') + '/functions/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ModelListItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          thumbnail_url: { type: 'string', nullable: true },
          file_size_bytes: { type: 'integer' },
          has_animations: { type: 'boolean' },
          tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
          view_count: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ModelDetail: {
        allOf: [
          { $ref: '#/components/schemas/ModelListItem' },
          {
            type: 'object',
            properties: {
              glb_url: { type: 'string' },
              vertex_count: { type: 'integer', nullable: true },
              has_skeleton: { type: 'boolean' },
              source_format: { type: 'string', nullable: true },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      Tag: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          label: { type: 'string' },
          axis: { type: 'string', enum: ['type', 'clan', 'format', 'rarity', 'misc'] },
          color: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Profile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          discord_id: { type: 'string', nullable: true },
          username: { type: 'string' },
          avatar_url: { type: 'string', nullable: true },
          is_admin: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/list-models': {
      get: {
        summary: 'Liste paginée des modèles',
        tags: ['Public'],
        parameters: [
          { name: 'tags', in: 'query', schema: { type: 'string' }, description: 'Slugs séparés par virgule (AND)' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['recent', 'popular', 'name'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'per_page', in: 'query', schema: { type: 'integer', default: 24, maximum: 100 } },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    models: { type: 'array', items: { $ref: '#/components/schemas/ModelListItem' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    per_page: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/get-model': {
      get: {
        summary: 'Détails d\'un modèle',
        tags: ['Public'],
        parameters: [{ name: 'slug', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ModelDetail' } } } },
          404: { description: 'Modèle introuvable' },
        },
      },
    },
    '/list-tags': {
      get: {
        summary: 'Tags groupés par axe',
        tags: ['Public'],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'object', additionalProperties: { type: 'array', items: { $ref: '#/components/schemas/Tag' } } },
              },
            },
          },
        },
      },
    },
    '/record-view': {
      post: {
        summary: 'Enregistre une vue',
        tags: ['Public'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { model_id: { type: 'string' } }, required: ['model_id'] } } },
        },
        responses: { 200: { description: 'OK' } },
      },
    },
    '/get-profile': {
      get: {
        summary: 'Profil de l\'utilisateur connecté',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Profile' } } } },
          401: { description: 'Non authentifié' },
        },
      },
    },
    '/create-model': {
      post: {
        summary: 'Upload un modèle (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['glb', 'name', 'slug'],
                properties: {
                  glb: { type: 'string', format: 'binary' },
                  thumbnail: { type: 'string', format: 'binary' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string' },
                  source_format: { type: 'string' },
                  tag_ids: { type: 'string', description: 'JSON array d\'UUIDs' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Créé' },
          400: { description: 'Données invalides' },
          403: { description: 'Accès refusé' },
        },
      },
    },
    '/update-model': {
      patch: {
        summary: 'Modifie un modèle (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  tag_ids: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' }, 403: { description: 'Accès refusé' } },
      },
    },
    '/delete-model': {
      delete: {
        summary: 'Supprime un modèle (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'OK' }, 404: { description: 'Introuvable' } },
      },
    },
    '/create-tag': {
      post: {
        summary: 'Crée un tag (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['slug', 'label', 'axis'],
                properties: { slug: { type: 'string' }, label: { type: 'string' }, axis: { type: 'string' }, color: { type: 'string' } },
              },
            },
          },
        },
        responses: { 201: { description: 'Créé' }, 409: { description: 'Slug déjà utilisé' } },
      },
    },
    '/update-tag': {
      patch: {
        summary: 'Modifie un tag (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', required: ['id'], properties: { id: { type: 'string' }, label: { type: 'string' }, color: { type: 'string' } } },
            },
          },
        },
        responses: { 200: { description: 'OK' } },
      },
    },
    '/delete-tag': {
      delete: {
        summary: 'Supprime un tag (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'OK' } },
      },
    },
    '/promote-admin': {
      post: {
        summary: 'Promeut un utilisateur admin (admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', required: ['user_id'], properties: { user_id: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'OK' } },
      },
    },
  },
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  return new Response(JSON.stringify(OPENAPI_SPEC, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
