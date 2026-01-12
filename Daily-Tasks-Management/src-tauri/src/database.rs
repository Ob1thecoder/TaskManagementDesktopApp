use crate::model::{Task, TaskFormData, Project, Service, GitStatus};
use rusqlite::{params, Connection, Result};
use chrono::Utc;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        // Create projects table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                path TEXT NOT NULL UNIQUE,
                project_type TEXT,
                description TEXT,
                last_accessed TEXT,
                created_at TEXT NOT NULL
            )",
            [],
        )?;

        // Create services table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                command TEXT NOT NULL,
                working_dir TEXT,
                project_id INTEGER,
                auto_start BOOLEAN DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY(project_id) REFERENCES projects(id)
            )",
            [],
        )?;

        // Create git_repos table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS git_repos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                repo_path TEXT NOT NULL,
                current_branch TEXT,
                last_checked TEXT,
                FOREIGN KEY(project_id) REFERENCES projects(id)
            )",
            [],
        )?;

        // Create tasks table (with project_id support)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                priority INTEGER NOT NULL,
                deadline TEXT NOT NULL,
                estimated_time INTEGER NOT NULL,
                start_date TEXT,
                scheduled_start TEXT,
                completed BOOLEAN NOT NULL DEFAULT 0,
                locked BOOLEAN NOT NULL DEFAULT 0,
                category TEXT,
                reminder_enabled BOOLEAN NOT NULL DEFAULT 0,
                reminder_minutes INTEGER NOT NULL DEFAULT 0,
                project_id INTEGER,
                created_at TEXT NOT NULL,
                FOREIGN KEY(project_id) REFERENCES projects(id)
            )",
            [],
        )?;

        // Migrate existing tasks table to add project_id if it doesn't exist
        // This is safe to run multiple times
        let _ = self.conn.execute(
            "ALTER TABLE tasks ADD COLUMN project_id INTEGER",
            [],
        );

        Ok(())
    }

    pub fn create_task(&self, form_data: TaskFormData) -> Result<Task> {
        let created_at = Utc::now().to_rfc3339();
        
        // Convert form data to proper types
        let estimated_hours: u32 = form_data.estimated_hours.parse().unwrap_or(0);
        let estimated_minutes: u32 = form_data.estimated_minutes.parse().unwrap_or(0);
        let total_estimated_time = estimated_hours * 60 + estimated_minutes;
        let priority: u8 = form_data.priority.parse().unwrap_or(3);
        
        let start_date = if form_data.start_date.is_empty() { None } else { Some(form_data.start_date.clone()) };

        self.conn.execute(
            "INSERT INTO tasks (title, priority, deadline, estimated_time, start_date, 
             scheduled_start, completed, locked, category, reminder_enabled, reminder_minutes, project_id, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                form_data.title,
                priority,
                form_data.deadline,
                total_estimated_time,
                start_date,
                None::<String>, // scheduled_start
                false, // completed
                false, // locked
                None::<String>, // category
                false, // reminder_enabled
                0u32, // reminder_minutes
                None::<u32>, // project_id
                created_at
            ],
        )?;

        let task_id = self.conn.last_insert_rowid() as u32;
        
        // Return the created task
        let task = Task {
            id: task_id,
            title: form_data.title,
            priority,
            deadline: form_data.deadline,
            estimated_time: total_estimated_time,
            start_date: if form_data.start_date.is_empty() { None } else { Some(form_data.start_date) },
            scheduled_start: None,
            completed: false,
            locked: false,
            category: None,
            reminder_enabled: false,
            reminder_minutes: 0,
            project_id: None,
            created_at,
        };

        Ok(task)
    }

    pub fn get_all_tasks(&self) -> Result<Vec<Task>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, priority, deadline, estimated_time, start_date, 
             scheduled_start, completed, locked, category, reminder_enabled, 
             reminder_minutes, project_id, created_at FROM tasks ORDER BY created_at DESC"
        )?;

        let task_iter = stmt.query_map([], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                priority: row.get(2)?,
                deadline: row.get(3)?,
                estimated_time: row.get(4)?,
                start_date: row.get(5)?,
                scheduled_start: row.get(6)?,
                completed: row.get(7)?,
                locked: row.get(8)?,
                category: row.get(9)?,
                reminder_enabled: row.get(10)?,
                reminder_minutes: row.get(11)?,
                project_id: row.get(12)?,
                created_at: row.get(13)?,
            })
        })?;

        let mut tasks = Vec::new();
        for task in task_iter {
            tasks.push(task?);
        }
        Ok(tasks)
    }

    pub fn get_task_by_id(&self, id: u32) -> Result<Option<Task>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, priority, deadline, estimated_time, start_date, 
             scheduled_start, completed, locked, category, reminder_enabled, 
             reminder_minutes, project_id, created_at FROM tasks WHERE id = ?1"
        )?;

        let mut task_iter = stmt.query_map([id], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                priority: row.get(2)?,
                deadline: row.get(3)?,
                estimated_time: row.get(4)?,
                start_date: row.get(5)?,
                scheduled_start: row.get(6)?,
                completed: row.get(7)?,
                locked: row.get(8)?,
                category: row.get(9)?,
                reminder_enabled: row.get(10)?,
                reminder_minutes: row.get(11)?,
                project_id: row.get(12)?,
                created_at: row.get(13)?,
            })
        })?;

        match task_iter.next() {
            Some(task) => Ok(Some(task?)),
            None => Ok(None),
        }
    }

    pub fn update_task(&self, task: &Task) -> Result<()> {
        self.conn.execute(
            "UPDATE tasks SET title = ?1, priority = ?2, deadline = ?3, estimated_time = ?4,
             start_date = ?5, scheduled_start = ?6, completed = ?7, locked = ?8, 
             category = ?9, reminder_enabled = ?10, reminder_minutes = ?11, project_id = ?12 WHERE id = ?13",
            params![
                task.title,
                task.priority,
                task.deadline,
                task.estimated_time,
                task.start_date,
                task.scheduled_start,
                task.completed,
                task.locked,
                task.category,
                task.reminder_enabled,
                task.reminder_minutes,
                task.project_id,
                task.id
            ],
        )?;
        Ok(())
    }

    pub fn delete_task(&self, id: u32) -> Result<()> {
        self.conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn mark_task_completed(&self, id: u32, completed: bool) -> Result<()> {
        self.conn.execute(
            "UPDATE tasks SET completed = ?1 WHERE id = ?2",
            params![completed, id],
        )?;
        Ok(())
    }

    // Project operations
    pub fn create_project(&self, name: String, path: String, project_type: Option<String>, description: Option<String>) -> Result<Project> {
        let created_at = Utc::now().to_rfc3339();
        
        self.conn.execute(
            "INSERT INTO projects (name, path, project_type, description, last_accessed, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                name,
                path,
                project_type,
                description,
                created_at,
                created_at
            ],
        )?;

        let project_id = self.conn.last_insert_rowid() as u32;
        let created_at_clone = created_at.clone();
        
        Ok(Project {
            id: project_id,
            name: self.conn.query_row(
                "SELECT name FROM projects WHERE id = ?1",
                params![project_id],
                |row| row.get(0)
            )?,
            path: self.conn.query_row(
                "SELECT path FROM projects WHERE id = ?1",
                params![project_id],
                |row| row.get(0)
            )?,
            project_type: self.conn.query_row(
                "SELECT project_type FROM projects WHERE id = ?1",
                params![project_id],
                |row| row.get(0)
            ).ok(),
            description: self.conn.query_row(
                "SELECT description FROM projects WHERE id = ?1",
                params![project_id],
                |row| row.get(0)
            ).ok(),
            last_accessed: Some(created_at),
            created_at: created_at_clone,
        })
    }

    pub fn get_all_projects(&self) -> Result<Vec<Project>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, path, project_type, description, last_accessed, created_at 
             FROM projects ORDER BY last_accessed DESC, created_at DESC"
        )?;

        let project_iter = stmt.query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                project_type: row.get(3)?,
                description: row.get(4)?,
                last_accessed: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        let mut projects = Vec::new();
        for project in project_iter {
            projects.push(project?);
        }
        Ok(projects)
    }

    pub fn get_project_by_id(&self, id: u32) -> Result<Option<Project>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, path, project_type, description, last_accessed, created_at 
             FROM projects WHERE id = ?1"
        )?;

        let mut project_iter = stmt.query_map([id], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                project_type: row.get(3)?,
                description: row.get(4)?,
                last_accessed: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        match project_iter.next() {
            Some(project) => Ok(Some(project?)),
            None => Ok(None),
        }
    }

    pub fn update_project(&self, project: &Project) -> Result<()> {
        let last_accessed = Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE projects SET name = ?1, path = ?2, project_type = ?3, description = ?4, last_accessed = ?5 WHERE id = ?6",
            params![
                project.name,
                project.path,
                project.project_type,
                project.description,
                last_accessed,
                project.id
            ],
        )?;
        Ok(())
    }

    pub fn delete_project(&self, id: u32) -> Result<()> {
        self.conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Service operations
    pub fn create_service(&self, name: String, command: String, working_dir: Option<String>, project_id: Option<u32>, auto_start: bool) -> Result<Service> {
        let created_at = Utc::now().to_rfc3339();
        
        self.conn.execute(
            "INSERT INTO services (name, command, working_dir, project_id, auto_start, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                name,
                command,
                working_dir,
                project_id,
                auto_start,
                created_at
            ],
        )?;

        let service_id = self.conn.last_insert_rowid() as u32;
        
        Ok(Service {
            id: service_id,
            name,
            command,
            working_dir,
            project_id,
            auto_start,
            created_at,
        })
    }

    pub fn get_all_services(&self) -> Result<Vec<Service>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, command, working_dir, project_id, auto_start, created_at 
             FROM services ORDER BY created_at DESC"
        )?;

        let service_iter = stmt.query_map([], |row| {
            Ok(Service {
                id: row.get(0)?,
                name: row.get(1)?,
                command: row.get(2)?,
                working_dir: row.get(3)?,
                project_id: row.get(4)?,
                auto_start: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        let mut services = Vec::new();
        for service in service_iter {
            services.push(service?);
        }
        Ok(services)
    }

    pub fn get_service_by_id(&self, id: u32) -> Result<Option<Service>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, command, working_dir, project_id, auto_start, created_at 
             FROM services WHERE id = ?1"
        )?;

        let mut service_iter = stmt.query_map([id], |row| {
            Ok(Service {
                id: row.get(0)?,
                name: row.get(1)?,
                command: row.get(2)?,
                working_dir: row.get(3)?,
                project_id: row.get(4)?,
                auto_start: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        match service_iter.next() {
            Some(service) => Ok(Some(service?)),
            None => Ok(None),
        }
    }

    pub fn update_service(&self, service: &Service) -> Result<()> {
        self.conn.execute(
            "UPDATE services SET name = ?1, command = ?2, working_dir = ?3, project_id = ?4, auto_start = ?5 WHERE id = ?6",
            params![
                service.name,
                service.command,
                service.working_dir,
                service.project_id,
                service.auto_start,
                service.id
            ],
        )?;
        Ok(())
    }

    pub fn delete_service(&self, id: u32) -> Result<()> {
        self.conn.execute("DELETE FROM services WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Git repo operations
    pub fn create_git_repo(&self, project_id: u32, repo_path: String) -> Result<u32> {
        let last_checked = Utc::now().to_rfc3339();
        
        self.conn.execute(
            "INSERT INTO git_repos (project_id, repo_path, last_checked)
             VALUES (?1, ?2, ?3)",
            params![project_id, repo_path, last_checked],
        )?;

        Ok(self.conn.last_insert_rowid() as u32)
    }

    pub fn get_git_repo_by_project_id(&self, project_id: u32) -> Result<Option<GitStatus>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, repo_path, current_branch, last_checked 
             FROM git_repos WHERE project_id = ?1"
        )?;

        let mut repo_iter = stmt.query_map([project_id], |row| {
            Ok(GitStatus {
                id: row.get(0)?,
                project_id: row.get(1)?,
                repo_path: row.get(2)?,
                current_branch: row.get(3)?,
                uncommitted_changes: Vec::new(), // Will be populated by git module
                ahead_count: 0, // Will be populated by git module
                behind_count: 0, // Will be populated by git module
                last_checked: row.get(4)?,
            })
        })?;

        match repo_iter.next() {
            Some(repo) => Ok(Some(repo?)),
            None => Ok(None),
        }
    }

    pub fn update_git_repo(&self, git_status: &GitStatus) -> Result<()> {
        let last_checked = Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE git_repos SET current_branch = ?1, last_checked = ?2 WHERE id = ?3",
            params![git_status.current_branch, last_checked, git_status.id],
        )?;
        Ok(())
    }

    pub fn delete_git_repo(&self, id: u32) -> Result<()> {
        self.conn.execute("DELETE FROM git_repos WHERE id = ?1", params![id])?;
        Ok(())
    }
}