import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import "./styles/components.css";
import { Task, TaskFormData } from './types/Tasks';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { StatCard } from './components/StatCard';
import { EditTaskForm } from './components/EditTaskForm';
import { Navigation, ViewType } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ProjectsPanel } from './components/ProjectsPanel';
import { ServicesPanel } from './components/ServicesPanel';
import { GitStatusPanel } from './components/GitStatusPanel';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const saved = localStorage.getItem('taskOrganizer_currentView');
    return saved ? JSON.parse(saved) : 'dashboard';
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('taskOrganizer_isDarkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem('taskOrganizer_isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Persist current view preference
  useEffect(() => {
    localStorage.setItem('taskOrganizer_currentView', JSON.stringify(currentView));
  }, [currentView]);

  // Load tasks when tasks view is selected
  useEffect(() => {
    if (currentView === 'tasks') {
      loadTasks();
    }
  }, [currentView]);

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
      console.log('Creating task with data:', formData);
      const newTask = await invoke<Task>("create_task", { formData });
      console.log('Task created successfully:', newTask);
      setTasks(prev => [newTask, ...prev]);
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error("Failed to create task - Full error:", err);
      setError(`Failed to create task: ${err}`);
      // Don't close the form on error so user can try again
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

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(false); // Close add form if open
  };

  const handleUpdateTask = async (taskData: TaskFormData) => {
    if (!editingTask) return;
    
    try {
      // Convert TaskFormData to Task format
      const updatedTask: Task = {
        ...editingTask,
        title: taskData.title,
        priority: parseInt(taskData.priority) as any,
        deadline: taskData.deadline,
        estimatedTime: (parseInt(taskData.estimatedHours) * 60) + parseInt(taskData.estimatedMinutes),
        startDate: taskData.startDate || undefined,
      };
      
      await invoke("update_task", { task: updatedTask });
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      setEditingTask(null);
      setError(null);
    } catch (err) {
      setError(err as string);
      console.error("Failed to update task:", err);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard isDarkMode={isDarkMode} />;
      case 'projects':
        return <ProjectsPanel isDarkMode={isDarkMode} />;
      case 'services':
        return <ServicesPanel isDarkMode={isDarkMode} />;
      case 'git':
        return <GitStatusPanel isDarkMode={isDarkMode} />;
      case 'tasks':
        return renderTasksView();
      default:
        return <Dashboard isDarkMode={isDarkMode} />;
    }
  };

  const renderTasksView = () => (
    <div className="tasks-view">
      <div className="tasks-header">
        <h2 className={`tasks-title ${isDarkMode ? 'dark' : 'light'}`}>Tasks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`btn-primary ${isDarkMode ? 'dark' : 'light'}`}
        >
          {showForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {showForm && (
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowForm(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {editingTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EditTaskForm
              task={editingTask}
              onSubmit={handleUpdateTask}
              onCancel={() => setEditingTask(null)}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      )}

      <div className="tasks-content">
        <div className="tasks-sidebar">
          <StatCard tasks={tasks} isDarkMode={isDarkMode} />
        </div>
        <div className="tasks-main">
          {loading ? (
            <div className="loading-container">
              <div className={`loading-text ${isDarkMode ? 'dark' : 'light'}`}>Loading tasks...</div>
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onToggleComplete={handleToggleComplete}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <header className={`app-header ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="header-content">
          <div className="header-row">
            <div>
              <h1 className={`app-title ${isDarkMode ? 'dark' : 'light'}`}>Local Development Dashboard</h1>
            </div>

            <div className="header-actions">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content-with-nav">
        <Navigation currentView={currentView} onViewChange={setCurrentView} isDarkMode={isDarkMode} />
        <div className="content-area">
          {renderCurrentView()}
        </div>
      </main>
    </div>
  );
}

export default App;
