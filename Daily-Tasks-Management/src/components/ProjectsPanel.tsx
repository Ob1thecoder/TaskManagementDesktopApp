import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Project } from '../types/Projects';
import '../styles/projects-panel.css';

interface ProjectsPanelProps {
  isDarkMode: boolean;
}

export function ProjectsPanel({ isDarkMode }: ProjectsPanelProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProjectPath, setNewProjectPath] = useState('');
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await invoke<Project[]>('get_all_projects');
      setProjects(projectsData);
    } catch (err) {
      setError(err as string);
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!newProjectPath.trim()) {
      setError('Project path is required');
      return;
    }

    try {
      setError(null);
      const project = await invoke<Project>('add_project', {
        name: newProjectName.trim() || undefined,
        path: newProjectPath.trim(),
      });
      setProjects(prev => [project, ...prev]);
      setNewProjectPath('');
      setNewProjectName('');
      setShowAddForm(false);
    } catch (err) {
      setError(err as string);
      console.error('Failed to add project:', err);
    }
  };

  const handleRemoveProject = async (id: number) => {
    if (!confirm('Are you sure you want to remove this project?')) return;

    try {
      await invoke('remove_project', { id });
      setProjects(prev => prev.filter(p => p.id !== id));
      setError(null);
    } catch (err) {
      setError(err as string);
      console.error('Failed to remove project:', err);
    }
  };

  if (loading) {
    return (
      <div className={`projects-panel ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="loading-container">
          <div className={`loading-text ${isDarkMode ? 'dark' : 'light'}`}>Loading projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`projects-panel ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="panel-header">
        <h2 className={`panel-title ${isDarkMode ? 'dark' : 'light'}`}>Projects</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`btn-primary ${isDarkMode ? 'dark' : 'light'}`}
        >
          {showAddForm ? 'Cancel' : '+ Add Project'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <div className="error-text">
              <div className="error-title">Error</div>
              <div className="error-description">{error}</div>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className={`add-form ${isDarkMode ? 'dark' : 'light'}`}>
          <div className="form-group">
            <label className={`form-label ${isDarkMode ? 'dark' : 'light'}`}>Project Path</label>
            <input
              type="text"
              value={newProjectPath}
              onChange={(e) => setNewProjectPath(e.target.value)}
              placeholder="/path/to/project"
              className={`form-input ${isDarkMode ? 'dark' : 'light'}`}
            />
          </div>
          <div className="form-group">
            <label className={`form-label ${isDarkMode ? 'dark' : 'light'}`}>Project Name (optional)</label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Auto-detected from path"
              className={`form-input ${isDarkMode ? 'dark' : 'light'}`}
            />
          </div>
          <button
            onClick={handleAddProject}
            className={`btn-primary ${isDarkMode ? 'dark' : 'light'}`}
          >
            Add Project
          </button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className={`empty-state ${isDarkMode ? 'dark' : 'light'}`}>
          <p>No projects yet. Add your first project to get started.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className={`project-card ${isDarkMode ? 'dark' : 'light'}`}>
              <div className="project-card-header">
                <h3 className={`project-card-title ${isDarkMode ? 'dark' : 'light'}`}>
                  {project.name}
                </h3>
                <button
                  onClick={() => handleRemoveProject(project.id)}
                  className={`btn-icon ${isDarkMode ? 'dark' : 'light'}`}
                  title="Remove project"
                >
                  ×
                </button>
              </div>
              <div className={`project-card-type ${isDarkMode ? 'dark' : 'light'}`}>
                {project.projectType || 'Unknown'}
              </div>
              <div className={`project-card-path ${isDarkMode ? 'dark' : 'light'}`}>
                {project.path}
              </div>
              {project.description && (
                <div className={`project-card-description ${isDarkMode ? 'dark' : 'light'}`}>
                  {project.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
