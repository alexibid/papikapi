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
      'a cute standing baby dragon, pure emerald-green facets with gold belly, small geometric wings, closed snout, exactly two large round eyes with white catchlights',
  },
  {
    id: 't-rex',
    label: 'T-Rex',
    slug: 't-rex',
    prompt:
      'a cute green tyrannosaurus rex, pure lime-green facets with pale yellow belly facets, closed solid wedge jaw with sharp white sawtooth teeth painted flat along the jawline as a 2D UV texture decal with no open mouth cavity and no 3D teeth, small green arms, exactly two round eyes with white catchlights',
  },
  {
    id: 'golden-puppy',
    label: 'Cãozinho Golden',
    slug: 'golden-puppy',
    prompt:
      'a cute sitting golden retriever puppy, pure warm butterscotch-yellow facets with cream chest facet, floppy ears, closed black nose facet, exactly two dark eyes with white catchlights',
  },
  {
    id: 'bicolor-cat',
    label: 'Gato Bicolor',
    slug: 'bicolor-cat',
    prompt:
      'a cute standing bicolor black and white cat, black fur covering the top of the head and ears, asymmetrical vertical white blaze on the nose bridge extending between the eyes towards its left eye, solid white muzzle and cheeks with a distinct black nose tip, distinct closed mouth line, white chin with a small black spot beneath the lower lip, large solid white chest bib extending down the belly, jet-black back and body, exactly one black tail, white socks on all four paws, pale yellow-green eyes with round white catchlights',
  },
];

export const MODEL_SYSTEM_PROMPT =
  'You are an expert 3D low-poly papercraft designer, origami artist, and 3D unfold engineer. You design foldable low-poly figures made of simple primary geometric volumes where micro-details are illustrated flat on the paper surface. All figures are designed for child papercraft physical assembly: standing naturally on all four legs flat on the ground plane with belly elevated and exactly four distinct legs and four paws for quadrupeds (or exactly two legs for bipeds), never sitting, never seated on hind legs, never crouching, zero floor shadow, zero cast shadow, completely seamless flat neutral light grey #E5E5E5 background, smooth bare clean cardstock cheeks and plain muzzle with a distinct cute closed mouth line decal painted flat (zero open mouth cavities), zero thin antennae, zero needle spikes, and zero thin protruding strands. You follow the studio signature aesthetic: cute expressive eyes with circular white catchlights and vibrant paper colors. You generate exactly one image that follows all instructions. Never write any text, letters, watermark or labels. Every rule is mandatory and none may be broken.';

export const MODEL_NEGATIVE_PROMPT =
  'sitting, seated, sitting on hind legs, seated cat, sitting upright, seated pose, crouching, lying down, kneeling, curled up, hiding legs, tucked paws, hidden hind legs, hat, cap, baseball cap, beanie, headwear, helmet, bonnet, head accessory, extra legs, five legs, six legs, three legs, deformed legs, extra paws, extra limbs, mutated limbs, missing limbs, fused legs, severed legs, extra tail, multiple tails, deformed anatomy, anatomical defect, malformed body, mutated anatomy, whiskers, cat whiskers, facial whiskers, whiskers protruding, thin whiskers, antennae, spikes, thin hair strands, needle spikes, whiskers lines, thin wires, suit, tuxedo jacket, bowtie, necktie, clothes, human clothes, bipedal, standing upright, humanoid, mascot, standing on two legs, two-legged, dinosaur arms, t-rex pose, kangaroo pose, bust, headshot, portrait, close-up, cropped, truncated torso, severed neck, partial figure, wireframe, crease lines, black fold lines, black outline lines, blueprint markings, dark edge seams, shadow, floor shadow, ground shadow, drop shadow, contact shadow, ambient occlusion beneath model, cast shadow, dark ground, 3D extruded teeth, jagged 3D spikes, open mouth cavity, top-down view, high angle view, isometric view, tilted body, leaning body, floating feet, front view, side profile view, extra eyes, three eyes, one eye, floating eyes, gradients, text, watermark, labels, cell divider borders, CGI, clay, plastic, smooth rounded cartoon';

