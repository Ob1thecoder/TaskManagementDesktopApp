use crate::model::GitStatus;
use git2::{Repository, StatusOptions};
use std::path::Path;
use chrono::Utc;

pub fn get_git_status(repo_path: &str) -> Result<GitStatus, String> {
    let repo = Repository::open(repo_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;

    // Get current branch
    let head = repo.head()
        .map_err(|e| format!("Failed to get HEAD: {}", e))?;
    let current_branch = head.shorthand().map(|s| s.to_string());

    // Get uncommitted changes
    let mut opts = StatusOptions::new();
    opts.include_untracked(true);
    opts.include_ignored(false);
    
    let statuses = repo.statuses(Some(&mut opts))
        .map_err(|e| format!("Failed to get status: {}", e))?;
    
    let mut uncommitted_changes = Vec::new();
    for entry in statuses.iter() {
        if let Some(path) = entry.path() {
            uncommitted_changes.push(path.to_string());
        }
    }

    // Get ahead/behind counts
    let (ahead_count, behind_count) = get_ahead_behind_from_repo(&repo)?;

    Ok(GitStatus {
        id: 0, // Will be set by caller
        project_id: 0, // Will be set by caller
        repo_path: repo_path.to_string(),
        current_branch,
        uncommitted_changes,
        ahead_count,
        behind_count,
        last_checked: Some(Utc::now().to_rfc3339()),
    })
}


pub fn get_current_branch(repo_path: &str) -> Result<String, String> {
    let repo = Repository::open(repo_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;
    
    let head = repo.head()
        .map_err(|e| format!("Failed to get HEAD: {}", e))?;
    
    head.shorthand()
        .map(|s| s.to_string())
        .ok_or_else(|| "No branch name found".to_string())
}

pub fn get_uncommitted_changes(repo_path: &str) -> Result<Vec<String>, String> {
    let repo = Repository::open(repo_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;

    let mut opts = StatusOptions::new();
    opts.include_untracked(true);
    opts.include_ignored(false);
    
    let statuses = repo.statuses(Some(&mut opts))
        .map_err(|e| format!("Failed to get status: {}", e))?;
    
    let mut changes = Vec::new();
    for entry in statuses.iter() {
        if let Some(path) = entry.path() {
            changes.push(path.to_string());
        }
    }
    
    Ok(changes)
}

pub fn get_ahead_behind(repo_path: &str) -> Result<(u32, u32), String> {
    let repo = Repository::open(repo_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;
    get_ahead_behind_from_repo(&repo)
}

fn get_ahead_behind_from_repo(repo: &Repository) -> Result<(u32, u32), String> {
    let head = repo.head()
        .map_err(|e| format!("Failed to get HEAD: {}", e))?;
    
    let head_oid = head.target()
        .ok_or_else(|| "HEAD has no target".to_string())?;
    
    // Try to find upstream branch
    let branch_name = head.shorthand()
        .ok_or_else(|| "No branch name found".to_string())?;
    
    // Try common upstream names
    let upstream_names = [
        format!("origin/{}", branch_name),
        format!("upstream/{}", branch_name),
    ];
    
    for upstream_name in &upstream_names {
        if let Ok(upstream_ref) = repo.find_reference(&format!("refs/remotes/{}", upstream_name)) {
            if let Some(upstream_oid) = upstream_ref.target() {
                let (ahead, behind) = repo.graph_ahead_behind(head_oid, upstream_oid)
                    .map_err(|e| format!("Failed to compare branches: {}", e))?;
                return Ok((ahead as u32, behind as u32));
            }
        }
    }
    
    // No upstream found, return zeros
    Ok((0, 0))
}

pub fn is_git_repository(path: &str) -> bool {
    Path::new(path).join(".git").exists() || Repository::open(path).is_ok()
}

pub fn find_git_repo_path(project_path: &str) -> Option<String> {
    let mut current_path = Path::new(project_path);
    
    loop {
        let git_path = current_path.join(".git");
        if git_path.exists() {
            return Some(current_path.to_string_lossy().to_string());
        }
        
        if let Some(parent) = current_path.parent() {
            current_path = parent;
        } else {
            break;
        }
    }
    
    None
}
