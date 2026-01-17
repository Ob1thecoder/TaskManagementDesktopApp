import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Service } from '../types/Services';
import { LogEntry } from '../types/Logs';
import '../styles/log-viewer.css';

interface LogViewerProps {
  isDarkMode: boolean;
}

export function LogViewer({ isDarkMode }: LogViewerProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [logLevel, setLogLevel] = useState<string>('all');

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      loadLogs();
      // Set up polling for real-time logs (every 2 seconds)
      const interval = setInterval(() => {
        if (autoScroll) {
          loadLogs();
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedServiceId, autoScroll]);

  const loadServices = async () => {
    try {
      const servicesData = await invoke<Service[]>('get_all_services');
      setServices(servicesData);
    } catch (err) {
      setError(err as string);
      console.error('Failed to load services:', err);
    }
  };

  const loadLogs = async () => {
    if (!selectedServiceId) return;

    try {
      setLoading(true);
      setError(null);
      const logsData = await invoke<LogEntry[]>('get_service_logs', { 
        serviceId: selectedServiceId,
        limit: 1000 
      });
      setLogs(logsData);
    } catch (err) {
      setError(err as string);
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = !filter || log.message.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    return matchesFilter && matchesLevel;
  });

  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  return (
    <div className={`log-viewer ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="panel-header">
        <h2 className={`panel-title ${isDarkMode ? 'dark' : 'light'}`}>Log Viewer</h2>
        <div className="header-actions">
          <button
            onClick={loadLogs}
            className={`btn-secondary ${isDarkMode ? 'dark' : 'light'}`}
            disabled={!selectedServiceId}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <div className="error-text">
              <div className="error-title">Error</div>
              <div className="error-description">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="log-viewer-content">
        <div className="log-sidebar">
          <h3 className={`sidebar-title ${isDarkMode ? 'dark' : 'light'}`}>Services</h3>
          {services.length === 0 ? (
            <div className={`empty-state ${isDarkMode ? 'dark' : 'light'}`}>
              No services registered
            </div>
          ) : (
            <div className="services-list">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setLogs([]);
                  }}
                  className={`service-item ${selectedServiceId === service.id ? 'active' : ''} ${isDarkMode ? 'dark' : 'light'}`}
                >
                  <span className="service-name">{service.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="log-main">
          {!selectedServiceId ? (
            <div className={`empty-state ${isDarkMode ? 'dark' : 'light'}`}>
              <p>Select a service to view its logs</p>
            </div>
          ) : (
            <>
              <div className="log-controls">
                <div className="filter-group">
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Search logs..."
                    className={`filter-input ${isDarkMode ? 'dark' : 'light'}`}
                  />
                  <select
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value)}
                    className={`level-select ${isDarkMode ? 'dark' : 'light'}`}
                  >
                    <option value="all">All Levels</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
                <label className={`auto-scroll-label ${isDarkMode ? 'dark' : 'light'}`}>
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="auto-scroll-checkbox"
                  />
                  Auto-scroll
                </label>
              </div>

              <div
                ref={logContainerRef}
                className={`log-container ${isDarkMode ? 'dark' : 'light'}`}
              >
                {loading && logs.length === 0 ? (
                  <div className="loading-container">
                    <div className={`loading-text ${isDarkMode ? 'dark' : 'light'}`}>
                      Loading logs...
                    </div>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className={`empty-state ${isDarkMode ? 'dark' : 'light'}`}>
                    <p>No logs available</p>
                    <p className="empty-hint">
                      {logs.length === 0 
                        ? "Start the service to see logs here. Logs will appear in real-time."
                        : "No logs match your current filter. Try adjusting the search or log level."}
                    </p>
                  </div>
                ) : (
                  <div className="log-entries">
                    {filteredLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`log-entry log-${log.level} ${isDarkMode ? 'dark' : 'light'}`}
                      >
                        <span className="log-timestamp">{log.timestamp}</span>
                        <span className={`log-level log-level-${log.level}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="log-message">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="log-footer">
                <span className={`log-count ${isDarkMode ? 'dark' : 'light'}`}>
                  {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
                  {filter !== '' && ` (filtered from ${logs.length})`}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
