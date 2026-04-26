# CLAUDE.md — Solve 3D Library

> Bibliothèque web de modèles 3D pour la communauté Solve Naruto.
> Catalogue, prévisualisation glTF temps réel, gestion par tags, upload réservé aux admins.

---

## 1. Vision produit

**Solve 3D Library** est une plateforme web qui recense les modèles 3D utilisés dans l'écosystème Solve Naruto (playermodels, props, items custom, tenues de clans, armes ninja…). Chaque modèle est consultable en 3D temps réel directement dans le navigateur.

### Cas d'usage

- Un staff ou un membre cherche le modèle d'un kunai pour un événement RP → il browse la bibliothèque par tag `weapon` + `clan:konoha` et trouve le modèle en 10 secondes.
- Un admin convertit un nouveau lot de playermodels Source Engine en `.glb`, les upload, les tague, et toute la communauté peut les voir.
- Un développeur veut intégrer un modèle dans un site Solve (Mod Panel, BDM…) → il copie l'URL publique du `.glb` depuis la bibliothèque.

### Principes

1. **Lecture publique, écriture admin** : tout le monde peut browser et visualiser, seuls les admins uploadent.
2. **Performance avant tout** : un catalogue ne sert à rien s'il rame. Lazy loading, miniatures statiques, viewer 3D monté à la demande.
3. **Catégorisation par tags libres** : pas de hiérarchie rigide, des tags multi-axes (`type:weapon`, `clan:uchiha`, `format:playermodel`).
4. **Cohérence visuelle Solve** : même DNA que Solve Mod Panel v2 et Solve Paies (React 19 + Vite + Tailwind sans shadcn + Zustand + TanStack Query + Supabase Cloud + glassmorphism dark mode).

---

## 2. Stack technique

| Couche | Choix |
|---|---|
| Framework | React 19 + Vite |
| Langage | TypeScript (strict) |
| Styling | Tailwind CSS (pas de shadcn) |
| State global | Zustand |
| Server state | TanStack Query v5 |
| Routing | React Router v7 |
| Backend | Supabase Cloud (Auth + PostgreSQL + Storage + Edge Functions) |
| Auth | Supabase Auth via Discord OAuth |
| 3D | three.js + @react-three/fiber + @react-three/drei |
| Optimisation 3D | gltf-transform (CLI, pre-upload) |
| Déploiement | OVH VPS, Nginx, Let's Encrypt |
| CI/CD | Forgejo Actions |

### Pourquoi pas shadcn

Cohérence avec Solve Mod Panel v2 et Solve Paies : composants Tailwind custom, look glassmorphism dark, contrôle total sur le design system. Les composants 3D et les cartes-modèles ont besoin d'un look spécifique qui ne colle pas aux primitives shadcn standard.

### Pourquoi pas Zustand seul pour le server state

Comme dans Solve Mod Panel v2, Zustand gère l'UI/state local (filtres actifs, tags sélectionnés, modal viewer ouvert), TanStack Query gère tout ce qui vient du backend (catalogue, modèles, tags). Séparation stricte.

---

## 3. Identité visuelle

Style Solve Mod Panel v2 / Solve Paies :

- **Background** : `#0a0a0f` (presque noir, légère teinte bleue)
- **Surface glass** : `bg-white/5 backdrop-blur-xl border border-white/10`
- **Accent primaire** : Discord blurple `#5865F2` (cohérence OAuth)
- **Accent secondaire** : violet `#8b5cf6` pour les badges admin
- **Tags** : pastilles colorées par axe (type=bleu, clan=rouge, format=vert)
- **Texte** : `text-white` titres, `text-white/70` corps, `text-white/50` métadonnées
- **Police** : Inter (sans-serif) + JetBrains Mono pour les paths/IDs
- **Animations** : transitions douces (200–300ms), hover scale `1.02`, pas d'effets criards

### Layout

- Sidebar gauche (240px) : logo, navigation, filtres actifs
- Contenu central : grille de cartes modèles ou viewer 3D plein écran
- Pas de header fixe, la navigation vit dans la sidebar

---

## 4. Modèle de données

### 4.1 Schéma PostgreSQL

