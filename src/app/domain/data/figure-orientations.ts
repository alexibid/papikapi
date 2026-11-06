export const DEFAULT_FIGURE_YAW_DEG = 35;

export const FIGURE_YAW_DEGREES: Readonly<Record<string, number>> = {
  // Cats
  'a2182a3u': 305,
  'j26braly': 305,
  'qcn6gi7q': 305,
  'y7n1d4h5': 305,
  '05krbysf': 305,
  'u2jru2pr': 305,

  // Dogs
  '95i22zy3': 305,
  'eq3on1z3': 305,
  'fsrpah3g': 305,
  'baipqeo7': 305,
  '81avhktg': 305,
  'qs74lvee': 305,

  // Wild & Savannah
  'sx8qdo3v': 305,
  'fejt91ln': 305,
  'g92kvjtf': 305,
  'ble8tn2e': 305,
  'd92ebv40': 305,
  'htudsj3b': 305,
  's4yeicxu': 305,
  'liiysu2i': 305,
  'gxgfiwtf': 305,

  // Large & Farm Animals
  '0rxptcst': 305,
  'ja0vwl1w': 305,
  'jtustidy': 305,
  'vd5vo2bg': 305,

  // Marine
  'ggsi52jd': 305,
  '4vv5v0qn': 305,
  '2i5momas': 305,

  // Characters & Vehicles
  'd3akf8ff': 215,
  'hrd1uvps': 305,
  '2ia2hryn': 305,
  'pm64g4zx': 305,
  'ayv4jctc': 305,
  'dz5voop3': 305,
  'fthr7of0': 305,
  'h56xc30o': 215,
  'u7wvc5gj': 305,
  'lmmp7uix': 305,
};

export function figureProjectionYaw(figureIdOrYaw?: string | number): number {
  if (typeof figureIdOrYaw === 'number') {
    return figureIdOrYaw;
  }
  if (!figureIdOrYaw) {
    return (DEFAULT_FIGURE_YAW_DEG * Math.PI) / 180;
  }
  const deg = FIGURE_YAW_DEGREES[figureIdOrYaw] ?? DEFAULT_FIGURE_YAW_DEG;
  return (deg * Math.PI) / 180;
}

export function figureStageYaw(figureIdOrUrl?: string, baseHomeYaw = Math.PI * 0.28): number {
  if (!figureIdOrUrl) return baseHomeYaw;
  const match = figureIdOrUrl.match(/(?:models|figures)\/([^/?#]+)/);
  const id = match ? match[1] : figureIdOrUrl;
  const deg = FIGURE_YAW_DEGREES[id];
  if (deg === undefined) return baseHomeYaw;
  const offsetDeg = deg - DEFAULT_FIGURE_YAW_DEG;
  return baseHomeYaw + (offsetDeg * Math.PI) / 180;
}
