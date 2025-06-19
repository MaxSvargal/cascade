// Shared types for scene management hooks

export interface ArtifactPosition {
  x: number;
  y: number;
  angle: number;
  ring: string;
  type: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface EnergyBolt {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  color: string;
}

export interface AnimatedConnection {
  from: string;
  to: string;
  type?: string;
  progress: number;
  id: string;
}

export interface SceneConnection {
  from: string;
  to: string;
  type?: string;
  delay: number;
}

export interface SceneParticle {
  artifactTypes: string[];
  count: number;
  color: string;
  delay: number;
}

export interface SceneSpecialEffect {
  type: 'codeTransform';
  delay: number;
}

// Configuration for DDM visualization scenes
export interface VisualizationSceneConfig {
  highlightedArtifacts: string[];
  zoomLevel: number;
  panOffset: { x: number; y: number };
  showDirectiveEffect: boolean;
  codeTransformed: boolean;
  connections?: SceneConnection[];
  particles?: SceneParticle[];
  specialEffects?: SceneSpecialEffect[];
}

// Configuration for content sections (title and content only)
export interface ContentSceneConfig {
  title: string;
  content: string;
}

// Legacy interface - kept for backward compatibility if needed
export interface SceneConfig {
  title: string;
  content: string;
  highlightedArtifacts: string[];
  zoomLevel: number;
  panOffset: { x: number; y: number };
  showDirectiveEffect: boolean;
  codeTransformed: boolean;
  connections?: SceneConnection[];
  particles?: SceneParticle[];
  specialEffects?: SceneSpecialEffect[];
}

export interface SceneEffectsCallbacks {
  onConnectionCreate: (connection: { from: string; to: string; type?: string }) => void;
  onParticleCreate: (x: number, y: number, count: number, color: string) => void;
  onCodeTransform: () => void;
} 