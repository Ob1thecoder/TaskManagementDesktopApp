use crate::model::*;
use crate::database::Database;
use crate::optimization::optimize_task_schedule;
use crate::projects::ProjectManager;
use crate::services::ServiceManager;
use crate::git;
use std::sync::Mutex;
use tauri::State;

// Database instance will be managed by Tauri's state management
pub type DbState = Mutex<Database>;
pub type ServiceMgrState = ServiceManager;

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Task management commands
#[tauri::command]
pub fn create_task(db: tauri::State<DbState>, form_data: TaskFormData) -> Result<Task, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.create_task(form_data).map_err(|e| format!("Failed to create task: {}", e))
}

#[tauri::command]
pub fn get_all_tasks(db: tauri::State<DbState>) -> Result<Vec<Task>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.get_all_tasks().map_err(|e| format!("Failed to get tasks: {}", e))
}

#[tauri::command]
pub fn get_task(db: tauri::State<DbState>, id: u32) -> Result<Option<Task>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.get_task_by_id(id).map_err(|e| format!("Failed to get task: {}", e))
}

#[tauri::command]
pub fn update_task(db: tauri::State<DbState>, task: Task) -> Result<(), String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.update_task(&task).map_err(|e| format!("Failed to update task: {}", e))
}

#[tauri::command]
pub fn delete_task(db: tauri::State<DbState>, id: u32) -> Result<(), String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.delete_task(id).map_err(|e| format!("Failed to delete task: {}", e))
}

#[tauri::command]
pub fn toggle_task_completion(db: tauri::State<DbState>, id: u32, completed: bool) -> Result<(), String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.mark_task_completed(id, completed).map_err(|e| format!("Failed to toggle task completion: {}", e))
}

#[tauri::command]
pub fn optimize_tasks(db: tauri::State<DbState>) -> Result<Vec<Task>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let tasks = db.get_all_tasks().map_err(|e| format!("Failed to get tasks: {}", e))?;
    let optimized_tasks = optimize_task_schedule(tasks);
    
    // Update each task in the database with the new scheduled start time
    for task in &optimized_tasks {
        db.update_task(&task).map_err(|e| format!("Failed to update task: {}", e))?;
    }

    Ok(optimized_tasks)
}

// Project management commands
#[tauri::command]
pub fn add_project(
    db: State<DbState>,
    name: String,
    path: String,
) -> Result<Project, String> {
    // Validate path
    ProjectManager::validate_project_path(&path)?;
    
    // Get project info
    let (detected_name, project_type) = ProjectManager::get_project_info(&path)
        .map_err(|e| format!("Failed to get project info: {}", e))?;
    
    let final_name = if name.is_empty() { detected_name } else { name };
    
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.create_project(final_name, path, project_type, None)
        .map_err(|e| format!("Failed to create project: {}", e))
}

#[tauri::command]
pub fn remove_project(db: State<DbState>, id: u32) -> Result<(), String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.delete_project(id).map_err(|e| format!("Failed to delete project: {}", e))
}

#[tauri::command]
pub fn get_all_projects(db: State<DbState>) -> Result<Vec<Project>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.get_all_projects().map_err(|e| format!("Failed to get projects: {}", e))
}

#[tauri::command]
pub fn get_project_by_id(db: State<DbState>, id: u32) -> Result<Option<Project>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.get_project_by_id(id).map_err(|e| format!("Failed to get project: {}", e))
}

#[tauri::command]
pub fn update_project(db: State<DbState>, project: Project) -> Result<(), String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.update_project(&project).map_err(|e| format!("Failed to update project: {}", e))
}

// Service management commands
#[tauri::command]
pub fn register_service(
    db: State<DbState>,
    name: String,
    command: String,
    working_dir: Option<String>,
    project_id: Option<u32>,
    auto_start: bool,
) -> Result<Service, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.create_service(name, command, working_dir, project_id, auto_start)
        .map_err(|e| format!("Failed to create service: {}", e))
}

