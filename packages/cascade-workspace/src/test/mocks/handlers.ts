import { http, HttpResponse } from 'msw';

// Define request handlers for your API endpoints
export const handlers = [
  // Example API handlers - customize these based on your actual API endpoints
  
  // Mock API route for execution status
  http.get('/api/execution/:executionId/status', ({ params }) => {
    const { executionId } = params;
    return HttpResponse.json({
      id: executionId,
      status: 'completed',
      progress: 100,
      result: {
        success: true,
        data: 'Mock execution result'
      }
    });
  }),

  // Mock API route for flow data
  http.get('/api/flow', () => {
    return HttpResponse.json({
      nodes: [
        { id: '1', type: 'input', position: { x: 0, y: 0 }, data: { label: 'Input' } },
        { id: '2', type: 'default', position: { x: 100, y: 100 }, data: { label: 'Process' } },
        { id: '3', type: 'output', position: { x: 200, y: 200 }, data: { label: 'Output' } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' }
      ]
    });
  }),

  // Mock API route for step execution
  http.post('/api/step', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      stepId: 'mock-step-id',
      result: body
    });
  }),

  // Add more handlers as needed for your specific API endpoints
];

// Export individual handler groups for specific test scenarios
export const errorHandlers = [
  http.get('/api/execution/:executionId/status', () => {
    return HttpResponse.json(
      { error: 'Execution not found' },
      { status: 404 }
    );
  }),
];

export const loadingHandlers = [
  http.get('/api/execution/:executionId/status', () => {
    return HttpResponse.json({
      status: 'running',
      progress: 50
    });
  }),
]; 