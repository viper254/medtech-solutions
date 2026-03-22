// Feature: medtech-solutions-website, Property 10: Unauthenticated users cannot access admin routes

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

/**
 * Validates: Requirements 9.1, 9.10
 *
 * Property 10: Unauthenticated users cannot access admin routes.
 * - When there is no Supabase session, the user is redirected to /admin/login
 * - When there is a valid Supabase session, the protected content is rendered
 */

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

import { supabase } from '../lib/supabaseClient';

const mockedGetSession = supabase.auth.getSession as ReturnType<typeof vi.fn>;

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <Routes>
        <Route path="/admin/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute — Property 10: Unauthenticated users cannot access admin routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /admin/login when there is no session (unauthenticated)', async () => {
    mockedGetSession.mockResolvedValue({ data: { session: null } });

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeDefined();
    });

    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('renders protected content when there is a valid session (authenticated)', async () => {
    mockedGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          user: { id: 'user-123', email: 'admin@example.com' },
        },
      },
    });

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeDefined();
    });

    expect(screen.queryByText('Login Page')).toBeNull();
  });
});
