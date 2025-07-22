// イージング関数の型定義
export type EasingFunction = (t: number) => number;

// イージングタイプの定義
export type EasingType =
  | "Linear"
  | "EaseInQuad"
  | "EaseOutQuad"
  | "EaseInOutQuad"
  | "EaseInCubic"
  | "EaseOutCubic"
  | "EaseInOutCubic"
  | "EaseInQuart"
  | "EaseOutQuart"
  | "EaseInOutQuart"
  | "EaseInQuint"
  | "EaseOutQuint"
  | "EaseInOutQuint"
  | "EaseInSine"
  | "EaseOutSine"
  | "EaseInOutSine"
  | "EaseInExpo"
  | "EaseOutExpo"
  | "EaseInOutExpo"
  | "EaseInCirc"
  | "EaseOutCirc"
  | "EaseInOutCirc"
  | "EaseInBack"
  | "EaseOutBack"
  | "EaseInOutBack"
  | "EaseInElastic"
  | "EaseOutElastic"
  | "EaseInOutElastic"
  | "EaseInBounce"
  | "EaseOutBounce"
  | "EaseInOutBounce";

// イージング関数の実装
export const Easing = {
  // 線形
  Linear: (t: number) => t,

  // Quad（2次）
  EaseInQuad: (t: number) => t * t,
  EaseOutQuad: (t: number) => 1 - (1 - t) * (1 - t),
  EaseInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)),

  // Cubic（3次）
  EaseInCubic: (t: number) => t * t * t,
  EaseOutCubic: (t: number) => 1 - (1 - t) * (1 - t) * (1 - t),
  EaseInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - 4 * (1 - t) * (1 - t) * (1 - t)),

  // Quart（4次）
  EaseInQuart: (t: number) => t * t * t * t,
  EaseOutQuart: (t: number) => 1 - (1 - t) * (1 - t) * (1 - t) * (1 - t),
  EaseInOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (1 - t) * (1 - t) * (1 - t) * (1 - t),

  // Quint（5次）
  EaseInQuint: (t: number) => t * t * t * t * t,
  EaseOutQuint: (t: number) => 1 - (1 - t) * (1 - t) * (1 - t) * (1 - t) * (1 - t),
  EaseInOutQuint: (t: number) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 - 16 * (1 - t) * (1 - t) * (1 - t) * (1 - t) * (1 - t),

  // Sine
  EaseInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  EaseOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  EaseInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Expo
  EaseInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  EaseOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  EaseInOutExpo: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // Circ
  EaseInCirc: (t: number) => 1 - Math.sqrt(1 - t * t),
  EaseOutCirc: (t: number) => Math.sqrt(1 - (t - 1) * (t - 1)),
  EaseInOutCirc: (t: number) => {
    return t < 0.5
      ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
      : (Math.sqrt(1 - 4 * (t - 1) * (t - 1)) + 1) / 2;
  },

  // Back
  EaseInBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  EaseOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) * (t - 1) * (t - 1) + c1 * (t - 1) * (t - 1);
  },
  EaseInOutBack: (t: number) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (2 * t * t * ((c2 + 1) * 2 * t - c2)) / 2
      : (2 * (t - 1) * (t - 1) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic
  EaseInElastic: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  EaseOutElastic: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  EaseInOutElastic: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c5 = (2 * Math.PI) / 4.5;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // Bounce
  EaseInBounce: (t: number) => 1 - Easing.EaseOutBounce(1 - t),
  EaseOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  EaseInOutBounce: (t: number) => {
    return t < 0.5
      ? (1 - Easing.EaseOutBounce(1 - 2 * t)) / 2
      : (1 + Easing.EaseOutBounce(2 * t - 1)) / 2;
  },
} as const;

// 文字列指定版の補間関数
export function lerp(
  start: number,
  end: number,
  t: number,
  easingType: EasingType = "Linear"
): number {
  const clampedT = Math.max(0, Math.min(1, t));
  const easedT = Easing[easingType](clampedT);
  return start + (end - start) * easedT;
}

// 文字列がEasingTypeかどうかを判定
export function isEasingType(value: string): value is EasingType {
  return value in Easing;
}

type EasingKeys = keyof typeof Easing;
export const easingStrings: EasingKeys[] = Object.keys(Easing) as EasingKeys[];
