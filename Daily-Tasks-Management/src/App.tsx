import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Task, TaskFormData } from './types/Tasks';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { StatCard } from './components/StatCard';
import { EditTaskForm } from './components/EditTaskForm';
import { setTheme } from "@tauri-apps/api/app";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b shadow-sm sticky top-0 z-40 transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Task Organizer</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Total: {tasks.length} | Pending: {tasks.filter(t => !t.completed).length}
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showForm 
                    ? `${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}` 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {showForm ? 'Cancel' : '+ Add Task'}
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className={`rounded-lg p-4 mb-6 border ${
            isDarkMode 
              ? 'bg-red-900/20 border-red-800 text-red-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex">
              <div className={isDarkMode ? 'text-red-400' : 'text-red-600'}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className={`font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>Error</h3>
                <p className={isDarkMode ? 'text-red-200' : 'text-red-700'}>{error}</p>
              </div>
            </div>
          </div>
        )}

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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full max-h-screen overflow-y-auto">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
          
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <StatCard tasks={tasks} isDarkMode={isDarkMode} />
            </div>
          </div>



          
        </div>
        <div className="mt-6">
            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading tasks...</div>
              </div>
            ) : (
              /* Task List */
              <TaskList
                tasks={tasks}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
      </main>
    </div>
  );
}

export default App;