```sql
-- Profils utilisateurs (synchronisés depuis Supabase Auth)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text unique,
  username text not null,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tags (libres, créés à la volée par les admins)
create table tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- 'weapon', 'clan-uchiha', 'playermodel'
  label text not null,                 -- 'Weapon', 'Clan Uchiha', 'Playermodel'
  axis text not null,                  -- 'type', 'clan', 'format', 'rarity', 'misc'
  color text,                          -- hex, optionnel
  created_at timestamptz not null default now()
);

create index on tags(axis);

-- Modèles 3D
create table models (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- 'kunai-konoha-standard'
  name text not null,
  description text,
  glb_path text not null,              -- chemin Storage: 'models/{id}.glb'
  thumbnail_path text,                 -- chemin Storage: 'thumbnails/{id}.webp'
  file_size_bytes bigint,
  vertex_count integer,
  has_animations boolean not null default false,
  has_skeleton boolean not null default false,
  source_format text,                  -- 'source-engine', 'fbx', 'blender', 'sketchfab'
  uploaded_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on models(created_at desc);
create index on models(uploaded_by);

-- Liaison many-to-many models <-> tags
create table model_tags (
  model_id uuid not null references models(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (model_id, tag_id)
);

create index on model_tags(tag_id);

-- Compteur de vues (pour ranking populaire, optionnel mais utile)
create table model_views (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references models(id) on delete cascade,
  viewer_id uuid references profiles(id),  -- null = anonyme
  viewed_at timestamptz not null default now()
);

create index on model_views(model_id, viewed_at desc);

-- Vue agrégée pour les stats
create view model_view_stats as
select
  model_id,
  count(*) as total_views,
  count(distinct viewer_id) as unique_viewers,
  max(viewed_at) as last_viewed
from model_views
group by model_id;
```

### 4.2 Row Level Security

Tout passe par les Edge Functions avec service role key — **aucune query directe depuis le frontend**. Les RLS sont quand même actives en mode "deny by default" comme garde-fou.

```sql
alter table profiles enable row level security;
alter table tags enable row level security;
alter table models enable row level security;
alter table model_tags enable row level security;
alter table model_views enable row level security;

-- Aucune policy : tout est verrouillé. Les Edge Functions utilisent le service role.
```

### 4.3 Storage Buckets

```
models/        (public read, admin write via Edge Function)
  └── {model_id}.glb

thumbnails/    (public read, admin write via Edge Function)
  └── {model_id}.webp

source-files/  (private, admin read/write — archive des fichiers source bruts)
  └── {model_id}/
      ├── original.zip       (archive Source Engine, FBX, ou autre)
      └── notes.md           (notes de conversion)
```

---

## 5. Architecture backend (Edge Functions)

Toutes les fonctions sont dans `supabase/functions/`. Convention : `kebab-case`. Chaque fonction a son `index.ts` qui exporte un handler standard.

### 5.1 Helpers partagés

```
supabase/functions/_shared/
├── cors.ts              # Headers CORS standard
├── supabase-client.ts   # Client service role
├── auth.ts              # getUser(req), requireAdmin(user)
├── errors.ts            # ApiError class + handler
└── storage.ts           # uploadFile(), deleteFile(), getPublicUrl()
```

### 5.2 Endpoints

#### Public (auth optionnelle)

| Fonction | Méthode | Description |
|---|---|---|
| `list-models` | GET | Liste paginée avec filtres (tags[], search, sort) |
| `get-model` | GET | Détails d'un modèle + ses tags + ses stats |
| `list-tags` | GET | Tous les tags groupés par axe |
| `record-view` | POST | Incrémente le compteur de vues (anonyme ok) |

#### Auth requise

| Fonction | Méthode | Description |
|---|---|---|
| `get-profile` | GET | Profil de l'utilisateur connecté + flag `is_admin` |

#### Admin uniquement

| Fonction | Méthode | Description |
|---|---|---|
| `create-model` | POST | Multipart : `.glb` + `.webp` + métadonnées + tag_ids |
| `update-model` | PATCH | Modifie nom, description, tags |
| `delete-model` | DELETE | Supprime le modèle + ses fichiers Storage |
| `replace-model-file` | POST | Remplace le `.glb` (ex : version optimisée) |
| `create-tag` | POST | Crée un tag |
| `update-tag` | PATCH | Modifie un tag |
| `delete-tag` | DELETE | Supprime un tag (cascade sur model_tags) |
| `promote-admin` | POST | Promeut un utilisateur admin |

