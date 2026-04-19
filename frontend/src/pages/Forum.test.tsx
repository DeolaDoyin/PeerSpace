import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, beforeAll, afterAll, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import Forum from './Forum';

// Create the mock object
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};

vi.stubGlobal('localStorage', localStorageMock);

// 1. Mock the API responses
const handlers = [
  http.get('/api/user', () => HttpResponse.json({ id: 1, name: 'Nathan', role: 'user' })),
  http.get('/api/categories', () => HttpResponse.json([{ id: 1, name: 'Mental Health' }])),
  http.get('/api/posts', () => HttpResponse.json({
    pages: [{
      data: [{ id: 1, slug: 'test-post', title: 'Test Post', body: 'Test content', is_pinned: false }],
      meta: { current_page: 1, last_page: 1 }
    }]
  })),
  // Handle the report POST
  http.post('/api/posts/1/report', () => new HttpResponse(null, { status: 200 }))
];

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

test('opens report dialog when report button is clicked', async () => {
  const user = userEvent.setup();

  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Forum />
      </BrowserRouter>
    </QueryClientProvider>
  );

  // 2. Wait for the loading spinner to disappear and the "Report" button to appear
  const reportBtn = await screen.findByRole('button', { name: /report/i });
  
  // 3. Click the report button
  await user.click(reportBtn);
  
  // 4. Assert the Dialog is visible
  expect(screen.getByText(/Report this post\?/i)).toBeInTheDocument();
  expect(screen.getByText(/Is this post violating our community guidelines\?/i)).toBeInTheDocument();
});