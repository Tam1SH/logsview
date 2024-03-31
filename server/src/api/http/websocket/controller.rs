use std::time::Instant;

use actix_web::{
    get,
    http::StatusCode,
    web::{self, Data},
    HttpRequest, HttpResponse,
};
use actix_web_actors::ws;
use anyhow::anyhow;
use uuid::Uuid;

use crate::api::http::{
        api_error::ApiError,
        websocket::{
            connection::WsConnection,
            server_iml::{Connect, ConnectionsState},
        },
    };

#[get("/listenLogs/{uuid}")]
async fn listen_logs(
    req: HttpRequest,
    stream: web::Payload,
    uuid: web::Path<String>,
    data: Data<ConnectionsState>,
) -> Result<HttpResponse, ApiError> {
	
    let uuid = Uuid::parse_str(&uuid).map_err(|e| anyhow!(e))?;

    let server = &data.server;

    let (addr, resp) = match ws::WsResponseBuilder::new(
        WsConnection {
            id: uuid,
            hb: Instant::now(),
            addr: server.clone(),
        },
        &req,
        stream,
    )
    .start_with_addr()
    {
        Ok((addr, resp)) => (addr, resp),
        Err(err) => {
            return Err(ApiError {
                http_code: StatusCode::INTERNAL_SERVER_ERROR,
                message: err.to_string(),
            });
        }
    };

    server.do_send(Connect { id: uuid, addr });

    Ok(resp)
}