### 5.3 Spec `list-models`

```ts
// GET /list-models?tags=weapon,clan-uchiha&search=kunai&sort=recent&page=1&per_page=24

interface ListModelsResponse {
  models: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    thumbnail_url: string | null;  // URL publique signée
    file_size_bytes: number;
    has_animations: boolean;
    tags: Array<{ id: string; slug: string; label: string; axis: string; color: string | null }>;
    view_count: number;
    created_at: string;
  }>;
  total: number;
  page: number;
  per_page: number;
}
```

Logique de filtrage : un modèle matche si **tous les tags demandés sont présents** (AND, pas OR). Search = ILIKE sur name et description.

### 5.4 Spec `create-model`

```ts
// POST /create-model
// Content-Type: multipart/form-data

// Champs:
// - glb: File (.glb)
// - thumbnail: File (.webp ou .jpg, optionnel — généré côté client si absent)
// - name: string
// - slug: string (slugifié côté frontend)
// - description: string?
// - source_format: string?
// - tag_ids: JSON string (tableau d'UUID)

// Réponse:
interface CreateModelResponse {
  id: string;
  slug: string;
  glb_url: string;
  thumbnail_url: string | null;
}
```

Pipeline :
1. Vérifier admin
2. Valider fichier (extension `.glb`, taille < 50 Mo)
3. Insérer ligne dans `models`
4. Upload `.glb` vers `models/{id}.glb`
5. Upload thumbnail vers `thumbnails/{id}.webp`
6. Insérer lignes dans `model_tags`
7. Retourner les URLs publiques

### 5.5 Documentation API

**Toujours** maintenir une fonction `api-docs` qui sert un Swagger/OpenAPI inline avec la liste à jour de toutes les routes (cohérent avec le pattern VAO Golf).

```
supabase/functions/api-docs/index.ts
```

À chaque création ou modification d'Edge Function, mettre à jour la spec OpenAPI inline dans ce fichier.

---

## 6. Architecture frontend

### 6.1 Structure des dossiers

```
src/
├── main.tsx
├── App.tsx
├── routes/
│   ├── home.tsx                # Grille de modèles + filtres
│   ├── model-detail.tsx        # Page d'un modèle (viewer 3D fullscreen)
│   ├── admin/
│   │   ├── upload.tsx          # Upload de modèles
│   │   ├── models.tsx          # Gestion CRUD des modèles
│   │   └── tags.tsx            # Gestion CRUD des tags
│   └── auth-callback.tsx       # OAuth callback Discord
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── PageShell.tsx
│   │   └── UserMenu.tsx
│   ├── catalog/
│   │   ├── ModelCard.tsx       # Carte avec miniature
│   │   ├── ModelGrid.tsx
│   │   ├── TagFilter.tsx       # Multi-select de tags par axe
│   │   ├── SearchBar.tsx
│   │   └── SortMenu.tsx
│   ├── viewer/
│   │   ├── ModelViewer.tsx     # Composant principal R3F
│   │   ├── ModelLoader.tsx     # useGLTF + Suspense
│   │   ├── ViewerControls.tsx  # Boutons (animations, skins, fullscreen)
│   │   ├── AnimationMixer.tsx  # Sélecteur d'animation
│   │   └── ViewerStage.tsx     # Lights, env, ground
│   ├── tags/
│   │   ├── TagBadge.tsx
│   │   └── TagAxisGroup.tsx
│   └── ui/                     # Primitives Tailwind custom
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Spinner.tsx
│       └── Toast.tsx
├── stores/
│   ├── auth.ts                 # Zustand: user, isAdmin, login, logout
│   ├── filters.ts              # Zustand: selectedTags, search, sort
│   └── viewer.ts               # Zustand: currentAnimation, skinIndex
├── api/
│   ├── client.ts               # Wrapper fetch des Edge Functions
│   ├── models.ts               # listModels, getModel, createModel...
│   ├── tags.ts
│   └── auth.ts
├── hooks/
│   ├── useModels.ts            # TanStack Query keys
│   ├── useTags.ts
│   ├── useAuth.ts
│   └── useDebounce.ts
├── lib/
│   ├── supabase.ts
│   ├── slugify.ts
│   └── format.ts               # bytes → "12.4 Mo", date → relative
└── styles/
    └── globals.css
```

