import React, { useState, useMemo } from 'react';
import { Task } from '../types/Tasks';
import '../styles/calendar-view.css';

interface CalendarViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onToggleComplete: (id: number) => void;
  onOptimize: () => void;
  isDarkMode: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export function CalendarView({ tasks, onEdit, onDelete, onToggleComplete, onOptimize, isDarkMode }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');

  // Helper functions
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return formatDate(date1) === formatDate(date2);
  };

  const getTaskStartDate = (task: Task): Date => {
    if (task.scheduledStart) {
      return new Date(task.scheduledStart);
    }
    if (task.startDate) {
      return new Date(task.startDate);
    }
    // Fallback: assume task starts on deadline day
    return new Date(task.deadline);
  };

  const getTaskEndDate = (task: Task): Date => {
    const startDate = getTaskStartDate(task);
    const endDate = new Date(startDate);
    // Add estimated time to get end date (convert minutes to days)
    const durationInDays = Math.max(1, Math.ceil(task.estimatedTime / (24 * 60)));
    endDate.setDate(endDate.getDate() + durationInDays - 1);
    return endDate;
  };

  const isTaskOnDate = (task: Task, date: Date): boolean => {
    const startDate = getTaskStartDate(task);
    const endDate = getTaskEndDate(task);
    const checkDate = new Date(date);
    
    return checkDate >= new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) &&
           checkDate <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  };

  const getTaskDurationOnDate = (task: Task, date: Date): { startPercent: number; widthPercent: number; isStart: boolean; isEnd: boolean } => {
    const taskStart = getTaskStartDate(task);
    const taskEnd = getTaskEndDate(task);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const isStart = isSameDay(taskStart, date);
    const isEnd = isSameDay(taskEnd, date);
    
    if (isSameDay(taskStart, taskEnd)) {
      // Single day task - show proportional width based on estimated time
      const maxDayMinutes = 12 * 60; // Assume 12 hour work day
      const widthPercent = Math.min(100, Math.max(20, (task.estimatedTime / maxDayMinutes) * 100));
      return { startPercent: 0, widthPercent, isStart: true, isEnd: true };
    }
    
    if (isStart && isEnd) {
      return { startPercent: 0, widthPercent: 100, isStart: true, isEnd: true };
    } else if (isStart) {
      return { startPercent: 0, widthPercent: 100, isStart: true, isEnd: false };
    } else if (isEnd) {
      return { startPercent: 0, widthPercent: 100, isStart: false, isEnd: true };
    } else {
      return { startPercent: 0, widthPercent: 100, isStart: false, isEnd: false };
    }
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => isTaskOnDate(task, date));
  };

  // Generate calendar days for month view
  const generateMonthDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: CalendarDay[] = [];

    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        tasks: getTasksForDate(date),
      });
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        tasks: getTasksForDate(date),
      });
    }

    // Add days from next month to complete the grid
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      const date = new Date(year, month + 1, nextMonthDay);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        tasks: getTasksForDate(date),
      });
      nextMonthDay++;
    }

    return days;
  };

  // Generate calendar days for week view
  const generateWeekDays = (): CalendarDay[] => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);

    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        tasks: getTasksForDate(date),
      });
    }

    return days;
  };

  const generateDayView = (): CalendarDay[] => {
    return [{
      date: new Date(currentDate),
      isCurrentMonth: true,
      isToday: isSameDay(currentDate, new Date()),
      tasks: getTasksForDate(currentDate),
    }];
  };

  const calendarDays = viewType === 'month' ? generateMonthDays() : 
                       viewType === 'week' ? generateWeekDays() : generateDayView();

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (viewType === 'month') {
      navigateMonth(direction);
    } else if (viewType === 'week') {
      navigateWeek(direction);
    } else {
      navigateDay(direction);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Task priority color mapping
  const getPriorityColor = (priority: number): string => {
    const colors = {
      1: '#ef4444', 
      2: '#f97316', 
      3: '#eab308', 
      4: '#22c55e', 
      5: '#06b6d4', 
    };
    return colors[priority as keyof typeof colors] || '#6b7280';
  };

  // Selected date tasks
  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className={`calendar-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <button
            onClick={() => navigate('prev')}
            className={`nav-button ${isDarkMode ? 'dark' : 'light'}`}
          >
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className={`calendar-title ${isDarkMode ? 'dark' : 'light'}`}>
            {viewType === 'month' 
              ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : viewType === 'week'
                ? `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            }
          </h2>
          
          <button
            onClick={() => navigate('next')}
            className={`nav-button ${isDarkMode ? 'dark' : 'light'}`}
          >
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="calendar-controls">
          <button
            onClick={onOptimize}
            className={`control-button optimize ${isDarkMode ? 'dark' : 'light'}`}
            title="Optimize task scheduling by assigning start dates"
          >
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Optimize
          </button>
          
          <button
            onClick={goToToday}
            className={`control-button ${isDarkMode ? 'dark' : 'light'}`}
          >
            Today
          </button>
          
          <div className="view-toggle">
            <button
              onClick={() => setViewType('month')}
              className={`toggle-button ${viewType === 'month' ? 'active' : ''} ${isDarkMode ? 'dark' : 'light'}`}
            >
              Month
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`toggle-button ${viewType === 'week' ? 'active' : ''} ${isDarkMode ? 'dark' : 'light'}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewType('day')}
              className={`toggle-button ${viewType === 'day' ? 'active' : ''} ${isDarkMode ? 'dark' : 'light'}`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-content">
        <div className={`calendar-grid ${viewType}`}>
          {/* Day Headers */}
          <div className="calendar-headers">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className={`day-header ${isDarkMode ? 'dark' : 'light'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="calendar-days">
            {calendarDays.map((calendarDay, index) => (
              <div
                key={index}
                className={`calendar-day ${isDarkMode ? 'dark' : 'light'} ${
                  calendarDay.isCurrentMonth ? 'current-month' : 'other-month'
                } ${calendarDay.isToday ? 'today' : ''} ${
                  selectedDate && isSameDay(calendarDay.date, selectedDate) ? 'selected' : ''
                }`}
                onClick={() => setSelectedDate(calendarDay.date)}
              >
                <div className="day-number">
                  {calendarDay.date.getDate()}
                </div>
                
                {/* Task timeline bars */}
                <div className="task-timeline">
                  {calendarDay.tasks.slice(0, 4).map((task, taskIndex) => {
                    const duration = getTaskDurationOnDate(task, calendarDay.date);
                    return (
                      <div
                        key={task.id}
                        className={`task-bar ${task.completed ? 'completed' : 'pending'} ${
                          duration.isStart ? 'task-start' : ''} ${duration.isEnd ? 'task-end' : ''
                        }`}
                        style={{
                          backgroundColor: getPriorityColor(task.priority),
                          width: `${duration.widthPercent}%`,
                          left: `${duration.startPercent}%`,
                          top: `${20 + taskIndex * 16}px`,
                          opacity: task.completed ? 0.6 : 0.9
                        }}
                        title={`${task.title} (${task.estimatedTime}min)${duration.isStart ? ' - Start' : ''}${duration.isEnd ? ' - End' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(task);
                        }}
                      >
                        {viewType === 'day' && (
                          <span className="task-bar-label">
                            {task.title.substring(0, 20)}{task.title.length > 20 ? '...' : ''}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {calendarDay.tasks.length > 4 && (
                    <div 
                      className={`more-tasks ${isDarkMode ? 'dark' : 'light'}`}
                      style={{ top: `${20 + 4 * 16}px` }}
                    >
                      +{calendarDay.tasks.length - 4}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Details Panel */}
        {selectedDate && (
          <div className={`task-panel ${isDarkMode ? 'dark' : 'light'}`}>
            <div className="panel-header">
              <h3 className={`panel-title ${isDarkMode ? 'dark' : 'light'}`}>
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className={`close-button ${isDarkMode ? 'dark' : 'light'}`}
              >
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="panel-content">
              {selectedTasks.length === 0 ? (
                <div className={`empty-state ${isDarkMode ? 'dark' : 'light'}`}>
                  <p>No tasks scheduled for this day</p>
                </div>
              ) : (
                <div className="task-list">
                  {selectedTasks.map(task => (
                    <div
                      key={task.id}
                      className={`task-item ${isDarkMode ? 'dark' : 'light'} ${task.completed ? 'completed' : ''}`}
                    >
                      <div className="task-content">
                        <div className="task-header">
                          <h4 className={`task-title ${isDarkMode ? 'dark' : 'light'}`}>
                            {task.title}
                          </h4>
                          <span
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          >
                            P{task.priority}
                          </span>
                        </div>
                        
                        <div className="task-meta">
                          <span className={`task-time ${isDarkMode ? 'dark' : 'light'}`}>
                            {task.estimatedTime} mins
                          </span>
                          {task.category && (
                            <span className={`task-category ${isDarkMode ? 'dark' : 'light'}`}>
                              {task.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="task-actions">
                        <button
                          onClick={() => onToggleComplete(task.id)}
                          className={`action-button complete ${isDarkMode ? 'dark' : 'light'}`}
                          title={task.completed ? 'Mark as pending' : 'Mark as complete'}
                        >
                          {task.completed ? (
                            <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        
                        <button
                          onClick={() => onEdit(task)}
                          className={`action-button edit ${isDarkMode ? 'dark' : 'light'}`}
                          title="Edit task"
                        >
                          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => onDelete(task.id)}
                          className={`action-button delete ${isDarkMode ? 'dark' : 'light'}`}
                          title="Delete task"
                        >
                          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
