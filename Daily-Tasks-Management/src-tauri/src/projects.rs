use std::path::Path;
use crate::git;

pub struct ProjectManager;

impl ProjectManager {
    pub fn validate_project_path(path: &str) -> Result<(), String> {
        let path = Path::new(path);
        
        if !path.exists() {
            return Err("Path does not exist".to_string());
        }
        
        if !path.is_dir() {
            return Err("Path is not a directory".to_string());
        }
        
        Ok(())
    }

    pub fn get_project_info(path: &str) -> Result<(String, Option<String>), String> {
        let path = Path::new(path);
        
        if !path.exists() {
            return Err("Path does not exist".to_string());
        }
        
        let name = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown")
            .to_string();
        
        // Try to detect project type
        let project_type = if path.join("package.json").exists() {
            Some("Node.js".to_string())
        } else if path.join("Cargo.toml").exists() {
            Some("Rust".to_string())
        } else if path.join("requirements.txt").exists() || path.join("pyproject.toml").exists() {
            Some("Python".to_string())
        } else if path.join("pom.xml").exists() {
            Some("Java/Maven".to_string())
        } else if path.join("go.mod").exists() {
            Some("Go".to_string())
        } else {
            None
        };
        
        Ok((name, project_type))
    }

    pub fn detect_project_type(path: &str) -> Option<String> {
        let path = Path::new(path);
        
        if path.join("package.json").exists() {
            Some("Node.js".to_string())
        } else if path.join("Cargo.toml").exists() {
            Some("Rust".to_string())
        } else if path.join("requirements.txt").exists() || path.join("pyproject.toml").exists() {
            Some("Python".to_string())
        } else if path.join("pom.xml").exists() {
            Some("Java/Maven".to_string())
        } else if path.join("go.mod").exists() {
            Some("Go".to_string())
        } else {
            None
        }
    }

    pub fn find_git_repository(project_path: &str) -> Option<String> {
        git::find_git_repo_path(project_path)
    }

    pub fn find_env_files(project_path: &str) -> Vec<String> {
        let path = Path::new(project_path);
        let mut env_files = Vec::new();
        
        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                let file_path = entry.path();
                if let Some(file_name) = file_path.file_name().and_then(|n| n.to_str()) {
                    if file_name.starts_with(".env") {
                        if let Ok(full_path) = file_path.canonicalize() {
                            if let Some(path_str) = full_path.to_str() {
                                env_files.push(path_str.to_string());
                            }
                        }
                    }
                }
            }
        }
        
        env_files
    }
}