### 6.2 Conventions de code

- **TypeScript strict** : `strict: true`, `noUncheckedIndexedAccess: true`
- **Pas de any** : si bloqué, utiliser `unknown` + narrow
- **Imports absolus** via alias `@/` (configuré dans `vite.config.ts` et `tsconfig.json`)
- **Composants** en PascalCase, fonctions/hooks en camelCase, fichiers en kebab-case sauf composants
- **Pas de `index.ts` barrel** : import direct du fichier (mieux pour le tree-shaking et la lisibilité)
- **Tests** : Vitest pour les utils purs, pas de tests UI pour le moment

### 6.3 TanStack Query — clés invalidées

```ts
// Chaque mutation invalide les bons caches.
// Pattern strict, identique à Solve Mod Panel v2 :

queryClient.invalidateQueries({ queryKey: ['models'] });
queryClient.invalidateQueries({ queryKey: ['model', modelId] });
queryClient.invalidateQueries({ queryKey: ['tags'] });
queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
```

| Mutation | Clés invalidées |
|---|---|
| `createModel` | `['models']` |
| `updateModel` | `['models']`, `['model', id]` |
| `deleteModel` | `['models']` |
| `createTag` | `['tags']` |
| `deleteTag` | `['tags']`, `['models']` (vu que les filtres changent) |
| `recordView` | aucune (fire-and-forget) |

### 6.4 Auth Discord OAuth

Identique à Solve Mod Panel v2 :

```ts
await supabase.auth.signInWithOAuth({
  provider: 'discord',
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});
```

Au callback, le frontend appelle `get-profile` qui crée la ligne dans `profiles` si elle n'existe pas et renvoie le flag `is_admin`. Le store Zustand garde `user` et `isAdmin`.

### 6.5 Routing protégé

```tsx
<Route path="/admin/*" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
  <Route path="upload" element={<UploadPage />} />
  <Route path="models" element={<ModelsAdminPage />} />
  <Route path="tags" element={<TagsAdminPage />} />
</Route>
```

`RequireAdmin` redirige vers `/` si pas admin, affiche un spinner pendant le check.

---

## 7. Composant viewer 3D

### 7.1 Architecture

```tsx
// ModelViewer.tsx
<div className="relative h-full w-full">
  <Canvas
    camera={{ position: [0, 1.5, 3], fov: 50 }}
    dpr={[1, 2]}
    gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
  >
    <Suspense fallback={<LoaderIndicator />}>
      <ViewerStage>
        <ModelLoader url={glbUrl} />
      </ViewerStage>
    </Suspense>
    <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
  </Canvas>
  <ViewerControls />
</div>
```

### 7.2 ViewerStage

Drei `<Stage>` configuré pour un look propre par défaut : environment HDR neutre, light setup studio, ground shadow optionnel.

```tsx
<Stage
  intensity={0.5}
  environment="city"
  shadows={{ type: 'contact', opacity: 0.3, blur: 2 }}
  adjustCamera={1.2}
>
  {children}
</Stage>
```

### 7.3 ModelLoader

```tsx
function ModelLoader({ url }: { url: string }) {
  const { scene, animations } = useGLTF(url);
  const group = useRef<Group>(null);
  const { actions, names } = useAnimations(animations, group);
  const currentAnim = useViewerStore((s) => s.currentAnimation);

  useEffect(() => {
    if (!currentAnim || !actions[currentAnim]) return;
    const action = actions[currentAnim].reset().fadeIn(0.3).play();
    return () => { action.fadeOut(0.3); };
  }, [actions, currentAnim]);

  // Expose la liste d'animations au store pour les contrôles UI
  useEffect(() => {
    useViewerStore.setState({ availableAnimations: names });
  }, [names]);

  return <group ref={group}><primitive object={scene} /></group>;
}
```

### 7.4 Préchargement

Sur la grille, on précharge le `.glb` dès que la carte est hover :

```tsx
<button
  onMouseEnter={() => useGLTF.preload(model.glb_url)}
  onClick={() => navigate(`/models/${model.slug}`)}
>
  <ModelCard model={model} />
</button>
```

### 7.5 Cleanup mémoire

Three.js leak les géométries/textures si on ne les dispose pas. Au démontage du viewer :

