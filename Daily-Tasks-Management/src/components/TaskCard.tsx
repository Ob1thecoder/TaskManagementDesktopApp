import { Task } from '../types/Tasks';


interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onToggleComplete: (taskId: number) => void;
}

export function TaskCard({ task, onEdit, onDelete, onToggleComplete }: TaskCardProps) {
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

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5:
        return 'bg-red-100 text-red-700 border-red-300';
      case 4:
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 3:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 2:
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 1:
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityLabel = (priority: number) => {
    const labels = ['Lowest', 'Low', 'Medium', 'High', 'Highest'];
    return labels[priority - 1] || 'Medium';
  };

  return (<div className="bg-white shadow rounded-lg p-4 mb-4 border">
    <div className="flex justify-between items-start">
      <div>
        <h3 className={`text-lg font-semibold mb-2 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
          {task.title}
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className={`px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
            Priority: {getPriorityLabel(task.priority)}
          </span>
          <span>Deadline: {formatDate(new Date(task.deadline))}</span>
          <span>Estimated Time: {formatTime(task.estimatedTime)}</span>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`px-3 py-1 rounded ${task.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          {task.completed ? 'Completed' : 'Mark Complete'}
        </button>
        <button
          onClick={() => onEdit(task)}
          className="px-3 py-1 rounded bg-blue-500 text-white"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="px-3 py-1 rounded bg-red-500 text-white"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
    
  );
}