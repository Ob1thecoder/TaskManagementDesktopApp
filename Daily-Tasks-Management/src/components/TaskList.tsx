import { Task } from '../types/Tasks';
import { TaskCard } from './TaskCard';
import '../styles/task-list.css';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onToggleComplete: (taskId: number) => void;
  isDarkMode: boolean;
}

export function TaskList({ tasks, onEdit, onDelete, onToggleComplete, isDarkMode }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className={`empty-state ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`empty-icon ${isDarkMode ? 'dark' : 'light'}`}>
          <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className={`empty-title ${isDarkMode ? 'dark' : 'light'}`}>No tasks yet</h3>
        <p className="empty-description">Add your first task to get started!</p>
      </div>
    );
  }

  // Separate completed and pending tasks
  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="task-list-container">
      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="task-section">
          <h2 className={`section-title ${isDarkMode ? 'dark' : 'light'}`}>
            Pending Tasks ({pendingTasks.length})
          </h2>
          <div className="tasks-grid">
            {pendingTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleComplete={onToggleComplete}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="task-section">
          <h2 className={`section-title ${isDarkMode ? 'dark' : 'light'}`}>
            Completed Tasks ({completedTasks.length})
          </h2>
          <div className="tasks-grid">
            {completedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleComplete={onToggleComplete}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}