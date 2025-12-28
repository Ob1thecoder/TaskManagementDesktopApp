use crate::model::{Task, TaskFormData};

pun fn optimize_task_schedule(tasks: Vec<Task>) -> Vec<Task> {
    // Simple optimization: sort tasks by priority (ascending) and deadline (earliest first)
    let mut optimized_tasks = tasks;
    optimized_tasks.sort_by(|a, b| {
        a.priority.cmp(&b.priority)
            .then_with(|| a.deadline.cmp(&b.deadline))
    });
    optimized_tasks
}