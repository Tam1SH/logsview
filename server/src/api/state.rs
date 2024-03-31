use crate::data_layer::database_connection::pool::Pools;

pub struct AppState {
    pub pools: Pools,
}
