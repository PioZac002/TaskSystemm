import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useResponsiveNavigation() {
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const openProject = (project, setSelectedProject) => {
        if (isMobile) {
            setSelectedProject(project.id);
        } else {
            navigate(`/projects/${project.id}`);
        }
    };

    const openIssue = (issue, setSelectedIssue) => {
        if (isMobile) {
            setSelectedIssue(issue.id);
        } else {
            navigate(`/issues/${issue.id}`);
        }
    };

    return { isMobile, openProject, openIssue };
}
