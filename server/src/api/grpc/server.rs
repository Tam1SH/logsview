use std::sync::Arc;

use tonic::{transport::Server, Request};

use crate::{api::state::AppState, data_layer::database_connection::pool::setup_pool};

use super::logs::{g::logs_service_server::LogsServiceServer, server::GRpcLoggerService};

pub trait AppStateImpl {
    fn app_state(&self) -> &AppState;
}

impl<T> AppStateImpl for Request<T> {
    fn app_state(&self) -> &AppState {
        self.extensions().get::<Arc<AppState>>().unwrap()
    }
}

pub async fn config_grpc_server() -> Result<(), tonic::transport::Error> {
    let pools = setup_pool().await;

    let state = AppState {
        pools: pools.clone(),
    };

    let state = Arc::new(state);

    let interceptor = {
        let state = Arc::clone(&state);

        move |mut req: Request<()>| {
            req.extensions_mut().insert(state.clone());
            Ok(req)
        }
    };

    Server::builder()
        .add_service(LogsServiceServer::with_interceptor(
            GRpcLoggerService,
            interceptor.clone(),
        ))
        .serve("[::]:2331".parse().unwrap())
        .await
}
