import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { GitStatus } from '../types/Git';
import { Project } from '../types/Projects';
import '../styles/git-panel.css';

interface GitStatusPanelProps {
  isDarkMode: boolean;
}

export function GitStatusPanel({ isDarkMode }: GitStatusPanelProps) {
  const [gitStatuses, setGitStatuses] = useState<GitStatus[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGitStatuses();
  }, []);

  const loadGitStatuses = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statusesData, projectsData] = await Promise.all([
        invoke<GitStatus[]>('get_all_git_statuses').catch(() => []),
        invoke<Project[]>('get_all_projects').catch(() => []),
      ]);
      setGitStatuses(statusesData);
      setProjects(projectsData);
    } catch (err) {
      setError(err as string);
      console.error('Failed to load git statuses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async (projectId: number, message: string) => {
    if (!message.trim()) {
      setError('Commit message is required');
      return;
    }

    try {
      setError(null);
      await invoke('git_commit', { projectId, message });
      await loadGitStatuses();
    } catch (err) {
      setError(err as string);
      console.error('Failed to commit:', err);
    }
  };

  const handlePush = async (projectId: number) => {
    try {
      setError(null);
      await invoke('git_push', { projectId });
      await loadGitStatuses(); // Refresh status
    } catch (err) {
      setError(err as string);
      console.error('Failed to push:', err);
    }
  };

  const handlePull = async (projectId: number) => {
    try {
      setError(null);
      await invoke('git_pull', { projectId });
      await loadGitStatuses(); // Refresh status
    } catch (err) {
      setError(err as string);
      console.error('Failed to pull:', err);
    }
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || `Project ${projectId}`;
  };

  if (loading) {
    return (
      <div className={`git-panel ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="loading-container">
          <div className={`loading-text ${isDarkMode ? 'dark' : 'light'}`}>Loading git status...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`git-panel ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="panel-header">
        <h2 className={`panel-title ${isDarkMode ? 'dark' : 'light'}`}>Git Status</h2>
        <button
          onClick={loadGitStatuses}
          className={`btn-refresh ${isDarkMode ? 'dark' : 'light'}`}
          title="Refresh git status"
        >
          🔄 Refresh
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

      {gitStatuses.length === 0 ? (
        <div className={`empty-state ${isDarkMode ? 'dark' : 'light'}`}>
          <p>No git repositories found. Add projects with git repositories to see their status.</p>
        </div>
      ) : (
        <div className="git-list">
          {gitStatuses.map((status) => {
            const hasChanges = status.uncommittedChanges.length > 0;
            const hasCommits = status.aheadCount > 0;
            const needsPull = status.behindCount > 0;

            return (
              <div key={status.id} className={`git-card ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="git-card-header">
                  <div className="git-info">
                    <h3 className={`git-project-name ${isDarkMode ? 'dark' : 'light'}`}>
                      {getProjectName(status.projectId)}
                    </h3>
                    <div className={`git-branch ${isDarkMode ? 'dark' : 'light'}`}>
                      🌿 {status.currentBranch || 'No branch'}
                    </div>
                  </div>
                  <div className="git-indicators">
                    {hasChanges && (
                      <span className={`git-indicator changes ${isDarkMode ? 'dark' : 'light'}`}>
                        {status.uncommittedChanges.length} changes
                      </span>
                    )}
                    {hasCommits && (
                      <span className={`git-indicator ahead ${isDarkMode ? 'dark' : 'light'}`}>
                        +{status.aheadCount} ahead
                      </span>
                    )}
                    {needsPull && (
                      <span className={`git-indicator behind ${isDarkMode ? 'dark' : 'light'}`}>
                        -{status.behindCount} behind
                      </span>
                    )}
                  </div>
                </div>

                {hasChanges && (
                  <div className={`git-changes-list ${isDarkMode ? 'dark' : 'light'}`}>
                    <div className={`changes-title ${isDarkMode ? 'dark' : 'light'}`}>Uncommitted changes:</div>
                    <ul className="changes-items">
                      {status.uncommittedChanges.slice(0, 5).map((change, idx) => (
                        <li key={idx} className={`change-item ${isDarkMode ? 'dark' : 'light'}`}>
                          {change}
                        </li>
                      ))}
                      {status.uncommittedChanges.length > 5 && (
                        <li className={`change-item ${isDarkMode ? 'dark' : 'light'}`}>
                          ... and {status.uncommittedChanges.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="git-actions">
                  {hasChanges && (
                    <button
                      onClick={() => {
                        const message = prompt('Enter commit message:');
                        if (message) handleCommit(status.projectId, message);
                      }}
                      className={`btn-commit ${isDarkMode ? 'dark' : 'light'}`}
                    >
                      Commit
                    </button>
                  )}
                  {hasCommits && (
                    <button
                      onClick={() => handlePush(status.projectId)}
                      className={`btn-push ${isDarkMode ? 'dark' : 'light'}`}
                    >
                      Push
                    </button>
                  )}
                  {needsPull && (
                    <button
                      onClick={() => handlePull(status.projectId)}
                      className={`btn-pull ${isDarkMode ? 'dark' : 'light'}`}
                    >
                      Pull
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
