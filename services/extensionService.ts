
import { Extension } from "../types";

export const PLUGIN_REGISTRY: Extension[] = [
  {
    id: 'vsl-a11y-guardian',
    name: 'A11y Guardian Pro',
    description: 'Enforces strict semantic HTML and ARIA 1.2 compliance during the generation phase.',
    category: 'PROTOCOL',
    version: '2.0.0',
    author: 'Studio Core',
    enabled: true,
    manifest: 'Mandates semantic tags (<nav>, <main>, etc.) and valid ARIA attributes (labels, roles, descriptions) for every UI element. Validates keyboard accessibility and focus management.'
  },
  {
    id: 'vsl-pwa-booster',
    name: 'PWA Manifestor',
    description: 'Automatically generates manifest.json and service worker logic.',
    category: 'COMPILER',
    version: '0.9.2',
    author: 'Studio Core',
    enabled: false,
    manifest: 'Appends sw.js and web-manifest config to build output.'
  },
  {
    id: 'vsl-neural-styles',
    name: 'Neural Theme Engine',
    description: 'Applies deep-dark aesthetics and glassmorphism by default.',
    category: 'INTERFACE',
    version: '2.1.0',
    author: 'Studio Core',
    enabled: true,
    manifest: 'Pre-configures Tailwind with studio-custom design tokens and accessible contrast ratios.'
  },
  {
    id: 'vsl-vitest-runner',
    name: 'Vitest Prime',
    description: 'Generates robust, A11y-aware unit tests for every created component using Vitest.',
    category: 'COMPILER',
    version: '2.0.0',
    author: 'Studio Core',
    enabled: true,
    manifest: 'Automatically produces a .test.tsx file for every component. Tests prioritize functional correctness and accessibility attribute presence.'
  }
];

export const getActiveInstructions = (extensions: Extension[]): string => {
  return extensions
    .filter(ext => ext.enabled)
    .map(ext => `[Plugin: ${ext.name}] ${ext.manifest}`)
    .join('\n');
};
