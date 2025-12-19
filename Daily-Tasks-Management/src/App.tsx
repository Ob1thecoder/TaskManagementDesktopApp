import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Task, TaskFormData } from './types/Tasks';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const tasksData = await invoke<Task[]>("get_all_tasks");
      setTasks(tasksData);
    } catch (err) {
      setError(err as string);
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (formData: TaskFormData) => {
    try {
      const newTask = await invoke<Task>("create_task", { formData });
      setTasks(prev => [newTask, ...prev]);
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err as string);
      console.error("Failed to create task:", err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      await invoke("delete_task", { id: taskId });
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setError(null);
    } catch (err) {
      setError(err as string);
      console.error("Failed to delete task:", err);
    }
  };

  const handleToggleComplete = async (taskId: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      await invoke("toggle_task_completion", { 
        id: taskId, 
        completed: !task.completed 
      });
      
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ));
      setError(null);
    } catch (err) {
      setError(err as string);
      console.error("Failed to toggle task completion:", err);
    }
  };

  const handleEditTask = async (task: Task) => {
    try {
      await invoke("update_task", { task });
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      setError(null);
    } catch (err) {
      setError(err as string);
      console.error("Failed to update task:", err);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-row">
            <div>
              <h1 className="title">Task Organizer</h1>
              <p className="subtitle">
                Organize your work and personal tasks efficiently
              </p>
            </div>
            <div className="header-actions">
              <div className="stats">
                Total: {tasks.length} | Pending: {tasks.filter(t => !t.completed).length}
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className={showForm ? 'button-secondary' : 'button-primary'}
              >
                {showForm ? 'Cancel' : '+ Add Task'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Error Message */}
        {error && (
          <div className="error-message">
            <div className="error-content">
              <div className="error-icon">
                <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="error-text">
                <h3 className="error-title">Error</h3>
                <p className="error-description">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Task Form */}
        {showForm && (
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-text">Loading tasks...</div>
          </div>
        ) : (
          /* Task List */
          <TaskList
            tasks={tasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onToggleComplete={handleToggleComplete}
          />
        )}
      </main>
    </div>
  );
}

export default App;
