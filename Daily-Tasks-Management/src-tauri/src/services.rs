use crate::model::{LocalService, Service, LogEntry};
use std::process::Stdio;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::io::{AsyncBufReadExt, BufReader};
use sysinfo::{System, Pid};
use std::collections::HashMap;
use chrono::Utc;

pub struct ServiceManager {
    processes: Arc<Mutex<HashMap<u32, tokio::process::Child>>>,
    logs: Arc<Mutex<HashMap<u32, Vec<LogEntry>>>>,
    log_id_counter: Arc<Mutex<u32>>,
}

impl ServiceManager {
    pub fn new() -> Self {
        ServiceManager {
            processes: Arc::new(Mutex::new(HashMap::new())),
            logs: Arc::new(Mutex::new(HashMap::new())),
            log_id_counter: Arc::new(Mutex::new(1)),
        }
    }

    pub async fn start_service_by_id(&self, service_id: u32, service: &Service) -> Result<u32, String> {
        let local_service = LocalService {
            id: service_id,
            name: service.name.clone(),
            command: service.command.clone(),
            working_dir: service.working_dir.clone(),
        };
        self.start_service(&local_service).await
    }

    pub async fn start_service(&self, service: &LocalService) -> Result<u32, String> {
        let mut parts = service.command.split_whitespace();
        let program = parts.next().ok_or("Empty command")?;
        let args: Vec<&str> = parts.collect();

        let mut cmd = tokio::process::Command::new(program);
        cmd.args(&args);
        
        if let Some(ref working_dir) = service.working_dir {
            cmd.current_dir(working_dir);
        }

        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        let mut child = cmd.spawn()
            .map_err(|e| format!("Failed to start service: {}", e))?;

        // Get the PID
        let pid = child.id().unwrap_or(0);

        // Capture stdout and stderr
        let stdout = child.stdout.take();
        let stderr = child.stderr.take();
        
        let service_id = service.id;
        let logs = self.logs.clone();
        let log_id_counter = self.log_id_counter.clone();

        // Spawn task to read stdout
        if let Some(stdout) = stdout {
            let logs_clone = logs.clone();
            let log_id_counter_clone = log_id_counter.clone();
            tokio::spawn(async move {
                let reader = BufReader::new(stdout);
                let mut lines = reader.lines();
                
                while let Ok(Some(line)) = lines.next_line().await {
                    let mut counter = log_id_counter_clone.lock().await;
                    let id = *counter;
                    *counter += 1;
                    drop(counter);
                    
                    let log_entry = LogEntry {
                        id,
                        service_id,
                        level: "info".to_string(),
                        message: line,
                        timestamp: Utc::now().to_rfc3339(),
                    };
                    
                    let mut logs_map = logs_clone.lock().await;
                    logs_map.entry(service_id)
                        .or_insert_with(Vec::new)
                        .push(log_entry);
                    
                    // Keep only last 1000 logs per service
                    if let Some(service_logs) = logs_map.get_mut(&service_id) {
                        if service_logs.len() > 1000 {
                            service_logs.remove(0);
                        }
                    }
                }
            });
        }

        // Spawn task to read stderr
        if let Some(stderr) = stderr {
            let logs_clone = logs.clone();
            let log_id_counter_clone = log_id_counter.clone();
            tokio::spawn(async move {
                let reader = BufReader::new(stderr);
                let mut lines = reader.lines();
                
                while let Ok(Some(line)) = lines.next_line().await {
                    let mut counter = log_id_counter_clone.lock().await;
                    let id = *counter;
                    *counter += 1;
                    drop(counter);
                    
                    let log_entry = LogEntry {
                        id,
                        service_id,
                        level: "error".to_string(),
                        message: line,
                        timestamp: Utc::now().to_rfc3339(),
                    };
                    
                    let mut logs_map = logs_clone.lock().await;
                    logs_map.entry(service_id)
                        .or_insert_with(Vec::new)
                        .push(log_entry);
                    
                    // Keep only last 1000 logs per service
                    if let Some(service_logs) = logs_map.get_mut(&service_id) {
                        if service_logs.len() > 1000 {
                            service_logs.remove(0);
                        }
                    }
                }
            });
        }

        let mut processes = self.processes.lock().await;
        processes.insert(service.id, child);

        Ok(pid)
    }

    pub async fn stop_service(&self, service_id: u32) -> Result<(), String> {
        let mut processes = self.processes.lock().await;
        
        if let Some(mut child) = processes.remove(&service_id) {
            #[cfg(unix)]
            {
                use nix::sys::signal::{kill, Signal};
                use nix::unistd::Pid;
                
                if let Some(pid) = child.id() {
                    let _ = kill(Pid::from_raw(pid as i32), Some(Signal::SIGTERM));
                }
            }
            
            #[cfg(windows)]
            {
                let _ = child.kill().await;
            }
            
            let _ = child.wait().await;
            Ok(())
        } else {
            Err("Service not found".to_string())
        }
    }

    pub async fn is_service_running(&self, service_id: u32) -> bool {
        let mut processes = self.processes.lock().await;
        if let Some(child) = processes.get_mut(&service_id) {
            match child.try_wait() {
                Ok(Some(_)) => false, // Process has exited
                Ok(None) => true,     // Process is still running
                Err(_) => false,
            }
        } else {
            false
        }
    }

    pub fn get_process_info(pid: u32) -> Option<(String, String)> {
        let mut system = System::new_all();
        system.refresh_all();
        
        if let Some(process) = system.process(Pid::from(pid as usize)) {
            Some((
                process.name().to_string(),
                format!("CPU: {:.1}%, Memory: {:.1}MB", 
                    process.cpu_usage(),
                    process.memory() as f64 / 1024.0 / 1024.0
                )
            ))
        } else {
            None
        }
    }

    pub async fn get_service_logs(&self, service_id: u32, limit: Option<usize>) -> Vec<LogEntry> {
        let logs = self.logs.lock().await;
        if let Some(service_logs) = logs.get(&service_id) {
            let mut result = service_logs.clone();
            // Reverse to show newest first
            result.reverse();
            if let Some(limit) = limit {
                result.truncate(limit);
            }
            result
        } else {
            Vec::new()
        }
    }

    pub async fn clear_service_logs(&self, service_id: u32) {
        let mut logs = self.logs.lock().await;
        logs.remove(&service_id);
    }
}
