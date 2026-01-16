use daily_tasks_management_lib::services::ServiceManager;
use daily_tasks_management_lib::model::{Service, LocalService};
use std::time::Duration;
use tokio::time::sleep;

#[tokio::test]
async fn test_service_manager_start_stop() {
    let manager = ServiceManager::new();
    
    // Create a test service
    let local_service = LocalService {
        id: 1,
        name: "Test Service".to_string(),
        command: "sleep 2".to_string(),
        working_dir: None,
    };
    
    // Start service
    let pid = manager.start_service(&local_service).await
        .expect("Failed to start service");
    
    assert!(pid > 0);
    
    // Check if running
    let is_running = manager.is_service_running(local_service.id).await;
    assert!(is_running);
    
    // Wait a bit
    sleep(Duration::from_millis(100)).await;
    
    // Stop service
    manager.stop_service(local_service.id).await
        .expect("Failed to stop service");
    
    // Wait for process to terminate
    sleep(Duration::from_millis(200)).await;
    
    // Should not be running anymore
    let still_running = manager.is_service_running(local_service.id).await;
    assert!(!still_running);
}

#[tokio::test]
async fn test_service_manager_multiple_services() {
    let manager = ServiceManager::new();
    
    let service1 = LocalService {
        id: 1,
        name: "Service 1".to_string(),
        command: "sleep 1".to_string(),
        working_dir: None,
    };
    
    let service2 = LocalService {
        id: 2,
        name: "Service 2".to_string(),
        command: "sleep 1".to_string(),
        working_dir: None,
    };
    
    // Start both services
    let pid1 = manager.start_service(&service1).await
        .expect("Failed to start service 1");
    let pid2 = manager.start_service(&service2).await
        .expect("Failed to start service 2");
    
    assert_ne!(pid1, pid2);
    
    // Both should be running
    assert!(manager.is_service_running(service1.id).await);
    assert!(manager.is_service_running(service2.id).await);
    
    // Stop one
    manager.stop_service(service1.id).await
        .expect("Failed to stop service 1");
    
    sleep(Duration::from_millis(200)).await;
    
    // First should be stopped, second still running
    assert!(!manager.is_service_running(service1.id).await);
    // Service 2 might have finished by now, so we don't assert it's running
    
    // Clean up
    let _ = manager.stop_service(service2.id).await;
}

#[tokio::test]
async fn test_service_manager_stop_nonexistent() {
    let manager = ServiceManager::new();
    
    // Try to stop a service that doesn't exist
    let result = manager.stop_service(999).await;
    
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("not found"));
}

#[tokio::test]
async fn test_service_manager_start_service_by_id() {
    let manager = ServiceManager::new();
    
    let service = Service {
        id: 1,
        name: "Test Service".to_string(),
        command: "sleep 1".to_string(),
        working_dir: None,
        project_id: None,
        auto_start: false,
        created_at: "2024-01-01T00:00:00Z".to_string(),
    };
    
    let pid = manager.start_service_by_id(service.id, &service).await
        .expect("Failed to start service");
    
    assert!(pid > 0);
    
    // Clean up
    let _ = manager.stop_service(service.id).await;
}
