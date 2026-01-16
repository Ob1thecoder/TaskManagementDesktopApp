import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Project } from '../types/Projects';
import { Service } from '../types/Services';
import { GitStatus } from '../types/Git';
import { Task } from '../types/Tasks';
import '../styles/dashboard.css';

interface DashboardProps {
  isDarkMode: boolean;
}

export function Dashboard({ isDarkMode }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [gitStatuses, setGitStatuses] = useState<GitStatus[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [projectsData, servicesData, gitData, tasksData] = await Promise.all([
        invoke<Project[]>('get_all_projects').catch(() => []),
        invoke<Service[]>('get_all_services').catch(() => []),
        invoke<GitStatus[]>('get_all_git_statuses').catch(() => []),
        invoke<Task[]>('get_all_tasks').catch(() => []),
      ]);

      setProjects(projectsData);
      setServices(servicesData);
      setGitStatuses(gitData);
      setTasks(tasksData);
    } catch (err) {
      setError(err as string);
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const runningServices = services.length; // TODO: Check actual running status
  const projectsWithChanges = gitStatuses.filter(g => g.uncommittedChanges.length > 0).length;
  const incompleteTasks = tasks.filter(t => !t.completed).length;
  // TODO: Add a loading state
  if (loading) {
    return (
      <div className={`dashboard ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="loading-container">
          <div className={`loading-text ${isDarkMode ? 'dark' : 'light'}`}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dashboard ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="error-message">
          <div className="error-content">
            <div className="error-text">
              <div className="error-title">Failed to load dashboard</div>
              <div className="error-description">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="dashboard-header">
        <h2 className={`dashboard-title ${isDarkMode ? 'dark' : 'light'}`}>Dashboard</h2>
        <button
          onClick={loadDashboardData}
          className={`btn-refresh ${isDarkMode ? 'dark' : 'light'}`}
          title="Refresh dashboard"
        >
          Refresh
        </button>
      </div>

      <div className="dashboard-grid">
        <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
          
          <div className="stat-content">
            <div className="stat-value">{projects.length}</div>
            <div className={`stat-label ${isDarkMode ? 'dark' : 'light'}`}>Projects</div>
          </div>
        </div>

        <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
          
          <div className="stat-content">
            <div className="stat-value">{runningServices}</div>
            <div className={`stat-label ${isDarkMode ? 'dark' : 'light'}`}>Services</div>
          </div>
        </div>

        <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
          
          <div className="stat-content">
            <div className="stat-value">{projectsWithChanges}</div>
            <div className={`stat-label ${isDarkMode ? 'dark' : 'light'}`}>Repos with Changes</div>
          </div>
        </div>

        <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
          
          <div className="stat-content">
            <div className="stat-value">{incompleteTasks}</div>
            <div className={`stat-label ${isDarkMode ? 'dark' : 'light'}`}>Active Tasks</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className={`dashboard-section ${isDarkMode ? 'dark' : 'light'}`}>
          <h3 className={`section-title ${isDarkMode ? 'dark' : 'light'}`}>Recent Projects</h3>
          {projects.length === 0 ? (
            <p className={`empty-state ${isDarkMode ? 'dark' : 'light'}`}>No projects yet</p>
          ) : (
            <div className="project-list">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className={`project-item ${isDarkMode ? 'dark' : 'light'}`}>
                  <div className="project-name">{project.name}</div>
                  <div className={`project-type ${isDarkMode ? 'dark' : 'light'}`}>
                    {project.projectType || 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`dashboard-section ${isDarkMode ? 'dark' : 'light'}`}>
          <h3 className={`section-title ${isDarkMode ? 'dark' : 'light'}`}>Git Status</h3>
          {gitStatuses.length === 0 ? (
            <p className={`empty-state ${isDarkMode ? 'dark' : 'light'}`}>No git repositories</p>
          ) : (
            <div className="git-list">
              {gitStatuses.slice(0, 5).map((status) => (
                <div key={status.id} className={`git-item ${isDarkMode ? 'dark' : 'light'}`}>
                  <div className="git-branch">{status.currentBranch + " / " + projects.find(p => p.id === status.projectId)?.name || 'No branch'}</div>
                  <div className={`git-changes ${isDarkMode ? 'dark' : 'light'}`}>
                    {status.uncommittedChanges.length} changes
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
