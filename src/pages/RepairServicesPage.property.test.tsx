// Feature: medtech-solutions-website, Property 4: Repair service page renders description and turnaround for every service

import { describe, it, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, act } from '@testing-library/react';
import type { RepairService } from '../types';

/**
 * Validates: Requirements 3.2
 *
 * Property 4: For any list of repair services, the rendered RepairServicesPage
 * should contain each service's `name`, `description`, and `estimated_turnaround` text.
 */

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

import { supabase } from '../lib/supabaseClient';
import RepairServicesPage from './RepairServicesPage';

// Constrain to strings with at least one non-whitespace character,
// matching real-world service data and avoiding DOM text-matching edge cases.
const nonBlankString = (maxLength: number) =>
  fc
    .string({ minLength: 1, maxLength })
    .filter((s) => s.trim().length > 0);

const repairServiceArb: fc.Arbitrary<RepairService> = fc.record({
  id: fc.uuid(),
  name: nonBlankString(80),
  description: nonBlankString(200),
  estimated_turnaround: nonBlankString(80),
});

function mockSupabaseWithServices(services: RepairService[]) {
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: services, error: null }),
    }),
  } as any);
}

async function renderAndWait(services: RepairService[]) {
  mockSupabaseWithServices(services);

  let container!: HTMLElement;
  let unmount!: () => void;

  await act(async () => {
    const result = render(<RepairServicesPage />);
    container = result.container;
    unmount = result.unmount;
  });

  return { container, unmount };
}

describe('RepairServicesPage — Property 4: Repair service page renders description and turnaround for every service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders name, description, and estimated_turnaround for every service', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(repairServiceArb, { minLength: 1, maxLength: 10 }), async (services) => {
        const { container, unmount } = await renderAndWait(services);

        const textContent = container.textContent ?? '';
        const allRendered = services.every((service) => {
          // Check that each field's text appears somewhere in the rendered output.
          // Using textContent substring search handles whitespace normalization edge cases.
          const hasName = textContent.includes(service.name.trim());
          const hasDescription = textContent.includes(service.description.trim());
          const hasTurnaround = textContent.includes(service.estimated_turnaround.trim());
          return hasName && hasDescription && hasTurnaround;
        });

        unmount();
        return allRendered;
      }),
      { numRuns: 25 },
    );
  }, 60_000);
});
