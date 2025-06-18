// Cascade Client Library - Main Export
// Unified execution client and test server for Cascade Flow Visualizer

// Export main client classes and functions
export { CascadeClient, createProductionClient, createTestClient, processEventStream } from './client';
export { CascadeTestServer } from './testServer';

// Export all types
export * from './types';

// Export default client instance for convenience
export { createProductionClient as createClient } from './client'; 