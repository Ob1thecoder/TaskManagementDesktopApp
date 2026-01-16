import { Task } from '../types/Tasks';
import '../styles/stat-card.css';

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

  return (
    
    <div className={`stat-card ${isDarkMode ? 'dark' : 'light'}`}>
      
      
      {/* Pie Chart */}
      
      <div className="chart-container">
        
        {total === 0 ? (
          <div className="empty-chart">
            <svg width="200" height="200" viewBox="0 0 200 200">
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
            <p className={`empty-chart-text ${isDarkMode ? 'dark' : 'light'}`}>
              No tasks yet
            </p>
          </div>
        ) : (
          <div className="chart-svg">
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
                className={`chart-text-large ${isDarkMode ? 'dark' : 'light'}`}
              >
                {total}
              </text>
              <text 
                x="100" 
                y="115" 
                textAnchor="middle" 
                className={`chart-text-small ${isDarkMode ? 'dark' : 'light'}`}
              >
                Total
              </text>
            </svg>
            {/* Legend */}
            <div className="legend">
              <div className="legend-item">
                <div className="legend-label">
                  <div className="legend-color pending"></div>
                  <span className={`legend-text ${isDarkMode ? 'dark' : 'light'}`}>
                    Pending
                  </span>
                </div>
                <div className="legend-value">
                  <span className={`legend-count ${isDarkMode ? 'dark' : 'light'}`}>
                    {pendingTasks}
                  </span>
                  <span className={`legend-percentage ${isDarkMode ? 'dark' : 'light'}`}>
                    ({pendingPercentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
              
              <div className="legend-item">
                <div className="legend-label">
                  <div className="legend-color completed"></div>
                  <span className={`legend-text ${isDarkMode ? 'dark' : 'light'}`}>
                    Completed
                  </span>
                </div>
                <div className="legend-value">
                  <span className={`legend-count ${isDarkMode ? 'dark' : 'light'}`}>
                    {completedTasks}
                  </span>
                  <span className={`legend-percentage ${isDarkMode ? 'dark' : 'light'}`}>
                    ({completedPercentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
            {/*  */}
            
            
          </div>
        )}
      </div>
      
      
    </div>
  );
}