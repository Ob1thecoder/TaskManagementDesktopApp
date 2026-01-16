use daily_tasks_management_lib::projects::ProjectManager;
use std::fs;
use std::path::Path;
use tempfile::TempDir;

#[test]
fn test_validate_project_path_valid() {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let path = temp_dir.path().to_str().unwrap();
    
    let result = ProjectManager::validate_project_path(path);
    assert!(result.is_ok());
}

#[test]
fn test_validate_project_path_invalid() {
    let result = ProjectManager::validate_project_path("/nonexistent/path/12345");
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("does not exist"));
}

#[test]
fn test_get_project_info() {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let path = temp_dir.path();
    
    // Create a Cargo.toml to simulate a Rust project
    let cargo_toml = path.join("Cargo.toml");
    fs::write(&cargo_toml, "[package]\nname = \"test\"").expect("Failed to write Cargo.toml");
    
    let (name, project_type) = ProjectManager::get_project_info(
        path.to_str().unwrap()
    ).expect("Failed to get project info");
    
    assert!(!name.is_empty());
    assert_eq!(project_type, Some("Rust".to_string()));
}

#[test]
fn test_detect_project_type_rust() {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let path = temp_dir.path();
    
    let cargo_toml = path.join("Cargo.toml");
    fs::write(&cargo_toml, "[package]").expect("Failed to write Cargo.toml");
    
    let project_type = ProjectManager::detect_project_type(path.to_str().unwrap());
    assert_eq!(project_type, Some("Rust".to_string()));
}

#[test]
fn test_detect_project_type_nodejs() {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let path = temp_dir.path();
    
    let package_json = path.join("package.json");
    fs::write(&package_json, "{}").expect("Failed to write package.json");
    
    let project_type = ProjectManager::detect_project_type(path.to_str().unwrap());
    assert_eq!(project_type, Some("Node.js".to_string()));
}

#[test]
fn test_detect_project_type_python() {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let path = temp_dir.path();
    
    let requirements = path.join("requirements.txt");
    fs::write(&requirements, "requests==2.0.0").expect("Failed to write requirements.txt");
    
    let project_type = ProjectManager::detect_project_type(path.to_str().unwrap());
    assert_eq!(project_type, Some("Python".to_string()));
}

#[test]
fn test_find_env_files() {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let path = temp_dir.path();
    
    // Create .env file
    let env_file = path.join(".env");
    fs::write(&env_file, "KEY=value").expect("Failed to write .env");
    
    // Create .env.local file
    let env_local = path.join(".env.local");
    fs::write(&env_local, "KEY2=value2").expect("Failed to write .env.local");
    
    let env_files = ProjectManager::find_env_files(path.to_str().unwrap());
    assert!(env_files.len() >= 2);
}
