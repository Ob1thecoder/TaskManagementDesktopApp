use daily_tasks_management_lib::database::Database;
use daily_tasks_management_lib::projects::ProjectManager;
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

// Integration tests that test the command logic without Tauri State
// These test the core functionality that commands use

#[test]
fn test_add_project_logic() {
    let (db, _db_temp) = setup_test_db();
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let project_path = temp_dir.path().to_str().unwrap();
    
    // Create a simple project directory
    fs::create_dir_all(project_path).expect("Failed to create project dir");
    let cargo_toml = Path::new(project_path).join("Cargo.toml");
    fs::write(&cargo_toml, "[package]\nname = \"test\"").expect("Failed to write Cargo.toml");
    
    // Validate path (as command does)
    ProjectManager::validate_project_path(project_path)
        .expect("Failed to validate path");
    
    // Get project info (as command does)
    let (detected_name, project_type) = ProjectManager::get_project_info(project_path)
        .expect("Failed to get project info");
    
    // Create project (as command does)
    let project = db.create_project(
        "Test Project".to_string(),
        project_path.to_string(),
        project_type,
        None,
    ).expect("Failed to create project");
    
    assert_eq!(project.name, "Test Project");
    assert_eq!(project.path, project_path);
    assert_eq!(project.project_type, Some("Rust".to_string()));
}

#[test]
fn test_get_all_projects_logic() {
    let (db, _db_temp) = setup_test_db();
    let temp_dir1 = TempDir::new().expect("Failed to create temp dir");
    let temp_dir2 = TempDir::new().expect("Failed to create temp dir");
    
    let path1 = temp_dir1.path().to_str().unwrap();
    let path2 = temp_dir2.path().to_str().unwrap();
    
    fs::create_dir_all(path1).expect("Failed to create dir");
    fs::create_dir_all(path2).expect("Failed to create dir");
    
    // Create two projects directly
    let _ = db.create_project(
        "Project 1".to_string(),
        path1.to_string(),
        None,
        None,
    ).expect("Failed to create project 1");
    
    let _ = db.create_project(
        "Project 2".to_string(),
        path2.to_string(),
        Some("Node.js".to_string()),
        None,
    ).expect("Failed to create project 2");
    
    let projects = db.get_all_projects().expect("Failed to get projects");
    assert!(projects.len() >= 2);
}

#[test]
fn test_register_service_logic() {
    let (db, _db_temp) = setup_test_db();
    
    let service = db.create_service(
        "Test Service".to_string(),
        "echo hello".to_string(),
        None,
        None,
        false,
    ).expect("Failed to create service");
    
    assert_eq!(service.name, "Test Service");
    assert_eq!(service.command, "echo hello");
    assert!(!service.auto_start);
}

#[test]
fn test_get_all_services_logic() {
    let (db, _db_temp) = setup_test_db();
    
    let _ = db.create_service(
        "Service 1".to_string(),
        "command1".to_string(),
        None,
        None,
        false,
    ).expect("Failed to create service 1");
    
    let _ = db.create_service(
        "Service 2".to_string(),
        "command2".to_string(),
        None,
        None,
        true,
    ).expect("Failed to create service 2");
    
    let services = db.get_all_services().expect("Failed to get services");
    assert!(services.len() >= 2);
}

#[test]
fn test_update_and_delete_project_logic() {
    let (db, _db_temp) = setup_test_db();
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let project_path = temp_dir.path().to_str().unwrap();
    
    fs::create_dir_all(project_path).expect("Failed to create dir");
    
    // Create project
    let mut project = db.create_project(
        "Original Name".to_string(),
        project_path.to_string(),
        None,
        None,
    ).expect("Failed to create project");
    
    // Update project
    project.name = "Updated Name".to_string();
    project.description = Some("Updated description".to_string());
    
    db.update_project(&project).expect("Failed to update project");
    
    // Verify update
    let updated = db.get_project_by_id(project.id)
        .expect("Failed to get project")
        .expect("Project not found");
    
    assert_eq!(updated.name, "Updated Name");
    assert_eq!(updated.description, Some("Updated description".to_string()));
    
    // Delete project
    db.delete_project(project.id).expect("Failed to delete project");
    
    // Verify deletion
    let deleted = db.get_project_by_id(project.id)
        .expect("Failed to query");
    
    assert!(deleted.is_none());
}

#[test]
fn test_service_with_project_logic() {
    let (db, _db_temp) = setup_test_db();
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let project_path = temp_dir.path().to_str().unwrap();
    
    fs::create_dir_all(project_path).expect("Failed to create dir");
    
    // Create project
    let project = db.create_project(
        "Service Project".to_string(),
        project_path.to_string(),
        None,
        None,
    ).expect("Failed to create project");
    
    // Create service linked to project
    let service = db.create_service(
        "Project Service".to_string(),
        "npm start".to_string(),
        Some(project_path.to_string()),
        Some(project.id),
        false,
    ).expect("Failed to create service");
    
    assert_eq!(service.project_id, Some(project.id));
    assert_eq!(service.working_dir, Some(project_path.to_string()));
}
