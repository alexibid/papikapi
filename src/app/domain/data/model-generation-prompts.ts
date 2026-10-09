export interface ReferencePhoto {
  readonly id: string;
  readonly name: string;
  readonly dataUrl: string;
}

export interface StudioModelPreset {
  readonly id: string;
  readonly label: string;
  readonly slug: string;
  readonly prompt: string;
}

export const STUDIO_MODEL_PRESETS: readonly StudioModelPreset[] = [
  {
    id: 'baby-dragon',
    label: 'Dragão Bebé',
    slug: 'baby-dragon',
    prompt:
      'a cute standing baby dragon, pure emerald-green facets with gold belly, small geometric wings, closed snout, exactly two large round eyes with white catchlights, zero floor shadow',
  },
  {
    id: 't-rex',
    label: 'T-Rex',
    slug: 't-rex',
    prompt:
      'a cute green tyrannosaurus rex, pure lime-green facets with pale yellow belly facets, closed solid wedge jaw with sharp white sawtooth teeth painted flat along the jawline as a 2D UV texture decal with no open mouth cavity and no 3D teeth, small green arms, exactly two round eyes with white catchlights, zero floor shadow',
  },
  {
    id: 'golden-puppy',
    label: 'Cãozinho Golden',
    slug: 'golden-puppy',
    prompt:
      'a cute sitting golden retriever puppy, pure warm butterscotch-yellow facets with cream chest facet, floppy ears, closed black nose facet, exactly two dark eyes with white catchlights, zero floor shadow',
  },
  {
    id: 'black-tuxedo',
    label: 'Gato Tuxedo',
    slug: 'black-tuxedo',
    prompt:
      'a cute standing black tuxedo kitten, pure jet-black facets with pure white chest, chin, and paw facets, closed muzzle with white whiskers painted flat as a 2D UV decal, exactly two yellow eyes with white catchlights, zero floor shadow',
  },
];

export const MODEL_SYSTEM_PROMPT =
  'You are an expert 3D low-poly papercraft designer, origami artist, and 3D unfold engineer. You design foldable low-poly figures made of simple primary geometric volumes where micro-details are illustrated flat on the paper surface. You follow the studio signature aesthetic: cute expressive eyes with circular white catchlights and vibrant paper colors. You generate exactly one image that follows all instructions. Never write any text, letters, watermark or labels. Every rule is mandatory and none may be broken.';

export const MODEL_NEGATIVE_PROMPT =
  'bust, headshot, portrait, close-up, cropped, truncated torso, severed neck, partial figure, wireframe, crease lines, black fold lines, black outline lines, blueprint markings, dark edge seams, shadow, floor shadow, ground shadow, drop shadow, contact shadow, ambient occlusion beneath model, cast shadow, dark ground, 3D extruded teeth, jagged 3D spikes, open mouth cavity, top-down view, high angle view, isometric view, tilted body, leaning body, floating feet, front view, side profile view, extra eyes, three eyes, one eye, floating eyes, gradients, text, watermark, labels, cell divider borders, CGI, clay, plastic, smooth rounded cartoon';

export const MODEL_PROMPT_TEMPLATE = `low-poly faceted 3D papercraft model of {subject}. Seen in an EYE-LEVEL THREE-QUARTER VIEW, camera at the height of the subject's body (showing front and left-side facets), with all feet, paws or wheels resting on one flat horizontal ground plane.

Subject: {subject}.

STUDIO INVARIANTS (MANDATORY):
- COMPLETE ENTIRE OBJECT: The entire complete {subject} must be 100% visible from end to end, fully centered with generous margin inside the cell. NEVER a bust, NEVER just a head, NEVER a close-up, NEVER cropped.
- EYE-LEVEL THREE-QUARTER VIEW: Every figure is seen from a three-quarter view with the camera level with the body, no top-down tilt, standing upright and level with all feet on one flat horizontal ground plane, never leaning or tilted.
- ABSOLUTELY ZERO SHADOWS: Completely plain, seamless flat neutral light grey #E5E5E5 background. ZERO floor shadows, ZERO cast shadows, ZERO contact shadows under base, ZERO ambient occlusion.
- CLEAN LOW-POLY PAPERCRAFT FACETS: Crisp planar polygon facets made of solid matte paper cardstock colors with directional flat-shading only. ABSOLUTELY ZERO BLACK OUTLINE STROKES, ZERO BLACK CREASE LINES, ZERO WIREFRAME, ZERO BLUEPRINT MARKS, ZERO FOLD GUIDE LINES. Facets meet cleanly without dark lines.
- 100% CLOSED GEOMETRIC VOLUMES: All primary forms are closed solid low-poly polyhedra suitable for papercraft folding.
- FLAT 2D UV TEXTURE DECALS: Fine surface details (spots, stripes, whiskers, headlights, teeth, decals) are 100% flat 2D decals printed directly on the facet surfaces, never protruding 3D physical spikes or open cavities.
- EYES: For living creatures, exactly two large cute expressive round eyes with circular white catchlights painted flat onto head facets. Never three eyes, never floating eyes.
- No shadows, no gradients, no text, no labels, no cell dividers, no grid lines.`;

