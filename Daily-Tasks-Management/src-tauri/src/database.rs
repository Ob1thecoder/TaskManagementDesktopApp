use crate::model::{Task, TaskFormData};
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
                created_at TEXT NOT NULL
            )",
            [],
        )?;
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
             scheduled_start, completed, locked, category, reminder_enabled, reminder_minutes, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
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
            created_at,
        };

        Ok(task)
    }

    pub fn get_all_tasks(&self) -> Result<Vec<Task>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, priority, deadline, estimated_time, start_date, 
             scheduled_start, completed, locked, category, reminder_enabled, 
             reminder_minutes, created_at FROM tasks ORDER BY created_at DESC"
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
                created_at: row.get(12)?,
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
             reminder_minutes, created_at FROM tasks WHERE id = ?1"
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
                created_at: row.get(12)?,
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
             category = ?9, reminder_enabled = ?10, reminder_minutes = ?11 WHERE id = ?12",
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
     
}