#[tauri::command]
pub fn unregister_service(db: State<DbState>, id: u32) -> Result<(), String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.delete_service(id).map_err(|e| format!("Failed to delete service: {}", e))
}

#[tauri::command]
pub fn get_all_services(db: State<DbState>) -> Result<Vec<Service>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.get_all_services().map_err(|e| format!("Failed to get services: {}", e))
}

#[tauri::command]
pub fn get_service_by_id(db: State<DbState>, id: u32) -> Result<Option<Service>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    db.get_service_by_id(id).map_err(|e| format!("Failed to get service: {}", e))
}

#[tauri::command]
pub async fn start_service(
    service_mgr: State<'_, ServiceMgrState>,
    db: State<'_, DbState>,
    id: u32,
) -> Result<u32, String> {
    // Get service from database
    let service = {
        let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
        db.get_service_by_id(id)
            .map_err(|e| format!("Failed to get service: {}", e))?
            .ok_or_else(|| "Service not found".to_string())?
    };
    
    service_mgr.start_service_by_id(id, &service).await
}

#[tauri::command]
pub async fn stop_service(
    service_mgr: State<'_, ServiceMgrState>,
    id: u32,
) -> Result<(), String> {
    service_mgr.stop_service(id).await
}

#[tauri::command]
pub async fn restart_service(
    service_mgr: State<'_, ServiceMgrState>,
    db: State<'_, DbState>,
    id: u32,
) -> Result<u32, String> {
    // Stop first
    service_mgr.stop_service(id).await?;
    
    // Then start
    let service = {
        let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
        db.get_service_by_id(id)
            .map_err(|e| format!("Failed to get service: {}", e))?
            .ok_or_else(|| "Service not found".to_string())?
    };
    
    service_mgr.start_service_by_id(id, &service).await
}

#[tauri::command]
pub async fn get_service_status(
    service_mgr: State<'_, ServiceMgrState>,
    id: u32,
) -> Result<bool, String> {
    Ok(service_mgr.is_service_running(id).await)
}

// Git commands
#[tauri::command]
pub fn get_git_status_for_project(
    db: State<DbState>,
    project_id: u32,
) -> Result<Option<GitStatus>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    // Get project to find repo path
    let project = db.get_project_by_id(project_id)
        .map_err(|e| format!("Failed to get project: {}", e))?
        .ok_or_else(|| "Project not found".to_string())?;
    
    // Find git repo
    let repo_path = ProjectManager::find_git_repository(&project.path)
        .ok_or_else(|| "No git repository found in project".to_string())?;
    
    // Get git status
    let mut git_status = git::get_git_status(&repo_path)
        .map_err(|e| format!("Failed to get git status: {}", e))?;
    
    // Update git_status with project info
    git_status.id = db.get_git_repo_by_project_id(project_id)
        .map_err(|e| format!("Failed to get git repo: {}", e))?
        .map(|g| g.id)
        .unwrap_or(0);
    git_status.project_id = project_id;
    
    // Update or create git_repo record
    if git_status.id == 0 {
        let _ = db.create_git_repo(project_id, repo_path.clone());
        git_status.id = db.get_git_repo_by_project_id(project_id)
            .map_err(|e| format!("Failed to get git repo: {}", e))?
            .map(|g| g.id)
            .unwrap_or(0);
    } else {
        db.update_git_repo(&git_status)
            .map_err(|e| format!("Failed to update git repo: {}", e))?;
    }
    
    Ok(Some(git_status))
}

#[tauri::command]
pub fn get_all_git_statuses(db: State<DbState>) -> Result<Vec<GitStatus>, String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    let projects = db.get_all_projects()
        .map_err(|e| format!("Failed to get projects: {}", e))?;
    
    let mut statuses = Vec::new();
    for project in projects {
        if let Some(repo_path) = ProjectManager::find_git_repository(&project.path) {
            if let Ok(mut git_status) = git::get_git_status(&repo_path) {
                git_status.project_id = project.id;
                if let Ok(Some(repo)) = db.get_git_repo_by_project_id(project.id) {
                    git_status.id = repo.id;
                }
                statuses.push(git_status);
            }
        }
    }
    
    Ok(statuses)
}