```tsx
useEffect(() => {
  return () => {
    useGLTF.clear(url);  // drei expose ça
  };
}, [url]);
```

---

## 8. Système de tags

### 8.1 Axes prédéfinis

Pas hardcodés dans la table mais documentés ici comme convention. L'admin choisit l'axe au moment de créer le tag :

| Axis | Exemples | Couleur |
|---|---|---|
| `type` | weapon, prop, character, vehicle, building | bleu |
| `clan` | konoha, suna, kiri, oto, samurai, nukenin | rouge |
| `format` | playermodel, prop_static, prop_physics, ragdoll | vert |
| `rarity` | common, uncommon, rare, legendary | or |
| `misc` | wip, deprecated, custom-solve | gris |

Cohérent avec les villages déjà identifiés dans le ESP suite Solve Naruto et avec les niveaux de rareté de l'Economie Kirigakure.

### 8.2 Affichage

- Sur une **carte modèle** : 2-3 tags max visibles, le reste en "+3"
- Sur la **page détail** : tous les tags groupés par axe, alignés horizontalement
- Dans le **filtre sidebar** : un groupe par axe, chips multi-select avec count

### 8.3 Filtrage

Frontend : `selectedTags: string[]` dans le store Zustand → passé à `useModels` → URL query param `?tags=a,b,c`.

Logique AND : un modèle matche si chaque tag demandé est présent. Implémenté côté Edge Function avec un `having count(*) = N` après group by.

---

## 9. Pipeline upload admin

### 9.1 Workflow attendu

L'admin a déjà des `.glb` optimisés (générés via le script Source→glTF + `gltf-transform optimize`). L'upload se fait en 3 étapes guidées :

1. **Drop du fichier** : drag & drop d'un `.glb`, parsing client-side avec three.js pour extraire :
   - Vertex count
   - Présence d'animations
   - Présence de squelette
   - Taille fichier
2. **Génération de miniature** : on monte un `<Canvas>` headless, on capture une frame en `.webp` 512×512, l'admin peut prévisualiser et regénérer (changer angle de caméra)
3. **Métadonnées + tags** : nom, slug auto, description, sélecteur de tags multi-axes, bouton "Créer le tag" inline si manquant

### 9.2 Génération de miniature côté client

```tsx
import { Canvas } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';

function ThumbnailCapture({ onCapture }: { onCapture: (blob: Blob) => void }) {
  const { gl, scene, camera } = useThree();

  const capture = () => {
    gl.render(scene, camera);
    gl.domElement.toBlob((blob) => blob && onCapture(blob), 'image/webp', 0.85);
  };

  // Bouton externe déclenche capture()
}
```

Taille : 512×512, format webp qualité 0.85 → ~30-80 Ko par miniature. Stocké dans le bucket `thumbnails/`.

### 9.3 Validation côté serveur

L'Edge Function `create-model` revalide tout :

- MIME type du `.glb` (`model/gltf-binary` ou `application/octet-stream`)
- Taille < 50 Mo
- Slug unique (regex `[a-z0-9-]+`)
- Tous les `tag_ids` existent
- L'utilisateur est bien admin

---

## 10. Performance

### 10.1 Catalogue

- **Pagination** : 24 modèles par page
- **Skeleton cards** pendant le chargement initial
- **Miniatures lazy** via `loading="lazy"` natif
- **Préchargement glb** uniquement au hover, pas en masse
- **Debounce search** à 300ms

### 10.2 Viewer

- **Suspense** + spinner pendant le téléchargement
- **DPR cap** à `[1, 2]` pour éviter les écrans 4K qui ramènent les FPS à 15
- **Frameloop="demand"** pour les modèles statiques (rendu uniquement quand la caméra bouge)
- **Frameloop="always"** seulement si animation jouée

### 10.3 Bundle

- **Code splitting par route** via React Router lazy imports
- **three.js** importé sélectivement, pas en wildcard
- **Drei** : tree-shake-friendly, importer chaque helper individuellement
- **Cible bundle initial** : < 250 Ko gzipped (sans three.js qui charge sur la page viewer uniquement)

---

## 11. Déploiement

### 11.1 Frontend

