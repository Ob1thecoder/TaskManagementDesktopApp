use serde::{Deserialize, Serialize};

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