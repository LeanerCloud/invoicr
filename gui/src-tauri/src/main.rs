// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_default_invoices_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_default_invoices_path() -> String {
    // Return the user's Documents/invoices path
    if let Some(docs) = dirs::document_dir() {
        docs.join("invoices").to_string_lossy().to_string()
    } else if let Some(home) = dirs::home_dir() {
        home.join("invoices").to_string_lossy().to_string()
    } else {
        "./invoices".to_string()
    }
}
