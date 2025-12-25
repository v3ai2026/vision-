/**
 * 火花特效配置
 * Spark Effects Configuration
 */

import type { ParticleConfig } from '../components/effects/sparks/types';

export const sparkConfig: Record<string, ParticleConfig> = {
  // 💥 爆炸火花 - Explosion sparks
  explosion: {
    count: 80,
    speed: [5, 15],
    size: [2, 6],
    colors: ['#00DC82', '#FFD700', '#FFFFFF'],
    gravity: true,
    glow: true,
    trail: true,
    lifespan: 1000,
    spread: 0.5
  },

  // ✨ 鼠标拖尾 - Mouse trail
  trail: {
    count: 5,
    speed: [1, 3],
    size: [1, 3],
    colors: ['#00DC82', '#80ffcc'],
    gravity: false,
    glow: true,
    trail: false,
    lifespan: 500,
    spread: 1
  },

  // ⚡ 边框流动 - Border flow
  flow: {
    count: 1,
    speed: [2, 5],
    size: [1, 2],
    colors: ['#00DC82'],
    gravity: false,
    glow: true,
    trail: true,
    lifespan: 2000,
    spread: 0.1
  },

  // 🌠 火花雨 - Spark rain
  rain: {
    count: 1,
    speed: [1, 3],
    size: [1, 2],
    colors: ['#00DC82', '#80ffcc'],
    gravity: true,
    glow: true,
    trail: true,
    lifespan: 3000,
    spread: 0.3
  },

  // 🎆 成功烟花 - Success fireworks
  fireworks: {
    count: 150,
    speed: [8, 20],
    size: [2, 8],
    colors: ['#FF0080', '#FF8C00', '#FFD700', '#00DC82', '#00BFFF', '#8A2BE2'],
    gravity: true,
    glow: true,
    trail: true,
    lifespan: 2000,
    spread: 0.3
  },

  // 💡 输入火花 - Input sparks
  input: {
    count: 3,
    speed: [1, 2],
    size: [1, 2],
    colors: ['#FFD700', '#FFA500'],
    gravity: false,
    glow: true,
    trail: false,
    lifespan: 800,
    spread: 0.5
  },

  // 🔥 悬停火花 - Hover sparks
  hover: {
    count: 5,
    speed: [1, 4],
    size: [1, 3],
    colors: ['#00DC82', '#FFD700'],
    gravity: false,
    glow: true,
    trail: true,
    lifespan: 1500,
    spread: 0.8
  },

  // 🌟 加载火花 - Loading sparks
  loading: {
    count: 20,
    speed: [3, 8],
    size: [1, 3],
    colors: ['#00DC82', '#80ffcc', '#FFFFFF'],
    gravity: false,
    glow: true,
    trail: true,
    lifespan: 1500,
    spread: 0.2
  },

  // ❌ 错误火花 - Error sparks
  error: {
    count: 30,
    speed: [4, 10],
    size: [2, 5],
    colors: ['#FF4444', '#FF8888', '#AA0000'],
    gravity: true,
    glow: true,
    trail: true,
    lifespan: 1200,
    spread: 0.5
  }
};

export type SparkType = keyof typeof sparkConfig;
