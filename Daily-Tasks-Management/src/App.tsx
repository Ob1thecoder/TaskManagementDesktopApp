import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import "./styles/components.css";
import { Task, TaskFormData } from './types/Tasks';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { StatCard } from './components/StatCard';
import { EditTaskForm } from './components/EditTaskForm';
import { CalendarView } from './components/CalenderView';
import { setTheme } from "@tauri-apps/api/app";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const saved = localStorage.getItem('taskOrganizer_isDarkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem('taskOrganizer_isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);
  

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

  const handleOptimizeTasks = async () => {
    try {
      setLoading(true);
      const optimizedTasks = await invoke<Task[]>("optimize_tasks");
      setTasks(optimizedTasks);
      setError(null);
    } catch (err) {
      setError(err as string);
      console.error("Failed to optimize tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <header className={`app-header ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="header-content">
          <div className="header-row">
            <div>
              <h1 className={`app-title ${isDarkMode ? 'dark' : 'light'}`}>Task Organizer</h1>
            </div>

            <div className="header-actions">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                className={`btn-secondary ${isDarkMode ? 'dark' : 'light'}`}
                title={`Switch to ${viewMode === 'list' ? 'calendar' : 'list'} view`}
              >
                {viewMode === 'list' ? 'Calendar' : 'List'}
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className={showForm ? `btn-secondary ${isDarkMode ? 'dark' : 'light'}` : 'btn-primary'}
              >
                {showForm ? 'Cancel' : '+ Add Task'}
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        

        {/* Task Form */}
        {showForm && (
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowForm(false)}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Edit Task Form */}
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
        

        {/* Main Content Grid */}
        <div className="content-grid">
          <div className="grid-col-1">
            <div className="sticky-top">
              <StatCard tasks={tasks} isDarkMode={isDarkMode} />
            </div>
          </div>
        </div>
        
        <div className="task-content">
          {/* Loading State */}
          {loading ? (
            <div className="loading-container">
              <div className={`loading-text ${isDarkMode ? 'dark' : 'light'}`}>Loading tasks...</div>
            </div>
          ) : (
            /* Task List */
            viewMode === 'list' ? (
            <TaskList
              tasks={tasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onToggleComplete={handleToggleComplete}
              isDarkMode={isDarkMode}
            />) : (
              // <div className={`placeholder ${isDarkMode ? 'dark' : 'light'}`}>
              //   Calendar View in progress...
              // </div>
              <CalendarView
                tasks={tasks}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
                onOptimize={handleOptimizeTasks}
                isDarkMode={isDarkMode}
              />
            )
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
