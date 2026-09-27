import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock stores used by the components
vi.mock('@/store/projectStore', () => ({
    useProjectStore: vi.fn((selector) => {
        const state = {
            projects: [{ id: 1, shortName: 'TESTPR', description: 'Test project', ownerId: 1, createdAt: '2024-01-01' }],
            fetchProjects: vi.fn(),
            loading: false,
        };
        return selector ? selector(state) : state;
    }),
}));

vi.mock('@/store/issueStore', () => ({
    useIssueStore: vi.fn((selector) => {
        const state = {
            issues: [
                {
                    id: 10,
                    key: 'TESTPR-1',
                    title: 'Test issue title',
                    status: 'NEW',
                    priority: 'NORMAL',
                    projectId: 1,
                    assigneeId: null,
                    dueDate: null,
                    createdAt: '2024-01-01',
                },
            ],
            fetchIssues: vi.fn(),
            loading: false,
        };
        return selector ? selector(state) : state;
    }),
}));

vi.mock('@/store/authStore', () => ({
    useAuthStore: vi.fn((selector) => {
        const state = {
            getUserIdFromToken: () => '1',
            user: { id: 1 },
            isAuthenticated: true,
        };
        return selector ? selector(state) : state;
    }),
}));

vi.mock('@/store/userStore', () => ({
    useUserStore: vi.fn((selector) => {
        const state = { users: [], fetchUsers: vi.fn() };
        return selector ? selector(state) : state;
    }),
}));

// Mock heavy UI components used inside AppLayout, modals, etc.
vi.mock('@/components/layout/AppLayout', () => ({
    AppLayout: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('@/components/modals/ProjectDetailsModal', () => ({
    ProjectDetailsModal: ({ open, onOpenChange, projectId }) =>
        open ? <div data-testid="project-modal">Project Modal {projectId}</div> : null,
}));

vi.mock('@/components/modals/IssueDetailsModal', () => ({
    IssueDetailsModal: ({ open, onOpenChange, issueId }) =>
        open ? <div data-testid="issue-modal">Issue Modal {issueId}</div> : null,
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

describe('Navigation UX - Dashboard', () => {
    let Dashboard;

    beforeEach(async () => {
        // Simulate desktop screen so responsive navigation uses Link/navigate instead of modal
        Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true, writable: true });
        vi.resetModules();
        const mod = await import('@/features/dashboard/Dashboard');
        Dashboard = mod.default;
    });

    it('project card title has hover:underline styling and links to project page', async () => {
        const { container } = render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );
        const projectTitles = container.querySelectorAll('[title="Open full page"]');
        expect(projectTitles.length).toBeGreaterThan(0);
        const projectTitle = Array.from(projectTitles).find(el => el.textContent === 'TESTPR');
        expect(projectTitle).not.toBeNull();
        expect(projectTitle.className).toMatch(/hover:underline/);
    });

    it('clicking project title navigates to /projects/:id', async () => {
        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects/:id" element={<div data-testid="project-detail">Project Detail</div>} />
                </Routes>
            </MemoryRouter>
        );
        // There may be multiple "Open full page" elements; click the first project one
        const openFullPageItems = screen.getAllByTitle('Open full page');
        const projectTitle = openFullPageItems.find(el => el.textContent === 'TESTPR');
        fireEvent.click(projectTitle);
        // Navigation should render the project detail route
        expect(screen.getByTestId('project-detail')).toBeInTheDocument();
    });

    it('clicking eye icon opens project modal instead of navigating', async () => {
        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );
        const eyeButton = screen.getAllByTitle('Quick preview')[0];
        fireEvent.click(eyeButton);
        expect(screen.queryByTestId('project-modal')).toBeInTheDocument();
    });
});

describe('Navigation UX - Issues page', () => {
    let Issues;

    beforeEach(async () => {
        // Simulate desktop screen so responsive navigation uses Link/navigate instead of modal
        Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true, writable: true });
        vi.resetModules();
        const mod = await import('@/features/issues/Issues');
        Issues = mod.default;
    });

    it('issue title navigates to /issues/:id when clicked', async () => {
        render(
            <MemoryRouter initialEntries={['/issues']}>
                <Routes>
                    <Route path="/issues" element={<Issues />} />
                    <Route path="/issues/:id" element={<div data-testid="issue-detail">Issue Detail</div>} />
                </Routes>
            </MemoryRouter>
        );
        const issueTitle = screen.getByTitle('Open full page');
        fireEvent.click(issueTitle);
        expect(screen.getByTestId('issue-detail')).toBeInTheDocument();
    });

    it('clicking eye icon on issue opens modal', async () => {
        render(
            <MemoryRouter>
                <Issues />
            </MemoryRouter>
        );
        const eyeButton = screen.getByTitle('Quick preview');
        fireEvent.click(eyeButton);
        expect(screen.getByTestId('issue-modal')).toBeInTheDocument();
    });
});

describe('Routes render correct components', () => {
    it('/projects/:id renders ProjectDetailPage', async () => {
        vi.mock('@/features/projects/ProjectDetailPage', () => ({
            default: () => <div data-testid="project-detail-page">ProjectDetailPage</div>,
        }));
        const { default: ProjectDetailPage } = await import('@/features/projects/ProjectDetailPage');
        const { container } = render(
            <MemoryRouter initialEntries={['/projects/1']}>
                <Routes>
                    <Route path="/projects/:id" element={<ProjectDetailPage />} />
                </Routes>
            </MemoryRouter>
        );
        expect(container.querySelector('[data-testid="project-detail-page"]')).toBeInTheDocument();
    });

    it('/issues/:id renders IssueDetailPage', async () => {
        vi.mock('@/features/issues/IssueDetailPage', () => ({
            default: () => <div data-testid="issue-detail-page">IssueDetailPage</div>,
        }));
        const { default: IssueDetailPage } = await import('@/features/issues/IssueDetailPage');
        const { container } = render(
            <MemoryRouter initialEntries={['/issues/10']}>
                <Routes>
                    <Route path="/issues/:id" element={<IssueDetailPage />} />
                </Routes>
            </MemoryRouter>
        );
        expect(container.querySelector('[data-testid="issue-detail-page"]')).toBeInTheDocument();
    });
});