- Build Vite → `dist/`
- Servi par Nginx sur OVH VPS
- HTTPS via Let's Encrypt (renouvellement auto)
- Domain : à définir, sous-domaine `models.solve-naruto.fr` cohérent avec les autres outils
- Cache : `Cache-Control: public, max-age=31536000, immutable` pour les assets hashés, `no-cache` pour `index.html`

### 11.2 Backend

- Supabase Cloud (un projet dédié, pas mutualisé)
- Edge Functions déployées via `supabase functions deploy`
- Migrations versionnées dans `supabase/migrations/`
- Seed initial des tags via `supabase/migrations/YYYYMMDD_seed_tags.sql`

### 11.3 Storage

- Bucket `models` : public read
- Bucket `thumbnails` : public read
- Bucket `source-files` : private (admins seulement, via signed URLs)
- CDN : Supabase ajoute son CDN automatiquement, suffisant pour démarrer

---

## 12. Roadmap par vagues

### Vague 1 — Fondations (1 semaine)

- Setup Vite + Tailwind + Zustand + TanStack Query
- Schema PostgreSQL + migrations
- Buckets Storage
- Helpers `_shared/`
- Auth Discord + `get-profile` + `promote-admin`
- Layout général (sidebar, page shell)

### Vague 2 — Catalogue lecture (1 semaine)

- Edge Functions `list-models`, `get-model`, `list-tags`, `record-view`
- Hooks TanStack Query
- Page d'accueil avec grille + filtres + search + sort
- Page détail modèle avec viewer R3F basique
- ModelCard avec miniatures

### Vague 3 — Tags admin (3 jours)

- Edge Functions tags CRUD
- Page admin tags
- Création de tag inline dans le formulaire d'upload (préparation Vague 4)

### Vague 4 — Upload admin (1 semaine)

- Edge Functions models CRUD
- Wizard d'upload 3 étapes
- Génération de miniature client-side
- Page admin liste/édition modèles

### Vague 5 — Viewer avancé (4 jours)

- Sélecteur d'animation
- Switch de skins (si modèle multi-matériaux)
- Mode fullscreen
- Boutons reset caméra, wireframe toggle, stats (vertex/triangle count)
- Recording GIF/PNG (export d'une animation)

### Vague 6 — Polish (continu)

- Toast system unifié
- Empty states soignés
- Stats publiques (top 10 modèles vus)
- Page profil utilisateur (modèles uploadés)
- Optimisations perf supplémentaires si besoin

---

## 13. Conventions importantes

### 13.1 Sécurité

- **Toujours** passer par Edge Functions pour les writes (pas de client direct PostgREST avec anon key)
- **Toujours** vérifier `is_admin` côté serveur, jamais se fier au frontend
- **Toujours** valider les fichiers uploadés (type MIME, taille, parsing test)
- **Jamais** exposer le service role key côté frontend
- **Jamais** faire confiance à un slug ou nom envoyé tel quel — toujours sanitize

### 13.2 Internationalisation

UI **en français** par défaut, comme l'écosystème Solve. Pas de i18n setup au démarrage, mais isoler les strings dans un dictionnaire `src/i18n/fr.ts` pour faciliter une future ouverture EN.

### 13.3 Logs et erreurs

- Edge Functions : `console.error` avec context structuré (user_id, model_id, action)
- Frontend : Toast user-friendly + Sentry/console pour le dev
- Pas de stack trace exposée à l'utilisateur

### 13.4 Versionning des modèles

Pas de versioning multi-fichiers au lancement (un slug = un `.glb` actuel). Le bouton "Replace file" écrase. Si besoin futur d'historique, ajouter une table `model_versions`.

### 13.5 Règle d'or

> **Toujours mettre à jour la spec inline dans `supabase/functions/api-docs/index.ts` après chaque création ou modification d'Edge Function.**

Pattern hérité de VAO Golf, pas négociable. La doc ne suit pas le code, elle vit avec lui.

---

## 14. Ressources externes

- glTF spec : https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
- gltf-transform : https://gltf-transform.dev/
- @react-three/fiber : https://docs.pmnd.rs/react-three-fiber
- @react-three/drei : https://github.com/pmndrs/drei
- Supabase JS : https://supabase.com/docs/reference/javascript
- TanStack Query : https://tanstack.com/query/latest
- Source→glTF batch script : voir bundle `source_to_gltf/`