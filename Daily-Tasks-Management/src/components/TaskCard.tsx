import { Task } from '../types/Tasks';
import "../styles/task-card.css";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onToggleComplete: (taskId: number) => void;
  isDarkMode: boolean;
}

export function TaskCard({ task, onEdit, onDelete, onToggleComplete, isDarkMode }: TaskCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getPriorityLabel = (priority: number) => {
    const labels = ['Lowest', 'Low', 'Medium', 'High', 'Highest'];
    return labels[priority - 1] || 'Medium';
  };

  return (
    <div className={`task-card ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="task-header">
        <div className="task-info">
          <h3 className={`task-title ${task.completed ? 'completed' : ''} ${isDarkMode ? 'dark' : 'light'}`}>
            {task.title}
          </h3>
          <div className={`task-meta ${isDarkMode ? 'dark' : 'light'}`}>
            <span className={`priority-badge priority-${task.priority} ${isDarkMode ? 'dark' : 'light'}`}>
              Priority: {getPriorityLabel(task.priority)}
            </span>
            <span>Deadline: {formatDate(new Date(task.deadline))}</span>
            <span>Estimated Time: {formatTime(task.estimatedTime)}</span>
          </div>
        </div>
        <div className="task-actions">
          <button
            onClick={() => onToggleComplete(task.id)}
            className={`task-btn ${
              task.completed 
                ? 'complete' 
                : `mark-complete ${isDarkMode ? 'dark' : 'light'}`
            }`}
          >
            {task.completed ? 'Completed' : 'Mark Complete'}
          </button>
          <button
            onClick={() => onEdit(task)}
            className="task-btn edit"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="task-btn delete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}