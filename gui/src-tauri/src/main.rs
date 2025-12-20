// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_default_invoices_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_default_invoices_path() -> String {
    // Return ~/.invoicr as the default data path
    if let Some(home) = dirs::home_dir() {
        home.join(".invoicr").to_string_lossy().to_string()
    } else {
        "./.invoicr".to_string()
    }
}
