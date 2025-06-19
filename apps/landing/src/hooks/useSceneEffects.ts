import { useEffect, useCallback } from 'react';
import { useSceneTimers } from './useSceneTimers';
import type { 
  ArtifactPosition, 
  VisualizationSceneConfig, 
  SceneEffectsCallbacks,
  SceneSpecialEffect 
} from './types';

/**
 * Custom hook for orchestrating scene-based animation effects.
 * Combines timer management with animation callbacks to create
 * delayed connections, particles, and special effects for each scene.
 * @param currentScene - The current scene number
 * @param sceneConfig - Configuration for the current scene
 * @param artifactPositions - Positions of all artifacts for particle placement
 * @param callbacks - Callback functions for creating animations
 */
export const useSceneEffects = (
  currentScene: number,
  sceneConfig: VisualizationSceneConfig,
  artifactPositions: ArtifactPosition[],
  callbacks: SceneEffectsCallbacks
) => {
  const {
    clearAllTimers,
    scheduleConnections,
    scheduleParticles,
    scheduleSpecialEffects,
    updateCurrentScene,
    cleanupTimers
  } = useSceneTimers();

  const handleConnection = useCallback((connection: { from: string; to: string; type?: string }) => {
    callbacks.onConnectionCreate(connection);
  }, [callbacks]);

  const handleParticles = useCallback((artifactTypes: string[], count: number, color: string) => {
    artifactPositions
      .filter(pos => artifactTypes.includes(pos.type))
      .forEach(pos => {
        callbacks.onParticleCreate(pos.x, pos.y, count, color);
      });
  }, [artifactPositions, callbacks]);

  const handleSpecialEffect = useCallback((effect: SceneSpecialEffect) => {
    if (effect.type === 'codeTransform') {
      callbacks.onCodeTransform();
    }
  }, [callbacks]);

  useEffect(() => {
    // Clear all previous timers
    clearAllTimers();
    
    // Update current scene reference
    updateCurrentScene(currentScene);

    // Schedule connections with delays
    if (sceneConfig.connections) {
      scheduleConnections(sceneConfig.connections, currentScene, {
        onConnection: handleConnection,
        onParticles: handleParticles,
        onSpecialEffect: handleSpecialEffect
      });
    }

    // Schedule particle effects
    if (sceneConfig.particles) {
      scheduleParticles(sceneConfig.particles, currentScene, {
        onConnection: handleConnection,
        onParticles: handleParticles,
        onSpecialEffect: handleSpecialEffect
      });
    }

    // Schedule special effects
    if (sceneConfig.specialEffects) {
      scheduleSpecialEffects(sceneConfig.specialEffects, currentScene, {
        onConnection: handleConnection,
        onParticles: handleParticles,
        onSpecialEffect: handleSpecialEffect
      });
    }
  }, [
    currentScene,
    sceneConfig,
    clearAllTimers,
    updateCurrentScene,
    scheduleConnections,
    scheduleParticles,
    scheduleSpecialEffects,
    handleConnection,
    handleParticles,
    handleSpecialEffect
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, [cleanupTimers]);
}; 