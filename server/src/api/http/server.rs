use actix_web::{dev::Server, middleware, App, HttpServer};
use diesel_async::{pooled_connection::deadpool::Pool, AsyncPgConnection};
use std::io;

use crate::data_layer::database_connection::pool::setup_pool;

use super::log::controller::insert_log;

pub struct AppState {
    pub pool: Pool<AsyncPgConnection>,
}

pub async fn config_actix_server() -> Result<Server, io::Error> {
    let pool = setup_pool().await;

    Ok(HttpServer::new(move || {
        App::new()
            .app_data(AppState { pool: pool.clone() })
			.service(insert_log)
            .wrap(middleware::Compress::default())
    })
    .bind("127.0.0.1:8080")?
    .run())
}
