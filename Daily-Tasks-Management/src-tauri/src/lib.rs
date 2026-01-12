// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod model;
mod database;
mod optimization;
mod projects;
mod services;
mod git;

use database::Database;
use services::ServiceManager;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database
    let db = Database::new("tasks.db").expect("Failed to initialize database");
    let db_state = Mutex::new(db);
    
    // Initialize service manager
    let service_manager = ServiceManager::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(db_state)
        .manage(service_manager)
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            // Task management commands
            commands::create_task,
            commands::get_all_tasks,
            commands::get_task,
            commands::update_task,
            commands::delete_task,
            commands::toggle_task_completion, 
            commands::optimize_tasks,
            // Project management commands
            commands::add_project,
            commands::remove_project,
            commands::get_all_projects,
            commands::get_project_by_id,
            commands::update_project,
            // Service management commands
            commands::register_service,
            commands::unregister_service,
            commands::get_all_services,
            commands::get_service_by_id,
            commands::start_service,
            commands::stop_service,
            commands::restart_service,
            commands::get_service_status,
            // Git commands
            commands::get_git_status_for_project,
            commands::get_all_git_statuses,
            commands::git_commit,
            commands::git_push,
            commands::git_pull
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
