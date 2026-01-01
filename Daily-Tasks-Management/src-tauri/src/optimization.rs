use crate::model::Task;
use chrono::{DateTime, Duration, NaiveDateTime, Utc, Weekday, Datelike};

pub fn optimize_task_schedule(tasks: Vec<Task>) -> Vec<Task> {
    let mut optimized_tasks = tasks;
    let current_time = Utc::now();
    
    
    optimized_tasks.sort_by(|a, b| {
        b.priority.cmp(&a.priority)
            .then_with(|| a.deadline.cmp(&b.deadline))
    });
    
    for task in &mut optimized_tasks {
       
        if task.completed  {
            continue;
        }
        
        // Parse deadline
        if let Ok(deadline) = parse_datetime(&task.deadline) {
            
            let buffer_hours = match task.priority {
                5 => 24,  
                4 => 48,  
                3 => 72,  
                _ => 96,  
            };
            
            // Calculate required time including buffer
            let total_minutes = task.estimated_time + (buffer_hours * 60);
            let required_duration = Duration::minutes(total_minutes as i64);
            
            // Calculate ideal start time 
            let ideal_start = match task.priority {
                5 | 4 | 3 => current_time + required_duration / task.priority as i32,
                _ => deadline - required_duration , 
            };
            
            // Calculate start time 
            let start_time = if ideal_start < current_time {
                current_time + Duration::hours(1) 
            } else {
                ideal_start
            };
            
            // No weekend adjustment - allow weekend work as requested
            let adjusted_start = start_time;
            
            // Format and assign the scheduled start time
            task.scheduled_start = Some(adjusted_start.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string());
        }
    }
    
    optimized_tasks
}

fn parse_datetime(date_str: &str) -> Result<DateTime<Utc>, chrono::ParseError> {
    // parsing different datetime formats
    if let Ok(dt) = DateTime::parse_from_rfc3339(date_str) {
        return Ok(dt.with_timezone(&Utc));
    }
    
    // Try parsing as naive datetime and assume UTC
    if let Ok(naive_dt) = NaiveDateTime::parse_from_str(date_str, "%Y-%m-%dT%H:%M:%S") {
        return Ok(DateTime::from_naive_utc_and_offset(naive_dt, Utc));
    }
    
    // Try parsing date only and set time to end of day
    if let Ok(naive_date) = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
        let naive_dt = naive_date.and_hms_opt(23, 59, 59).unwrap();
        return Ok(DateTime::from_naive_utc_and_offset(naive_dt, Utc));
    }
    
    // If all parsing attempts fail, create a generic parse error
    NaiveDateTime::parse_from_str("invalid", "%Y-%m-%d").map(|_| DateTime::from_naive_utc_and_offset(NaiveDateTime::MIN, Utc)).map_err(|e| e)
}