#[tauri::command]
pub fn git_commit(
    db: State<DbState>,
    project_id: u32,
    message: String,
) -> Result<(), String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    let project = db.get_project_by_id(project_id)
        .map_err(|e| format!("Failed to get project: {}", e))?
        .ok_or_else(|| "Project not found".to_string())?;
    
    let repo_path = ProjectManager::find_git_repository(&project.path)
        .ok_or_else(|| "No git repository found".to_string())?;
    
    let repo = git2::Repository::open(&repo_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;
    
    let mut index = repo.index()
        .map_err(|e| format!("Failed to get index: {}", e))?;
    
    let tree_id = index.write_tree()
        .map_err(|e| format!("Failed to write tree: {}", e))?;
    let tree = repo.find_tree(tree_id)
        .map_err(|e| format!("Failed to find tree: {}", e))?;
    
    let sig = repo.signature()
        .map_err(|e| format!("Failed to get signature: {}", e))?;
    
    let head = repo.head()
        .map_err(|e| format!("Failed to get HEAD: {}", e))?;
    let parent = head.peel_to_commit()
        .map_err(|e| format!("Failed to peel to commit: {}", e))?;
    
    repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &message,
        &tree,
        &[&parent],
    ).map_err(|e| format!("Failed to commit: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub fn open_in_vscode(project_path: String) -> Result<(), String> {
    use std::process::Command;
    
    #[cfg(target_os = "windows")]
    {
        Command::new("code")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open VS Code: {}. Make sure VS Code is installed and 'code' is in your PATH.", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(&["-a", "Visual Studio Code", &project_path])
            .spawn()
            .map_err(|e| format!("Failed to open VS Code: {}. Make sure VS Code is installed.", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        // Try 'code' command first (if VS Code CLI is installed)
        if Command::new("code")
            .arg(&project_path)
            .spawn()
            .is_ok() {
            return Ok(());
        }
        
        // Fallback: try common VS Code installation paths
        let code_paths = [
            "/usr/bin/code",
            "/usr/local/bin/code",
            "/snap/bin/code",
        ];
        
        for code_path in &code_paths {
            if Command::new(code_path)
                .arg(&project_path)
                .spawn()
                .is_ok() {
                return Ok(());
            }
        }
        
        return Err("Failed to open VS Code. Please install VS Code and ensure 'code' command is available, or install VS Code from snap store.".to_string());
    }
    
    Ok(())
}

#[tauri::command]
pub fn git_push(db: State<DbState>, project_id: u32) -> Result<(), String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    let project = db.get_project_by_id(project_id)
        .map_err(|e| format!("Failed to get project: {}", e))?
        .ok_or_else(|| "Project not found".to_string())?;
    
    let repo_path = ProjectManager::find_git_repository(&project.path)
        .ok_or_else(|| "No git repository found".to_string())?;
    
    // Open VS Code so user can use integrated git features
    open_in_vscode(repo_path)?;
    
    Ok(())
}

#[tauri::command]
pub fn git_pull(db: State<DbState>, project_id: u32) -> Result<(), String> {
    let db = db.lock().map_err(|e| format!("Database lock error: {}", e))?;
    
    let project = db.get_project_by_id(project_id)
        .map_err(|e| format!("Failed to get project: {}", e))?
        .ok_or_else(|| "Project not found".to_string())?;
    
    let repo_path = ProjectManager::find_git_repository(&project.path)
        .ok_or_else(|| "No git repository found".to_string())?;
    
    // Open VS Code so user can use integrated git features
    open_in_vscode(repo_path)?;
    
    Ok(())
}