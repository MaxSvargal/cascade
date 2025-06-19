import { useRef, useCallback } from 'react';
import type { SceneConnection, SceneParticle, SceneSpecialEffect } from './types';

interface SceneTimer {
  id: NodeJS.Timeout;
  sceneId: number;
}

interface TimerCallbacks {
  onConnection: (connection: { from: string; to: string; type?: string }) => void;
  onParticles: (artifactTypes: string[], count: number, color: string) => void;
  onSpecialEffect: (effect: SceneSpecialEffect) => void;
}

/**
 * Custom hook for managing scene-based timer scheduling and cleanup.
 * Handles delayed execution of connections, particles, and special effects.
 * Automatically prevents stale timer execution when scenes change.
 */
export const useSceneTimers = () => {
  const sceneTimersRef = useRef<SceneTimer[]>([]);
  const currentSceneRef = useRef<number>(0);

  const clearAllTimers = useCallback(() => {
    sceneTimersRef.current.forEach(timer => clearTimeout(timer.id));
    sceneTimersRef.current = [];
  }, []);

  const scheduleConnections = useCallback((
    connections: SceneConnection[],
    currentScene: number,
    callbacks: TimerCallbacks
  ) => {
    connections.forEach((connection) => {
      const timerId = setTimeout(() => {
        if (currentSceneRef.current === currentScene) {
          callbacks.onConnection({
            from: connection.from,
            to: connection.to,
            type: connection.type
          });
        }
        sceneTimersRef.current = sceneTimersRef.current.filter(timer => timer.id !== timerId);
      }, connection.delay);

      sceneTimersRef.current.push({ id: timerId, sceneId: currentScene });
    });
  }, []);

  const scheduleParticles = useCallback((
    particles: SceneParticle[],
    currentScene: number,
    callbacks: TimerCallbacks
  ) => {
    particles.forEach((particleConfig) => {
      const timerId = setTimeout(() => {
        if (currentSceneRef.current === currentScene) {
          callbacks.onParticles(
            particleConfig.artifactTypes,
            particleConfig.count,
            particleConfig.color
          );
        }
        sceneTimersRef.current = sceneTimersRef.current.filter(timer => timer.id !== timerId);
      }, particleConfig.delay);

      sceneTimersRef.current.push({ id: timerId, sceneId: currentScene });
    });
  }, []);

  const scheduleSpecialEffects = useCallback((
    specialEffects: SceneSpecialEffect[],
    currentScene: number,
    callbacks: TimerCallbacks
  ) => {
    specialEffects.forEach((effect) => {
      const timerId = setTimeout(() => {
        if (currentSceneRef.current === currentScene) {
          callbacks.onSpecialEffect(effect);
        }
        sceneTimersRef.current = sceneTimersRef.current.filter(timer => timer.id !== timerId);
      }, effect.delay);

      sceneTimersRef.current.push({ id: timerId, sceneId: currentScene });
    });
  }, []);

  const updateCurrentScene = useCallback((sceneId: number) => {
    currentSceneRef.current = sceneId;
  }, []);

  const cleanupTimers = useCallback(() => {
    clearAllTimers();
  }, [clearAllTimers]);

  return {
    clearAllTimers,
    scheduleConnections,
    scheduleParticles,
    scheduleSpecialEffects,
    updateCurrentScene,
    cleanupTimers
  };
}; 