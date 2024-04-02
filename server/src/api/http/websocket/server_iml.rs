use super::connection::WsConnection;
use actix::{Actor, Addr, Context, Handler, Message};
use derive_more::Deref;
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Default)]
pub struct Server {
    pub connections: HashMap<Uuid, Addr<WsConnection>>,
}

#[derive(Clone)]
pub struct ConnectionsState {
    pub server: Addr<Server>,
}

impl Actor for Server {
    type Context = Context<Self>;
}

#[derive(Message, Deref)]
#[rtype(result = "()")]
pub struct Disconnect(pub Uuid);

#[derive(Message)]
#[rtype(result = "()")]
pub struct Connect {
    pub id: Uuid,
    pub addr: Addr<WsConnection>,
}

impl Handler<Disconnect> for Server {
    type Result = ();
    fn handle(&mut self, msg: Disconnect, _: &mut Self::Context) {
        self.connections.remove(&msg.0);
    }
}

impl Handler<Connect> for Server {
    type Result = ();
    fn handle(&mut self, msg: Connect, _: &mut Self::Context) {
        self.connections.insert(msg.id, msg.addr);
    }
}
