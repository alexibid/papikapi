export const FIGURE_NAMES: Readonly<Record<string, { pt: string; en: string }>> = {
  ankylosaurus: { pt: 'Anquilossauro', en: 'Ankylosaurus' },
  bear: { pt: 'Urso', en: 'Bear' },
  'black-tuxedo': { pt: 'Gato Fraque', en: 'Black Tuxedo Cat' },
  'blue-eyed-pug': { pt: 'Pug Olhos Azuis', en: 'Blue-eyed Pug' },
  brachiosaurus: { pt: 'Braquiossauro', en: 'Brachiosaurus' },
  calico: { pt: 'Gato Calico', en: 'Calico Cat' },
  cheetah: { pt: 'Chita', en: 'Cheetah' },
  clownfish: { pt: 'Peixe-palhaço', en: 'Clownfish' },
  cow: { pt: 'Vaca', en: 'Cow' },
  dalmatian: { pt: 'Dálmata', en: 'Dalmatian' },
  dolphin: { pt: 'Golfinho', en: 'Dolphin' },
  elephant: { pt: 'Elefante', en: 'Elephant' },
  fawn: { pt: 'Cervinho', en: 'Fawn' },
  'fire-truck': { pt: 'Carro de Bombeiros', en: 'Fire Truck' },
  fox: { pt: 'Raposa', en: 'Fox' },
  'german-shepherd': { pt: 'Pastor Alemão', en: 'German Shepherd' },
  giraffe: { pt: 'Girafa', en: 'Giraffe' },
  'golden-puppy': { pt: 'Cachorrinho Golden', en: 'Golden Puppy' },
  'gray-kitten': { pt: 'Gatinho Cinzento', en: 'Gray Kitten' },
  'hammerhead-shark': { pt: 'Tubarão-martelo', en: 'Hammerhead Shark' },
  hippo: { pt: 'Hipopótamo', en: 'Hippo' },
  lion: { pt: 'Leão', en: 'Lion' },
  octopus: { pt: 'Polvo', en: 'Octopus' },
  'orange-tabby': { pt: 'Gato Ruivo', en: 'Orange Tabby' },
  owl: { pt: 'Coruja', en: 'Owl' },
  pig: { pt: 'Porco', en: 'Pig' },
  plane: { pt: 'Avião', en: 'Plane' },
  'police-car': { pt: 'Carro da Polícia', en: 'Police Car' },
  pug: { pt: 'Pug', en: 'Pug' },
  raccoon: { pt: 'Guaxinim', en: 'Raccoon' },
  rottweiler: { pt: 'Rottweiler', en: 'Rottweiler' },
  'sea-turtle': { pt: 'Tartaruga-marinha', en: 'Sea Turtle' },
  seahorse: { pt: 'Cavalo-marinho', en: 'Seahorse' },
  siamese: { pt: 'Gato Siamês', en: 'Siamese Cat' },
  squirrel: { pt: 'Esquilo', en: 'Squirrel' },
  stegosaurus: { pt: 'Estegossauro', en: 'Stegosaurus' },
  submarine: { pt: 'Submarino', en: 'Submarine' },
  't-rex': { pt: 'T-Rex', en: 'T-Rex' },
  tractor: { pt: 'Trator', en: 'Tractor' },
  train: { pt: 'Comboio', en: 'Train' },
  triceratops: { pt: 'Tricerátops', en: 'Triceratops' },
  unicornio: { pt: 'Unicórnio', en: 'Unicorn' },
  velociraptor: { pt: 'Velociraptor', en: 'Velociraptor' },
  'white-kitten': { pt: 'Gatinho Branco', en: 'White Kitten' },
  zebra: { pt: 'Zebra', en: 'Zebra' },
};

export function formatFigureName(figureId: string, lang = 'pt'): string {
  const match = FIGURE_NAMES[figureId];
  if (match) {
    return lang === 'en' ? match.en : match.pt;
  }
  return figureId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
