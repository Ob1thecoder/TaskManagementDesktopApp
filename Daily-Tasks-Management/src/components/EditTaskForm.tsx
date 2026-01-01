import { useState } from 'react';
import { Task, TaskFormData } from '../types/Tasks';
import '../styles/components.css';

interface EditTaskFormProps {
  task: Task;
  onSubmit: (taskData: TaskFormData) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

export function EditTaskForm({ task, onSubmit, onCancel, isDarkMode }: EditTaskFormProps) {
  // Convert Task to TaskFormData format for editing
  const [formData, setFormData] = useState<TaskFormData>({
    title: task.title,
    priority: task.priority.toString(),
    deadline: task.deadline,
    estimatedHours: Math.floor(task.estimatedTime / 60).toString(),
    estimatedMinutes: (task.estimatedTime % 60).toString(),
    startDate: task.startDate || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline) {
      alert('Please fill in title and deadline');
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={`form-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="form-header">
        <h2 className={`form-title ${isDarkMode ? 'dark' : 'light'}`}>Edit Task</h2>
        <button
          onClick={onCancel}
          className={`close-btn ${isDarkMode ? 'dark' : 'light'}`}
        >
          <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="form">
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title" className={`form-label ${isDarkMode ? 'dark' : 'light'}`}>
            Task Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`form-input ${isDarkMode ? 'dark' : 'light'}`}
            placeholder="Enter task title..."
            required
          />
        </div>

        {/* Priority */}
        <div className="form-group">
          <label htmlFor="priority" className={`form-label ${isDarkMode ? 'dark' : 'light'}`}>
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={`form-select ${isDarkMode ? 'dark' : 'light'}`}
          >
            <option value="1">1 - Lowest</option>
            <option value="2">2 - Low</option>
            <option value="3">3 - Medium</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Highest</option>
          </select>
        </div>

        {/* Deadline */}
        <div className="form-group">
          <label htmlFor="deadline" className={`form-label ${isDarkMode ? 'dark' : 'light'}`}>
            Deadline *
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className={`form-input ${isDarkMode ? 'dark' : 'light'}`}
            required
          />
        </div>

        {/* Estimated Time */}
        <div className="form-group">
          <label className={`form-label ${isDarkMode ? 'dark' : 'light'}`}>
            Estimated Time
          </label>
          <div className="time-grid">
            <div>
              <label htmlFor="estimatedHours" className={`time-label ${isDarkMode ? 'dark' : 'light'}`}>Hours</label>
              <input
                type="number"
                id="estimatedHours"
                name="estimatedHours"
                value={formData.estimatedHours}
                onChange={handleChange}
                min="0"
                max="24"
                className={`form-input ${isDarkMode ? 'dark' : 'light'}`}
              />
            </div>
            <div>
              <label htmlFor="estimatedMinutes" className={`time-label ${isDarkMode ? 'dark' : 'light'}`}>Minutes</label>
              <input
                type="number"
                id="estimatedMinutes"
                name="estimatedMinutes"
                value={formData.estimatedMinutes}
                onChange={handleChange}
                min="0"
                max="59"
                className={`form-input ${isDarkMode ? 'dark' : 'light'}`}
              />
            </div>
          </div>
        </div>

        {/* Start Date (Optional) */}
        <div className="form-group">
          <label htmlFor="startDate" className={`form-label ${isDarkMode ? 'dark' : 'light'}`}>
            Start Date (Optional)
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className={`form-input ${isDarkMode ? 'dark' : 'light'}`}
          />
        </div>

        {/* Buttons */}
        <div className="form-buttons">
          <button type="submit" className="btn-submit">
            Update Task
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={`btn-cancel ${isDarkMode ? 'dark' : 'light'}`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}