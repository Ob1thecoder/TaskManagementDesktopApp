import { Task } from '../types/Tasks';

interface StatCardProps {
  tasks: Task[];
  isDarkMode: boolean;
}

export function StatCard({ tasks, isDarkMode }: StatCardProps) {
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const total = tasks.length;
  
  // Calculate percentages
  const completedPercentage = total > 0 ? (completedTasks / total) * 100 : 0;
  const pendingPercentage = total > 0 ? (pendingTasks / total) * 100 : 0;
  
  // Calculate pie chart angles
  const completedAngle = (completedPercentage / 100) * 360;
  
  // Helper function to create SVG arc path
  const createArc = (startAngle: number, endAngle: number) => {
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return [
      `M ${centerX} ${centerY}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      'Z'
    ].join(' ');
  };
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const cardStyle = isDarkMode
    ? 'bg-gray-800 text-white border-gray-700'
    : 'bg-white text-gray-800 border-gray-300';

  return (
    <div className={`p-6 rounded-lg shadow-md border ${cardStyle} w-full max-w-sm`}>
      <h2 className={`text-xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Task Statistics
      </h2>
      
      {/* Pie Chart */}
      <div className="flex justify-center mb-6">
        {total === 0 ? (
          <div className="text-center">
            <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
              <circle 
                cx="100" 
                cy="100" 
                r="80" 
                fill="none" 
                stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No tasks yet
            </p>
          </div>
        ) : (
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Pending tasks slice */}
              {pendingTasks > 0 && (
                <path
                  d={createArc(0, 360 - completedAngle)}
                  fill="#3b82f6"
                  stroke={isDarkMode ? '#1f2937' : 'white'}
                  strokeWidth="2"
                />
              )}
              
              {/* Completed tasks slice */}
              {completedTasks > 0 && (
                <path
                  d={createArc(360 - completedAngle, 360)}
                  fill="#10b981"
                  stroke={isDarkMode ? '#1f2937' : 'white'}
                  strokeWidth="2"
                />
              )}
              
              {/* Center circle for donut effect */}
              <circle 
                cx="100" 
                cy="100" 
                r="45" 
                fill={isDarkMode ? '#1f2937' : 'white'}
              />
              
              {/* Total count in center */}
              <text 
                x="100" 
                y="95" 
                textAnchor="middle" 
                className={`text-3xl font-bold ${isDarkMode ? 'fill-white' : 'fill-gray-900'}`}
              >
                {total}
              </text>
              <text 
                x="100" 
                y="115" 
                textAnchor="middle" 
                className={`text-sm ${isDarkMode ? 'fill-gray-400' : 'fill-gray-600'}`}
              >
                Total
              </text>
            </svg>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Pending
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {pendingTasks}
            </span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              ({pendingPercentage.toFixed(0)}%)
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {completedTasks}
            </span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              ({completedPercentage.toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}