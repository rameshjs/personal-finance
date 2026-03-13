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
        .plugin(tauri_plugin_dialog::init())
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
            commands::get_other_investments,
            commands::add_other_investment,
            commands::delete_other_investment,
            commands::sync_other_prices,
            commands::get_expense_categories,
            commands::add_expense_category,
            commands::delete_expense_category,
            commands::get_transactions,
            commands::add_transaction,
            commands::delete_transaction,
            commands::get_dashboard_report,
            commands::export_data,
            commands::import_data,
            commands::export_transactions_csv,
            commands::import_transactions_csv,
            commands::save_export_json,
            commands::save_export_csv,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
