// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod model;
mod database;

use commands::DbState;
use database::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database
    let db = Database::new("tasks.db").expect("Failed to initialize database");
    let db_state = DbState::new(db);

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
            commands::toggle_task_completion
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
