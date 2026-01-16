import '../styles/navigation.css';

export type ViewType = 'dashboard' | 'projects' | 'services' | 'git' | 'tasks';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isDarkMode: boolean;
}

export function Navigation({ currentView, onViewChange, isDarkMode }: NavigationProps) {
  const navItems: { id: ViewType; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'projects', label: 'Projects' },
    { id: 'services', label: 'Services'},
    { id: 'git', label: 'Git' },
    { id: 'tasks', label: 'Tasks' },
  ];

  return (
    <nav className={`navigation ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="nav-items">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`nav-item ${currentView === item.id ? 'active' : ''} ${isDarkMode ? 'dark' : 'light'}`}
            title={item.label}
          >
            
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
