import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

interface FlowData {
  nodes: Array<{ id: string; type: string; position: { x: number; y: number }; data: { label: string } }>;
  edges: Array<{ id: string; source: string; target: string }>;
}

// Example component - you would import your actual components
const ExampleComponent = () => {
  const [data, setData] = React.useState<FlowData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Add small delay to make loading state visible in tests
      await new Promise(resolve => setTimeout(resolve, 10));
      const response = await fetch('/api/flow');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchData} data-testid="fetch-button">
        Fetch Data
      </button>
      {loading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">{error}</div>}
      {data && (
        <div data-testid="data">
          <h2>Flow Data</h2>
          <p>Nodes: {data.nodes?.length || 0}</p>
          <p>Edges: {data.edges?.length || 0}</p>
        </div>
      )}
    </div>
  );
};

describe('ExampleComponent', () => {
  beforeEach(() => {
    // Reset any runtime request handlers we may add during the tests
    server.resetHandlers();
  });

  it('should render initial state correctly', () => {
    render(<ExampleComponent />);
    
    expect(screen.getByTestId('fetch-button')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('data')).not.toBeInTheDocument();
  });

  it('should fetch and display data successfully', async () => {
    const user = userEvent.setup();
    render(<ExampleComponent />);

    // Click the fetch button
    await user.click(screen.getByTestId('fetch-button'));

    // Should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for data to load (MSW will provide mock data)
    await waitFor(() => {
      expect(screen.getByTestId('data')).toBeInTheDocument();
    });

    // Should display the mocked data
    expect(screen.getByText('Flow Data')).toBeInTheDocument();
    expect(screen.getByText('Nodes: 3')).toBeInTheDocument();
    expect(screen.getByText('Edges: 2')).toBeInTheDocument();
    
    // Loading should be gone
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Override the default handler to return an error
    server.use(
      http.get('/api/flow', () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        );
      })
    );

    const user = userEvent.setup();
    render(<ExampleComponent />);

    await user.click(screen.getByTestId('fetch-button'));

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('data')).not.toBeInTheDocument();
  });

  it('should handle network timeouts', async () => {
    // Simulate a slow/timeout response
    server.use(
      http.get('/api/flow', async () => {
        // Delay the response to simulate timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({ nodes: [], edges: [] });
      })
    );

    const user = userEvent.setup();
    render(<ExampleComponent />);

    await user.click(screen.getByTestId('fetch-button'));

    // Should show loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Eventually should resolve
    await waitFor(() => {
      expect(screen.getByTestId('data')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getByText('Nodes: 0')).toBeInTheDocument();
  });

  it('should handle empty data responses', async () => {
    // Override to return empty data
    server.use(
      http.get('/api/flow', () => {
        return HttpResponse.json({ nodes: [], edges: [] });
      })
    );

    const user = userEvent.setup();
    render(<ExampleComponent />);

    await user.click(screen.getByTestId('fetch-button'));

    await waitFor(() => {
      expect(screen.getByTestId('data')).toBeInTheDocument();
    });

    expect(screen.getByText('Nodes: 0')).toBeInTheDocument();
    expect(screen.getByText('Edges: 0')).toBeInTheDocument();
  });
}); 