export function slugify(input: string): string {
  const normalized = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'custom-model';
}

export function composeStudioPrompt(subject: string, photoCount = 0): string {
  const cleanSubject = subject.trim() || 'o meu gato';
  if (photoCount === 0) {
    return `a cute standing ${cleanSubject}, pure low-poly papercraft cardstock facets with clean planar folds, closed solid volumes with fine details painted flat as 2D UV texture decals, exactly two large expressive eyes with white catchlights, zero floor shadow`;
  }
  return `a cute standing ${cleanSubject}, faithfully matching the ${photoCount} attached 3/4 reference photo(s) in proportions, fur colors, and exact markings, pure low-poly planar papercraft cardstock facets, closed solid volumes, flat 2D decals for whiskers and spots, exactly two large cute expressive eyes with white catchlights, zero floor shadow`;
}

export function composeFullAiPrompt(subject: string, photoCount = 0): string {
  const cleanSubject = subject.trim() || 'o meu gato';
  if (photoCount === 0) {
    return `low-poly faceted 3D papercraft model of ${cleanSubject}. Seen in an EYE-LEVEL THREE-QUARTER VIEW, camera at the height of the subject's body, with all feet resting on one flat horizontal ground plane.

Subject: ${cleanSubject}.

STUDIO INVARIANTS (MANDATORY):
- COMPLETE ENTIRE OBJECT: The entire complete ${cleanSubject} must be 100% visible from end to end, fully centered with generous margin inside the cell. NEVER a bust, NEVER just a head, NEVER a close-up, NEVER cropped.
- EYE-LEVEL THREE-QUARTER VIEW: Figure is seen from a 3/4 view with the camera level with the body, standing upright and level with all feet on one flat horizontal ground plane.
- ABSOLUTELY ZERO SHADOWS: Completely plain, seamless flat neutral light grey #E5E5E5 background. ZERO floor shadows, ZERO cast shadows, ZERO contact shadows under base.
- CLEAN LOW-POLY PAPERCRAFT FACETS: Crisp planar polygon facets made of solid matte paper cardstock colors with directional flat-shading only. ABSOLUTELY ZERO black outline strokes, ZERO crease lines, ZERO wireframe.
- 100% CLOSED GEOMETRIC VOLUMES: All primary forms are closed solid low-poly polyhedra suitable for papercraft folding.
- FLAT 2D UV TEXTURE DECALS: Fine surface details (spots, stripes, whiskers, teeth) are 100% flat 2D decals printed directly on facet surfaces, never protruding 3D physical spikes.
- EYES: Exactly two large cute expressive round eyes with circular white catchlights painted flat onto head facets.
- 3x2 MATRIX (6 ALTERNATIVES): 3 columns x 2 rows (Chibi -> Youthful -> Signature Adult). Pick #3 is the Papikapi Studio default.`;
  }

  return `low-poly faceted 3D papercraft model of ${cleanSubject}. Seen in an EYE-LEVEL THREE-QUARTER VIEW, camera at the height of the subject's body, with all feet resting on one flat horizontal ground plane.

Subject: ${cleanSubject}.

SUBJECT REFERENCE PHOTOS (${photoCount} photo(s) of the real subject attached):
- Faithfully preserve the subject's identity, proportions, body shape, fur colors, and the EXACT placement and size of every patch, spot, and marking shown in these photos.
- Photos are taken from a 3/4 perspective: replicate the subject's distinctive features in authentic low-poly folded papercraft cardstock style with crisp polygon facets.
- Maintain the strict eye-level three-quarter viewpoint with the body level and all feet on one flat ground plane.
- Complete entire figure without cropping, closed solid volumes, flat 2D UV texture decals for markings, exactly two expressive eyes with white catchlights, and ABSOLUTELY ZERO FLOOR SHADOWS.
- STUDIO INVARIANTS: Crisp planar polygon facets, solid matte paper cardstock, no black outline strokes, no crease lines, seamless light grey #E5E5E5 background, zero floor shadow.`;
}

export function buildStudioPrompt(subject: string): string {
  return composeStudioPrompt(subject, 0);
}

export function buildStudioNxCommand(slug: string, prompt: string): string {
  const effectiveSlug = slugify(slug);
  return `nx run papikapi-studio:stages -- --model=${effectiveSlug} --prompt='${prompt}' --pick=3`;
}

export function buildFullAiPrompt(subject: string): string {
  return composeFullAiPrompt(subject, 0);
}

export function buildModelPrompt(subject: string): string {
  return composeStudioPrompt(subject, 0);
}
