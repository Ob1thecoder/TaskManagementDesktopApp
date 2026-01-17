use rusqlite::{Connection, Result};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct TableInfo {
    pub name: String,
    pub row_count: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<String>>,
    pub row_count: usize,
}

pub fn list_tables(db_path: &str) -> Result<Vec<TableInfo>> {
    let conn = Connection::open(db_path)?;
    
    let mut stmt = conn.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )?;
    
    let table_iter = stmt.query_map([], |row| {
        let name: String = row.get(0)?;
        Ok(name)
    })?;
    
    let mut tables = Vec::new();
    for table in table_iter {
        let table_name = table?;
        
        // Get row count
        let count: u32 = conn.query_row(
            &format!("SELECT COUNT(*) FROM \"{}\"", table_name),
            [],
            |row| row.get(0)
        ).unwrap_or(0);
        
        tables.push(TableInfo {
            name: table_name,
            row_count: count,
        });
    }
    
    Ok(tables)
}

pub fn get_table_data(db_path: &str, table: &str, limit: u32, offset: u32) -> Result<QueryResult> {
    let conn = Connection::open(db_path)?;
    
    // Get column names
    let mut stmt = conn.prepare(&format!("SELECT * FROM \"{}\" LIMIT 1", table))?;
    let columns: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
    
    // Get data with limit and offset
    let query = format!("SELECT * FROM \"{}\" LIMIT ? OFFSET ?", table);
    let mut stmt = conn.prepare(&query)?;
    
    let rows_iter = stmt.query_map([limit, offset], |row| {
        let mut values = Vec::new();
        for i in 0..columns.len() {
            let value: String = row.get(i).unwrap_or_else(|_| "NULL".to_string());
            values.push(value);
        }
        Ok(values)
    })?;
    
    let mut rows = Vec::new();
    for row in rows_iter {
        rows.push(row?);
    }
    
    let row_count = rows.len();
    
    Ok(QueryResult {
        columns,
        rows,
        row_count,
    })
}

pub fn execute_query(db_path: &str, query: &str) -> Result<QueryResult> {
    // Safety check: only allow SELECT queries
    let query_upper = query.trim().to_uppercase();
    if !query_upper.starts_with("SELECT") {
        return Err(rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
            Some("Only SELECT queries are allowed for safety".to_string())
        ));
    }
    
    // Additional safety: block dangerous keywords
    let dangerous_keywords = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE", "TRUNCATE"];
    for keyword in &dangerous_keywords {
        if query_upper.contains(keyword) {
            return Err(rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_MISUSE),
                Some(format!("Query contains forbidden keyword: {}", keyword))
            ));
        }
    }
    
    let conn = Connection::open(db_path)?;
    let mut stmt = conn.prepare(query)?;
    
    // Get column names
    let columns: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
    
    // Execute query
    let rows_iter = stmt.query_map([], |row| {
        let mut values = Vec::new();
        for i in 0..columns.len() {
            let value: String = row.get(i).unwrap_or_else(|_| "NULL".to_string());
            values.push(value);
        }
        Ok(values)
    })?;
    
    let mut rows = Vec::new();
    for row in rows_iter {
        rows.push(row?);
    }
    
    let row_count = rows.len();
    
    Ok(QueryResult {
        columns,
        rows,
        row_count,
    })
}
