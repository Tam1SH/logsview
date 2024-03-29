#[macro_use]
extern crate dotenv_codegen;
pub mod api;
pub mod data_layer;
pub mod domain;
pub mod schema;
use tokio::join;

use api::{grpc::server::config_grpc_server, http::server::config_actix_server};

#[actix::main]
async fn main() -> std::io::Result<()> {
	
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
