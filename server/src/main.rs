#[macro_use]
extern crate dotenv_codegen;
pub mod api;
pub mod data_layer;
pub mod domain;
pub mod schema;
use std::env;

use tokio::join;

use api::{grpc::server::config_grpc_server, http::{schema::openapi::openapi, server::config_actix_server}};

#[actix::main]
async fn main() -> std::io::Result<()> {

    let args: Vec<String> = env::args().collect();
	
	if !args.is_empty() && args.iter().any(|arg| *arg == *"gen") {
        let _ = openapi();
        return Ok(());
    }

    let grpc = async { config_grpc_server().await };

    let http = async {
        config_actix_server()
            .await
            .expect("can't start http server")
            .await
    };

    let _ = join!(http, grpc);

    Ok(())
}
