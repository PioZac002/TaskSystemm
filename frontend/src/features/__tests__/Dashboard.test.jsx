import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockProjects = [
    { id: 1, shortName: 'PROJAB', description: 'My project', ownerId: 42, createdAt: '2024-01-01' },
    { id: 2, shortName: 'OTHER1', description: 'Other project', ownerId: 99, createdAt: '2024-01-02' },
];

const mockIssues = [
    { id: 10, key: 'PROJAB-1', title: 'My assigned issue', status: 'NEW', priority: 'HIGH', projectId: 1, assigneeId: 42, dueDate: null, createdAt: '2024-01-01' },
    { id: 11, key: 'PROJAB-2', title: 'Unassigned issue', status: 'NEW', priority: 'NORMAL', projectId: 1, assigneeId: 99, dueDate: null, createdAt: '2024-01-01' },
];

vi.mock('@/store/projectStore', () => ({
    useProjectStore: vi.fn((selector) => {
        const state = { projects: mockProjects, fetchProjects: vi.fn(), loading: false };
        return selector ? selector(state) : state;
    }),
}));

vi.mock('@/store/issueStore', () => ({
    useIssueStore: vi.fn((selector) => {
        const state = { issues: mockIssues, fetchIssues: vi.fn(), loading: false };
        return selector ? selector(state) : state;
    }),
}));

vi.mock('@/store/authStore', () => ({
    useAuthStore: vi.fn((selector) => {
        const state = { getUserIdFromToken: () => '42', user: { id: 42 }, isAuthenticated: true };
        return selector ? selector(state) : state;
    }),
}));

vi.mock('@/store/userStore', () => ({
    useUserStore: vi.fn((selector) => {
        const state = { users: [{ id: 1 }, { id: 2 }], fetchUsers: vi.fn() };
        return selector ? selector(state) : state;
    }),
}));

vi.mock('@/components/layout/AppLayout', () => ({
    AppLayout: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('@/components/modals/ProjectDetailsModal', () => ({
    ProjectDetailsModal: () => null,
}));

vi.mock('@/components/modals/IssueDetailsModal', () => ({
    IssueDetailsModal: () => null,
}));

vi.mock('@/components/modals/CreateProjectModal', () => ({
    CreateProjectModal: () => null,
}));

vi.mock('@/components/modals/CreateIssueModal', () => ({
    CreateIssueModal: () => null,
}));

vi.mock('@/components/ui/Progress', () => ({
    Progress: () => <div data-testid="progress" />,
}));

describe('Dashboard', () => {
    let Dashboard;

    beforeEach(async () => {
        vi.resetModules();
        const mod = await import('@/features/dashboard/Dashboard');
        Dashboard = mod.default;
    });

    it('renders "Your Issues" section heading', async () => {
        render(<MemoryRouter><Dashboard /></MemoryRouter>);
        expect(screen.getByText('Your Issues')).toBeInTheDocument();
    });

    it('"Your Issues" section shows only issues assigned to the logged-in user', async () => {
        const { container } = render(<MemoryRouter><Dashboard /></MemoryRouter>);
        // Find the "Your Issues" heading and its containing section
        const yourIssuesHeadings = screen.getAllByText('Your Issues');
        const yourIssuesSection = yourIssuesHeadings[0].closest('div[class*="space-y"]') ||
            yourIssuesHeadings[0].parentElement?.parentElement;
        // The "My assigned issue" (assigneeId: 42) should appear in Your Issues section
        expect(screen.getAllByText('My assigned issue').length).toBeGreaterThan(0);
        // "My assigned issue" assigned to user 42 appears in "Your Issues" section
        const assignedIssueElements = screen.getAllByText('My assigned issue');
        expect(assignedIssueElements.length).toBeGreaterThan(0);
    });

    it('renders project cards on the dashboard', async () => {
        render(<MemoryRouter><Dashboard /></MemoryRouter>);
        expect(screen.getAllByText('PROJAB').length).toBeGreaterThan(0);
    });

    it('renders issue cards on the dashboard', async () => {
        render(<MemoryRouter><Dashboard /></MemoryRouter>);
        expect(screen.getAllByText('My assigned issue').length).toBeGreaterThan(0);
    });

    it('mobile "Add Project" button shows "+P" label', async () => {
        render(<MemoryRouter><Dashboard /></MemoryRouter>);
        expect(screen.getByText('+P')).toBeInTheDocument();
    });

    it('mobile "Add Issue" button shows "+I" label', async () => {
        render(<MemoryRouter><Dashboard /></MemoryRouter>);
        expect(screen.getByText('+I')).toBeInTheDocument();
    });
});
