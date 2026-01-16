use daily_tasks_management_lib::git;
use git2::Repository;
use std::fs;
use tempfile::TempDir;

fn setup_test_repo() -> (TempDir, String) {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let path = temp_dir.path();
    
    // Initialize a git repository
    let repo = Repository::init(path).expect("Failed to init repo");
    
    // Configure git user (required for commits)
    let mut config = repo.config().expect("Failed to get config");
    config.set_str("user.name", "Test User").ok();
    config.set_str("user.email", "test@example.com").ok();
    
    // Create a test file
    let test_file = path.join("test.txt");
    fs::write(&test_file, "test content").expect("Failed to write test file");
    
    // Stage and commit the file
    let mut index = repo.index().expect("Failed to get index");
    index.add_path(std::path::Path::new("test.txt")).expect("Failed to add file");
    index.write().expect("Failed to write index");
    let tree_id = index.write_tree().expect("Failed to write tree");
    let tree = repo.find_tree(tree_id).expect("Failed to find tree");
    
    let sig = repo.signature().expect("Failed to get signature");
    
    // Determine default branch name (try main first, then master)
    let branch_name = if repo.find_reference("refs/heads/main").is_ok() {
        "main"
    } else {
        "main" 
    };
    
    // Create initial commit on the branch
    let commit_oid = repo.commit(
        Some(&format!("refs/heads/{}", branch_name)),
        &sig,
        &sig,
        "Initial commit",
        &tree,
        &[],
    ).expect("Failed to create initial commit");
    
    // Ensure HEAD points to the branch
    repo.set_head(&format!("refs/heads/{}", branch_name))
        .expect("Failed to set HEAD");
    
    let repo_path = path.to_str().unwrap().to_string();
    (temp_dir, repo_path)
}

#[test]
fn test_is_git_repository() {
    let (_temp_dir, repo_path) = setup_test_repo();
    
    assert!(git::is_git_repository(&repo_path));
}

#[test]
fn test_is_not_git_repository() {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let path = temp_dir.path().to_str().unwrap();
    
    assert!(!git::is_git_repository(path));
}

#[test]
fn test_find_git_repo_path() {
    let (_temp_dir, repo_path) = setup_test_repo();
    
    // Create a subdirectory
    let subdir = std::path::Path::new(&repo_path).join("subdir");
    fs::create_dir_all(&subdir).expect("Failed to create subdir");
    
    // Should find git repo in parent
    let found = git::find_git_repo_path(subdir.to_str().unwrap());
    assert!(found.is_some());
    assert_eq!(found.unwrap(), repo_path);
}

#[test]
fn test_get_current_branch() {
    let (_temp_dir, repo_path) = setup_test_repo();
    
    let branch = git::get_current_branch(&repo_path)
        .expect("Failed to get current branch");
    
    // Default branch is usually "main" or "master"
    assert!(!branch.is_empty());
}

#[test]
fn test_get_uncommitted_changes() {
    let (_temp_dir, repo_path) = setup_test_repo();
    
    // Create a new file (uncommitted)
    let new_file = std::path::Path::new(&repo_path).join("new_file.txt");
    fs::write(&new_file, "new content").expect("Failed to write new file");
    
    let changes = git::get_uncommitted_changes(&repo_path)
        .expect("Failed to get uncommitted changes");
    
    assert!(changes.len() > 0);
    assert!(changes.iter().any(|f| f.contains("new_file.txt")));
}

#[test]
fn test_get_git_status() {
    let (_temp_dir, repo_path) = setup_test_repo();
    
    let status = git::get_git_status(&repo_path)
        .expect("Failed to get git status");
    
    assert_eq!(status.repo_path, repo_path);
    assert!(status.current_branch.is_some());
    // ahead/behind counts should be 0 for a new repo
    assert_eq!(status.ahead_count, 0);
    assert_eq!(status.behind_count, 0);
}

#[test]
fn test_get_ahead_behind() {
    let (_temp_dir, repo_path) = setup_test_repo();
    
    // For a new repo without remote, should return (0, 0)
    let (ahead, behind) = git::get_ahead_behind(&repo_path)
        .expect("Failed to get ahead/behind");
    
    assert_eq!(ahead, 0);
    assert_eq!(behind, 0);
}
