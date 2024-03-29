use actix_web::{dev::Server, middleware, App, HttpServer};
use std::io;

use crate::{api::state::AppState, data_layer::database_connection::pool::setup_pool};

use super::log::controller::insert_log;


pub async fn config_actix_server() -> Result<Server, io::Error> {
    let pool = setup_pool().await;

    Ok(HttpServer::new(move || {
        App::new()
            .app_data(AppState { pool: pool.clone() })
			.service(insert_log)
            .wrap(middleware::Compress::default())
    })
    .bind("[::]:80")?
    .run())
}
