use anyhow::Result;
use chrono::Utc;
use diesel::insert_into;
use diesel_async::pooled_connection::deadpool::Pool;
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use uuid::Uuid;

use crate::{
    data_layer::model::{dto::log::LogDto, log::Log},
    schema::logs::dsl::logs,
};

#[allow(async_fn_in_trait)]
pub trait LoggerServiceProvider {
    async fn insert_log(&self, log: LogDto) -> Result<()>;
}

pub struct LoggerService<'a> {
    conn: &'a Pool<AsyncPgConnection>,
    request_id: Uuid,
}

impl<'a> LoggerService<'a> {
    pub fn new(conn: &'a Pool<AsyncPgConnection>, request_id: Uuid) -> Self {
        Self { conn, request_id }
    }
}

impl LoggerServiceProvider for LoggerService<'_> {
    async fn insert_log(&self, log: LogDto) -> Result<()> {
        let conn = &mut self.conn.get().await?;

        let LogDto {
            additional_data,
            controller_name,
            level,
            message,
            request_id,
            service_name,
            title,
        } = log;

        let log = Log {
            additional_data,
            controller_name,
            level,
            message,
            request_id: request_id.unwrap_or(self.request_id),
            service_name,
            time: Utc::now(),
            title,
        };

        insert_into(logs).values(&log).execute(conn).await?;

        Ok(())
    }
}
