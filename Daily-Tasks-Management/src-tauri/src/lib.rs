// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod model;
mod database;
mod optimization;

use database::Database;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database
    let db = Database::new("tasks.db").expect("Failed to initialize database");
    let db_state = Mutex::new(db);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            // Task management commands
            commands::create_task,
            commands::get_all_tasks,
            commands::get_task,
            commands::update_task,
            commands::delete_task,
            commands::toggle_task_completion, 
            commands::optimize_tasks
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
