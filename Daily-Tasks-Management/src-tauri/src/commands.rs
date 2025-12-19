use crate::model::*;
use crate::database::Database;
use std::sync::Mutex;

// Database instance will be managed by Tauri's state management
pub type DbState = Mutex<Database>;

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
// Task management commands
#[tauri::command]
pub fn create_task(db: tauri::State<DbState>, form_data: TaskFormData) -> Result<Task, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.create_task(form_data).map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub fn get_all_tasks(db: tauri::State<DbState>) -> Result<Vec<Task>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.get_all_tasks().map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub fn get_task(db: tauri::State<DbState>, id: u32) -> Result<Option<Task>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.get_task_by_id(id).map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub fn update_task(db: tauri::State<DbState>, task: Task) -> Result<(), String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.update_task(&task).map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub fn delete_task(db: tauri::State<DbState>, id: u32) -> Result<(), String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.delete_task(id).map_err(|e| format!("Database error: {}", e))
}

#[tauri::command]
pub fn toggle_task_completion(db: tauri::State<DbState>, id: u32, completed: bool) -> Result<(), String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.mark_task_completed(id, completed).map_err(|e| format!("Database error: {}", e))
}