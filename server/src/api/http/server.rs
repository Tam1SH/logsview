use actix::Actor;
use actix_web::{middleware, web, App, HttpServer, Responder};
use std::io;

use crate::{api::state::AppState, data_layer::database_connection::pool::setup_pool};

use super::{
    log::controller::{get_logs_by_range, get_logs_count, insert_log},
    middleware::global_error_handler::ErrorHandlerMiddleware,
    websocket::{
        controller::listen_logs,
        server_iml::{ConnectionsState, Server},
    },
};

pub async fn config_actix_server() -> Result<actix_web::dev::Server, io::Error> {
    let pools = setup_pool().await;

    let server = Server::default().start();

    Ok(HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(ConnectionsState {
                server: server.clone(),
            }))
            .app_data(web::Data::new(AppState {
                pools: pools.clone(),
            }))
            .wrap(middleware::Compress::default())
            .wrap(ErrorHandlerMiddleware)
            .service(
                web::scope("/api")
                    .service(insert_log)
                    .service(listen_logs)
					.service(get_logs_count)
					.service(get_logs_by_range)
            )
    })
    .bind("0.0.0.0:80")?
    .run())
}
