import { useState } from 'react';
import { TaskFormData } from '../types/Tasks';
import '../styles/components.css';

interface TaskFormProps {
  onSubmit: (taskData: TaskFormData) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

export function TaskForm({ onSubmit, onCancel, isDarkMode }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    priority: '3',
    deadline: '',
    estimatedHours: '0',
    estimatedMinutes: '30',
    startDate: '',
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
      <h2 className={`form-title ${isDarkMode ? 'dark' : 'light'}`}>Add New Task</h2>
      
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
            Add Task
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