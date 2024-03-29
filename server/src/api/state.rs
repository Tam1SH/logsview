use diesel_async::{pooled_connection::deadpool::Pool, AsyncPgConnection};

pub struct AppState {
    pub pool: Pool<AsyncPgConnection>,
}