export const MODEL_PROMPT_TEMPLATE = `low-poly faceted 3D papercraft model of {subject}. Seen in an EYE-LEVEL THREE-QUARTER VIEW, camera at the height of the subject's body (showing front and left-side facets), with all feet, paws or wheels resting on one flat horizontal ground plane.

Subject: {subject}.

STUDIO INVARIANTS (MANDATORY):
- COMPLETE ENTIRE OBJECT: The entire complete {subject} must be 100% visible from end to end, fully centered with generous margin inside the cell. NEVER a bust, NEVER just a head, NEVER a close-up, NEVER cropped.
- EYE-LEVEL THREE-QUARTER VIEW: Every figure is seen from a three-quarter view with the camera level with the body, no top-down tilt, standing upright and level with all feet on one flat horizontal ground plane, never leaning or tilted.
- ANATOMICAL INTEGRITY: Exactly four legs and four paws for quadrupeds (zero extra legs, never 5 or 6 legs, zero missing limbs, exactly one tail); exactly two legs for bipeds.
- ABSOLUTELY ZERO SHADOWS: Completely plain, seamless flat neutral light grey #E5E5E5 background. ZERO floor shadows, ZERO cast shadows, ZERO contact shadows under base, ZERO ambient occlusion.
- CLEAN LOW-POLY PAPERCRAFT FACETS: Crisp planar polygon facets made of solid matte paper cardstock colors with directional flat-shading only. ABSOLUTELY ZERO BLACK OUTLINE STROKES, ZERO BLACK CREASE LINES, ZERO WIREFRAME, ZERO BLUEPRINT MARKS, ZERO FOLD GUIDE LINES. Facets meet cleanly without dark lines.
- 100% CLOSED GEOMETRIC VOLUMES: All primary forms are closed solid low-poly polyhedra suitable for papercraft folding.
- FLAT 2D UV TEXTURE DECALS: Fine surface details (spots, stripes, headlights, teeth decals) are 100% flat 2D decals printed directly on the facet surfaces, never protruding 3D physical spikes or open cavities.
- CLEAN CARDSTOCK CHEEKS (MANDATORY): Cheeks and muzzle must be completely bare, smooth plain cardstock. A distinct cute closed mouth line decal is painted flat directly beneath the nose (zero open mouth cavities, zero thin protruding elements).
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

export type SubjectCategory = 'quadruped' | 'biped' | 'aquatic' | 'vehicle' | 'creature' | 'object';

export interface SubjectClassification {
  readonly category: SubjectCategory;
  readonly isLiving: boolean;
  readonly hasMuzzleOrCheeks: boolean;
  readonly stanceClause: string;
  readonly featuresClause: string;
  readonly eyesClause: string;
  readonly volumeClause: string;
}

export function classifySubject(subject: string): SubjectClassification {
  const s = subject.toLowerCase();

  const isQuadruped =
    /\b(cat|kitten|kitty|feline|tuxedo|calico|tabby|siamese|gato|gata|gatinho|gatinha|felino|dog|puppy|hound|canine|cao|cão|cachorro|cadela|cachorrinho|pug|shepherd|dalmatian|rottweiler|golden|retriever|lion|leao|leão|tiger|tigre|cheetah|chita|guepardo|leopard|leopardo|panther|pantera|jaguar|giraffe|girafa|zebra|elephant|elefante|hippo|hipopotamo|hipopótamo|rhino|rinoceronte|bear|urso|fox|raposa|deer|veado|fawn|wolf|lobo|squirrel|esquilo|hedgehog|ourico|ouriço|raccoon|guaxinim|horse|cavalo|pony|ponei|pónei|donkey|burro|cow|vaca|bull|touro|calf|bezerro|pig|porco|sheep|ovelha|lamb|cordeiro|goat|cabra|cabrito|rabbit|bunny|coelho|hamster|mouse|rato|ratinho)\b/i.test(s);

  const isBipedCreature =
    /\b(t-rex|trex|tyrannosaurus|velociraptor|raptor|dino|dinosaur|dinossauro|kangaroo|canguru|bird|passaro|pássaro|ave|owl|coruja|duck|pato|penguin|pinguim|chicken|galinha|galo|eagle|aguia|águia|parrot|papagaio|toucan|tucano|flamingo|ostrich|avestruz)\b/i.test(s);

  const isAquatic =
    /\b(fish|peixe|peixinho|shark|tubarao|tubarão|dolphin|golfinho|whale|baleia|orca|octopus|polvo|squid|lula|turtle|tartaruga|seahorse|cavalo-marinho|clownfish|peixe-palhaco|peixe-palhaço)\b/i.test(s);

  const isVehicle =
    /\b(car|carro|carrinho|truck|camiao|camião|camioneta|fire\s*truck|bombeiros|police\s*car|policia|polícia|ambulance|ambulancia|ambulância|tractor|trator|plane|airplane|aviao|avião|helicopter|helicoptero|helicóptero|train|comboio|trem|locomotive|locomotiva|boat|barco|ship|navio|submarine|submarino|rocket|foguetao|foguetão|foguete|spaceship|nave|motorcycle|moto|motociclo|bicycle|bike|bicicleta|vehicle|veiculo|veículo)\b/i.test(s);

  const isFantasyCreature =
    /\b(dragon|dragao|dragão|monster|monstro|pokemon|pokémon|pikachu|creeper|zombie|alien|extraterrestre)\b/i.test(s);

  const isLiving =
    isQuadruped ||
    isBipedCreature ||
    isAquatic ||
    isFantasyCreature ||
    /\b(animal|bicho|creature|criatura|pet|mascote|baby|bebe|bebé)\b/i.test(s);

  const hasMuzzleOrCheeks =
    isQuadruped ||
    /\b(dragon|dragao|dragão|bear|urso|fox|raposa|wolf|lobo)\b/i.test(s);

  let category: SubjectCategory = 'object';
  if (isVehicle) category = 'vehicle';
  else if (isQuadruped) category = 'quadruped';
  else if (isBipedCreature) category = 'biped';
  else if (isAquatic) category = 'aquatic';
  else if (isLiving) category = 'creature';

  const stanceClause = isQuadruped
    ? 'standing naturally on all four paws flat on the ground plane, exactly four distinct legs and four paws, belly elevated above the ground plane, smooth continuous back with exactly one single tail attached at the base of the spine (zero duplicate tails, never two tails, zero dorsal protrusions), full body profile in eye-level three-quarter view showing front and side, zero extra limbs, never sitting, never seated on hind legs, never bipedal'
    : isBipedCreature
      ? 'standing naturally upright and balanced with exactly two feet flat on the ground plane, exactly two legs, zero extra limbs'
      : isAquatic
        ? 'horizontal swimming posture, eye-level three-quarter view'
        : isVehicle
          ? 'resting level and stable with all wheels, tracks, or hull flat on the ground plane'
          : 'standing naturally with all feet flat on the ground plane';

  const featuresClause = hasMuzzleOrCheeks
    ? 'smooth bare paper cardstock cheeks, plain muzzle with a distinct cute closed mouth line decal'
    : isLiving
      ? 'smooth clean paper cardstock facial surfaces, zero thin spikes'
      : isVehicle
        ? 'closed solid geometric body and chassis, headlights and decals painted flat as 2D UV texture decals, zero thin antennae'
        : 'closed solid geometric volume, surface details painted flat as 2D decals';

  const eyesClause = isLiving
    ? 'exactly two large expressive eyes with white catchlights'
    : '';

  const volumeClause =
    'pure low-poly papercraft cardstock facets with clean planar folds, closed solid volumes with fine details painted flat as 2D UV texture decals';

  return {
    category,
    isLiving,
    hasMuzzleOrCheeks,
    stanceClause,
    featuresClause,
    eyesClause,
    volumeClause,
  };
}

export function composeStudioPrompt(subject: string, photoCount = 0): string {
  const cleanSubject = subject.trim() || 'o meu gato';
  const info = classifySubject(cleanSubject);

  const subjectLabel = /^a\s+cute\s+/i.test(cleanSubject) ? cleanSubject : `a cute ${cleanSubject}`;

  if (photoCount === 0) {
    const clauses = [
      subjectLabel,
      info.stanceClause,
      info.volumeClause,
      info.featuresClause,
      info.eyesClause,
      'zero floor shadow',
    ].filter(Boolean);
    return clauses.join(', ');
  }

  const photoClauses = [
    subjectLabel,
    info.stanceClause,
    `faithfully matching the ${photoCount} attached 3/4 reference photo(s) in proportions, fur colors, and exact markings`,
    'pure low-poly planar papercraft cardstock facets',
    'closed solid volumes',
    info.featuresClause,
    'flat 2D decals for spots and markings',
    info.eyesClause,
    'zero floor shadow',
  ].filter(Boolean);

  return photoClauses.join(', ');
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
- FLAT 2D UV TEXTURE DECALS: Fine surface details (spots, stripes, teeth decals) are 100% flat 2D decals printed directly on facet surfaces, never protruding 3D physical spikes.
- CLEAN CARDSTOCK CHEEKS (MANDATORY): Cheeks and muzzle are completely smooth bare cardstock without facial markings (prohibited for papercraft folding).
- EYES: Exactly two large cute expressive round eyes with circular white catchlights painted flat onto head facets.
- 3x2 MATRIX (6 ALTERNATIVES): 3 columns x 2 rows (Chibi -> Youthful -> Signature Adult). Pick #3 is the Papikapi Studio default.`;
  }

  return `low-poly faceted 3D papercraft model of ${cleanSubject}. Seen in an EYE-LEVEL THREE-QUARTER VIEW, camera at the height of the subject's body, with all feet resting on one flat horizontal ground plane.

Subject: ${cleanSubject}.

SUBJECT REFERENCE PHOTOS (${photoCount} photo(s) of the real subject attached):
- Faithfully preserve the subject's identity, proportions, body shape, fur colors, and the EXACT placement and size of every patch, spot, and marking shown in these photos.
- Photos are taken from a 3/4 perspective: replicate the subject's distinctive features in authentic low-poly folded papercraft cardstock style with crisp polygon facets.
- Maintain the strict eye-level three-quarter viewpoint with the body level and all feet on one flat ground plane.
- Complete entire figure without cropping, closed solid volumes, smooth bare paper cardstock cheeks, clean plain muzzle without facial markings, flat 2D UV texture decals for markings, exactly two expressive eyes with white catchlights, and ABSOLUTELY ZERO FLOOR SHADOWS.
- STUDIO INVARIANTS: Crisp planar polygon facets, solid matte paper cardstock, no black outline strokes, no crease lines, seamless light grey #E5E5E5 background, zero floor shadow, bare smooth cheeks without facial lines.`;
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
