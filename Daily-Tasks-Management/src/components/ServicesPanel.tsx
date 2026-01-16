import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Service } from '../types/Services';
import '../styles/services-panel.css';

interface ServicesPanelProps {
  isDarkMode: boolean;
}

export function ServicesPanel({ isDarkMode }: ServicesPanelProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [serviceStatuses, setServiceStatuses] = useState<Record<number, boolean>>({});
  const [newService, setNewService] = useState({
    name: '',
    command: '',
    workingDir: '',
    projectId: undefined as number | undefined,
    autoStart: false,
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const servicesData = await invoke<Service[]>('get_all_services');
      setServices(servicesData);
      
      // Check status for each service
      const statuses: Record<number, boolean> = {};
      for (const service of servicesData) {
        try {
          const isRunning = await invoke<boolean>('get_service_status', { id: service.id });
          statuses[service.id] = isRunning;
        } catch {
          statuses[service.id] = false;
        }
      }
      setServiceStatuses(statuses);
    } catch (err) {
      setError(err as string);
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!newService.name.trim() || !newService.command.trim()) {
      setError('Service name and command are required');
      return;
    }

    try {
      setError(null);
      const service = await invoke<Service>('register_service', {
        name: newService.name.trim(),
        command: newService.command.trim(),
        workingDir: newService.workingDir.trim() || undefined,
        projectId: newService.projectId || undefined,
        autoStart: newService.autoStart,
      });
      setServices(prev => [service, ...prev]);
      setNewService({
        name: '',
        command: '',
        workingDir: '',
        projectId: undefined,
        autoStart: false,
      });
      setShowAddForm(false);
    } catch (err) {
      setError(err as string);
      console.error('Failed to add service:', err);
    }
  };

  const handleStartService = async (id: number) => {
    try {
      await invoke('start_service', { id });
      setServiceStatuses(prev => ({ ...prev, [id]: true }));
      setError(null);
    } catch (err) {
      setError(err as string);
      console.error('Failed to start service:', err);
    }
  };

  const handleStopService = async (id: number) => {
    try {
      await invoke('stop_service', { id });
      setServiceStatuses(prev => ({ ...prev, [id]: false }));
      setError(null);
    } catch (err) {
      setError(err as string);
      console.error('Failed to stop service:', err);
    }
  };

  const handleRemoveService = async (id: number) => {
    if (!confirm('Are you sure you want to remove this service?')) return;

    try {
      await invoke('unregister_service', { id });
      setServices(prev => prev.filter(s => s.id !== id));
      setError(null);
    } catch (err) {
      setError(err as string);
      console.error('Failed to remove service:', err);
    }
  };

  if (loading) {
    return (
      <div className={`services-panel ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="loading-container">
          <div className={`loading-text ${isDarkMode ? 'dark' : 'light'}`}>Loading services...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`services-panel ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="panel-header">
        <h2 className={`panel-title ${isDarkMode ? 'dark' : 'light'}`}>Services</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`btn-primary ${isDarkMode ? 'dark' : 'light'}`}
        >
          {showAddForm ? 'Cancel' : '+ Add Service'}
        </button>
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

      {showAddForm && (
        <div className={`add-form ${isDarkMode ? 'dark' : 'light'}`}>
          <div className="form-group">
            <label className={`form-label ${isDarkMode ? 'dark' : 'light'}`}>Service Name</label>
            <input
              type="text"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              placeholder="My Service"
              className={`form-input ${isDarkMode ? 'dark' : 'light'}`}
            />
          </div>
          <div className="form-group">
            <label className={`form-label ${isDarkMode ? 'dark' : 'light'}`}>Command</label>
            <input
              type="text"
              value={newService.command}
              onChange={(e) => setNewService({ ...newService, command: e.target.value })}
              placeholder="npm start"
              className={`form-input ${isDarkMode ? 'dark' : 'light'}`}
            />
          </div>
          <div className="form-group">
            <label className={`form-label ${isDarkMode ? 'dark' : 'light'}`}>Working Directory (optional)</label>
            <input
              type="text"
              value={newService.workingDir}
              onChange={(e) => setNewService({ ...newService, workingDir: e.target.value })}
              placeholder="/path/to/directory"
              className={`form-input ${isDarkMode ? 'dark' : 'light'}`}
            />
          </div>
          <div className="form-group">
            <label className={`form-checkbox-label ${isDarkMode ? 'dark' : 'light'}`}>
              <input
                type="checkbox"
                checked={newService.autoStart}
                onChange={(e) => setNewService({ ...newService, autoStart: e.target.checked })}
                className="form-checkbox"
              />
              Auto-start on app launch
            </label>
          </div>
          <button
            onClick={handleAddService}
            className={`btn-primary ${isDarkMode ? 'dark' : 'light'}`}
          >
            Add Service
          </button>
        </div>
      )}

      {services.length === 0 ? (
        <div className={`empty-state ${isDarkMode ? 'dark' : 'light'}`}>
          <p>No services registered. Add your first service to get started.</p>
        </div>
      ) : (
        <div className="services-list">
          {services.map((service) => {
            const isRunning = serviceStatuses[service.id] || false;
            return (
              <div key={service.id} className={`service-card ${isDarkMode ? 'dark' : 'light'}`}>
                <div className="service-card-header">
                  <div className="service-info">
                    <h3 className={`service-name ${isDarkMode ? 'dark' : 'light'}`}>
                      {service.name}
                    </h3>
                    <div className={`service-status ${isRunning ? 'running' : 'stopped'} ${isDarkMode ? 'dark' : 'light'}`}>
                      <span className="status-dot"></span>
                      {isRunning ? 'Running' : 'Stopped'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveService(service.id)}
                    className={`btn-icon ${isDarkMode ? 'dark' : 'light'}`}
                    title="Remove service"
                  >
                    ×
                  </button>
                </div>
                <div className={`service-command ${isDarkMode ? 'dark' : 'light'}`}>
                  {service.command}
                </div>
                {service.workingDir && (
                  <div className={`service-working-dir ${isDarkMode ? 'dark' : 'light'}`}>
                    {service.workingDir}
                  </div>
                )}
                <div className="service-actions">
                  {isRunning ? (
                    <button
                      onClick={() => handleStopService(service.id)}
                      className={`btn-stop ${isDarkMode ? 'dark' : 'light'}`}
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartService(service.id)}
                      className={`btn-start ${isDarkMode ? 'dark' : 'light'}`}
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
