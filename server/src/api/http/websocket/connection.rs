use crate::domain::logger::{LoggerService, LoggerServiceProvider};

use super::server_iml::{Disconnect, Server};
use actix::dev::ContextFutureSpawner;
use actix::ActorContext;
use actix::Message;
use actix::WrapFuture;
use actix::{Actor, Addr, AsyncContext, Handler, Running, StreamHandler};
use actix_web_actors::ws;
use derive_more::Deref;
use serde::Deserialize;
use serde_json::Value;
use std::time::{Duration, Instant};
use uuid::Uuid;
const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(10);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(60);

pub struct WsConnection {
    pub id: Uuid,
    pub hb: Instant,
    pub addr: Addr<Server>,
}

impl WsConnection {
    fn hb(&self, ctx: &mut ws::WebsocketContext<Self>) {
        // ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
        //     if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
        //         ctx.close(Some(ws::CloseReason {
        //             code: ws::CloseCode::Error,
        //             description: Some("Client heartbeat failed.".to_string()),
        //         }));

        //         ctx.stop();

        //         return;
        //     }

        //     ctx.ping(b"hi");
        // });
    }
}

#[derive(Debug, Deserialize)]
pub struct Payload {
    #[serde(rename = "type")]
    pub message_type: String,
    pub inner: Value,
}

#[derive(Message, Deref)]
#[rtype(result = "()")]
pub struct LogText(pub String);

impl Handler<LogText> for WsConnection {
    type Result = ();

    fn handle(&mut self, msg: LogText, ctx: &mut Self::Context) {
        ctx.text(msg.clone());
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsConnection {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => {
                self.hb = Instant::now();
                ctx.pong(&msg)
            }
            Ok(ws::Message::Pong(_)) => {
                self.hb = Instant::now();
            }
            Ok(ws::Message::Text(_)) => {}
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            Ok(ws::Message::Continuation(_)) => {
                ctx.stop();
            }
            Ok(ws::Message::Binary(bin)) => ctx.binary(bin),
            _ => (),
        }
    }
}

impl Actor for WsConnection {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
		println!("start");
        let recipient = ctx.address().recipient();
		let addr = self.addr.clone();
		let id = self.id;

        let future = async move {
            let listener = LoggerService::get_logs_stream().await;
			
            if let Ok(mut listener) = listener {
                loop {
                    while let Ok(Some(notification)) = listener.try_recv().await {
                        let strr = notification.payload().to_owned();

                        recipient.do_send(LogText(strr));
                    }
                }
            } else {
				addr.do_send(Disconnect(id));
            }
        };

        future.into_actor(self).spawn(ctx);

        self.hb(ctx);
    }

    fn stopping(&mut self, _: &mut Self::Context) -> Running {
		println!("end");
        self.addr.do_send(Disconnect(self.id));
        Running::Stop
    }
}
