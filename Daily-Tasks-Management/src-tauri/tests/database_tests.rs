use daily_tasks_management_lib::database::Database;
use daily_tasks_management_lib::model::TaskFormData;
use std::fs;
use std::path::Path;
use tempfile::TempDir;

fn setup_test_db() -> (Database, TempDir) {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let db_path = temp_dir.path().join("test.db");
    let db = Database::new(db_path.to_str().unwrap())
        .expect("Failed to create test database");
    (db, temp_dir)
}

#[test]
fn test_database_initialization() {
    let (_db, _temp_dir) = setup_test_db();
    // If we get here, initialization succeeded
    // TempDir will clean up automatically
}

#[test]
fn test_create_and_get_project() {
    let (db, _temp_dir) = setup_test_db();
    
    // Create a project
    let project = db.create_project(
        "Test Project".to_string(),
        "/tmp/test_project".to_string(),
        Some("Rust".to_string()),
        Some("A test project".to_string()),
    ).expect("Failed to create project");
    
    assert_eq!(project.name, "Test Project");
    assert_eq!(project.path, "/tmp/test_project");
    assert_eq!(project.project_type, Some("Rust".to_string()));
    
    // Get project by ID
    let retrieved = db.get_project_by_id(project.id)
        .expect("Failed to get project")
        .expect("Project not found");
    
    assert_eq!(retrieved.id, project.id);
    assert_eq!(retrieved.name, "Test Project");
    // TempDir will clean up automatically
}

#[test]
fn test_get_all_projects() {
    let (db, _temp_dir) = setup_test_db();
    
    // Create multiple projects
    let _project1 = db.create_project(
        "Project 1".to_string(),
        "/tmp/project1".to_string(),
        None,
        None,
    ).expect("Failed to create project 1");
    
    let _project2 = db.create_project(
        "Project 2".to_string(),
        "/tmp/project2".to_string(),
        Some("Node.js".to_string()),
        None,
    ).expect("Failed to create project 2");
    
    let projects = db.get_all_projects().expect("Failed to get projects");
    assert!(projects.len() >= 2);
    // TempDir will clean up automatically
}

#[test]
fn test_update_project() {
    let (db, _temp_dir) = setup_test_db();
    
    let mut project = db.create_project(
        "Original Name".to_string(),
        "/tmp/original".to_string(),
        None,
        None,
    ).expect("Failed to create project");
    
    project.name = "Updated Name".to_string();
    project.description = Some("Updated description".to_string());
    
    db.update_project(&project).expect("Failed to update project");
    
    let updated = db.get_project_by_id(project.id)
        .expect("Failed to get project")
        .expect("Project not found");
    
    assert_eq!(updated.name, "Updated Name");
    assert_eq!(updated.description, Some("Updated description".to_string()));
    // TempDir will clean up automatically
}

#[test]
fn test_delete_project() {
    let (db, _temp_dir) = setup_test_db();
    
    let project = db.create_project(
        "To Delete".to_string(),
        "/tmp/delete_me".to_string(),
        None,
        None,
    ).expect("Failed to create project");
    
    let project_id = project.id;
    db.delete_project(project_id).expect("Failed to delete project");
    
    let deleted = db.get_project_by_id(project_id)
        .expect("Failed to query");
    
    assert!(deleted.is_none());
    // TempDir will clean up automatically
}

#[test]
fn test_create_and_get_service() {
    let (db, _temp_dir) = setup_test_db();
    
    // First create a project
    let project = db.create_project(
        "Service Project".to_string(),
        "/tmp/service_project".to_string(),
        None,
        None,
    ).expect("Failed to create project");
    
    // Create a service
    let service = db.create_service(
        "Test Service".to_string(),
        "npm start".to_string(),
        Some("/tmp/service_project".to_string()),
        Some(project.id),
        false,
    ).expect("Failed to create service");
    
    assert_eq!(service.name, "Test Service");
    assert_eq!(service.command, "npm start");
    assert_eq!(service.project_id, Some(project.id));
    
    // Get service by ID
    let retrieved = db.get_service_by_id(service.id)
        .expect("Failed to get service")
        .expect("Service not found");
    
    assert_eq!(retrieved.id, service.id);
    assert_eq!(retrieved.name, "Test Service");
    // TempDir will clean up automatically
}

