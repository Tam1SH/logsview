#[macro_use]
extern crate dotenv_codegen;
pub mod api;
pub mod data_layer;
pub mod domain;
pub mod schema;
use std::env;
use diesel::{pg::Pg, Connection};
use diesel_migrations::MigrationHarness;
use data_layer::database_connection::pool::setup_pool;
use diesel_migrations::{embed_migrations, EmbeddedMigrations};
use tokio::join;
use diesel::PgConnection;

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
	
	let _ = run_diesel_migrations();

    let _ = join!(http, grpc);

    Ok(())
}

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations/2024-03-28-113348_log");

fn run_diesel_migrations() -> anyhow::Result<()> {

	let conn = &mut PgConnection::establish(dotenv!("DATABASE_URL"))?;
	let _ = conn.run_pending_migrations(MIGRATIONS);
	
	
    Ok(())
}
