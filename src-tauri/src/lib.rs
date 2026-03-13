mod commands;
mod db;
mod market;
mod models;

use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

use db::db_init;
use models::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db_dir = app.path().app_data_dir().expect("No app data dir");
            std::fs::create_dir_all(&db_dir).ok();
            let db_path = db_dir.join("personal_finance.db");
            let conn = Connection::open(&db_path).expect("Failed to open DB");
            db_init(&conn);
            app.manage(AppState { db: Mutex::new(conn) });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_investments,
            commands::add_investment,
            commands::delete_investment,
            commands::sync_prices,
            commands::search_mutual_funds,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