#[test]
fn test_get_all_services() {
    let (db, _temp_dir) = setup_test_db();
    
    let service1 = db.create_service(
        "Service 1".to_string(),
        "command1".to_string(),
        None,
        None,
        false,
    ).expect("Failed to create service 1");
    
    let service2 = db.create_service(
        "Service 2".to_string(),
        "command2".to_string(),
        None,
        None,
        true,
    ).expect("Failed to create service 2");
    
    let services = db.get_all_services().expect("Failed to get services");
    assert!(services.len() >= 2);
    // TempDir will clean up automatically
}

#[test]
fn test_update_service() {
    let (db, _temp_dir) = setup_test_db();
    
    let mut service = db.create_service(
        "Original Service".to_string(),
        "original command".to_string(),
        None,
        None,
        false,
    ).expect("Failed to create service");
    
    service.name = "Updated Service".to_string();
    service.command = "updated command".to_string();
    service.auto_start = true;
    
    db.update_service(&service).expect("Failed to update service");
    
    let updated = db.get_service_by_id(service.id)
        .expect("Failed to get service")
        .expect("Service not found");
    
    assert_eq!(updated.name, "Updated Service");
    assert_eq!(updated.command, "updated command");
    assert!(updated.auto_start);
    // TempDir will clean up automatically
}

#[test]
fn test_delete_service() {
    let (db, _temp_dir) = setup_test_db();
    
    let service = db.create_service(
        "To Delete".to_string(),
        "delete command".to_string(),
        None,
        None,
        false,
    ).expect("Failed to create service");
    
    let service_id = service.id;
    db.delete_service(service_id).expect("Failed to delete service");
    
    let deleted = db.get_service_by_id(service_id)
        .expect("Failed to query");
    
    assert!(deleted.is_none());
    // TempDir will clean up automatically
}

#[test]
fn test_create_task_with_project_id() {
    let (db, _temp_dir) = setup_test_db();
    
    // Create a project
    let project = db.create_project(
        "Task Project".to_string(),
        "/tmp/task_project".to_string(),
        None,
        None,
    ).expect("Failed to create project");
    
    // Create a task linked to project
    let form_data = TaskFormData {
        title: "Test Task".to_string(),
        priority: "3".to_string(),
        deadline: "2024-12-31".to_string(),
        estimated_hours: "2".to_string(),
        estimated_minutes: "30".to_string(),
        start_date: "2024-01-01".to_string(),
    };
    
    let task = db.create_task(form_data).expect("Failed to create task");
    
    // Update task with project_id
    let mut task_with_project = task;
    task_with_project.project_id = Some(project.id);
    db.update_task(&task_with_project).expect("Failed to update task");
    
    let retrieved = db.get_task_by_id(task_with_project.id)
        .expect("Failed to get task")
        .expect("Task not found");
    
    assert_eq!(retrieved.project_id, Some(project.id));
    // TempDir will clean up automatically
}

#[test]
fn test_git_repo_operations() {
    let (db, _temp_dir) = setup_test_db();
    
    let project = db.create_project(
        "Git Project".to_string(),
        "/tmp/git_project".to_string(),
        None,
        None,
    ).expect("Failed to create project");
    
    // Create git repo record
    let repo_id = db.create_git_repo(
        project.id,
        "/tmp/git_project".to_string(),
    ).expect("Failed to create git repo");
    
    assert!(repo_id > 0);
    
    // Get git repo by project ID
    let git_repo = db.get_git_repo_by_project_id(project.id)
        .expect("Failed to get git repo")
        .expect("Git repo not found");
    
    assert_eq!(git_repo.project_id, project.id);
    assert_eq!(git_repo.repo_path, "/tmp/git_project");
    // TempDir will clean up automatically
}
