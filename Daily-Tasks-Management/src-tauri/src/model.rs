use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: u32,
    pub name: String,
    pub path: String,
    #[serde(rename = "projectType")]
    pub project_type: Option<String>,
    pub description: Option<String>,
    #[serde(rename = "lastAccessed")]
    pub last_accessed: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Service {
    pub id: u32,
    pub name: String,
    pub command: String,
    #[serde(rename = "workingDir")]
    pub working_dir: Option<String>,
    #[serde(rename = "projectId")]
    pub project_id: Option<u32>,
    #[serde(rename = "autoStart")]
    pub auto_start: bool,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GitStatus {
    pub id: u32,
    #[serde(rename = "projectId")]
    pub project_id: u32,
    #[serde(rename = "repoPath")]
    pub repo_path: String,
    #[serde(rename = "currentBranch")]
    pub current_branch: Option<String>,
    #[serde(rename = "uncommittedChanges")]
    pub uncommitted_changes: Vec<String>,
    #[serde(rename = "aheadCount")]
    pub ahead_count: u32,
    #[serde(rename = "behindCount")]
    pub behind_count: u32,
    #[serde(rename = "lastChecked")]
    pub last_checked: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogEntry {
    pub id: u32,
    #[serde(rename = "serviceId")]
    pub service_id: u32,
    pub level: String, // "info", "error", "warn", "debug"
    pub message: String,
    pub timestamp: String,
}

// Legacy LocalService for backward compatibility
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalService {
    pub id: u32,
    pub name: String,
    pub command: String,
    pub working_dir: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Task {
    pub id: u32,
    pub title: String,
    pub priority: u8, // 1-5
    pub deadline: String,
    #[serde(rename = "estimatedTime")]
    pub estimated_time: u32,
    #[serde(rename = "startDate")]
    pub start_date: Option<String>,
    #[serde(rename = "scheduledStart")]
    pub scheduled_start: Option<String>,
    pub completed: bool,
    pub locked: bool,
    pub category: Option<String>,
    #[serde(rename = "reminderEnabled")]
    pub reminder_enabled: bool,
    #[serde(rename = "reminderMinutes")]
    pub reminder_minutes: u32,
    #[serde(rename = "projectId")]
    pub project_id: Option<u32>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct TaskFormData {
    pub title: String,
    pub priority: String,
    pub deadline: String,
    #[serde(rename = "estimatedHours")]
    pub estimated_hours: String,
    #[serde(rename = "estimatedMinutes")]
    pub estimated_minutes: String,
    #[serde(rename = "startDate")]
    pub start_date: String,
}