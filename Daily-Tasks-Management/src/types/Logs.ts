export interface LogEntry {
  id: number;
  serviceId: number;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  timestamp: string;
}
