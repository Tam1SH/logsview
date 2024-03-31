use anyhow::Result;
use chrono::Utc;
use diesel::{insert_into, QueryDsl};
use diesel_async::RunQueryDsl;
use sqlx::postgres::PgListener;
use uuid::Uuid;

use crate::data_layer::database_connection::pool::Pools;
use crate::{
    data_layer::model::{dto::log::LogDto, log::Log},
    schema::logs::dsl::logs,
};

#[allow(async_fn_in_trait)]
pub trait LoggerServiceProvider {
    async fn insert_log(&self, log: LogDto) -> Result<()>;

	async fn get_logs_count(&self) -> Result<usize>;

    async fn get_logs_stream() -> Result<PgListener>;
}

pub struct LoggerService<'a> {
    pools: &'a Pools,
    request_id: Uuid,
}

impl<'a> LoggerService<'a> {
    pub fn new(pools: &'a Pools, request_id: Uuid) -> Self {
        Self { pools, request_id }
    }
}



impl LoggerServiceProvider for LoggerService<'_> {

	async fn get_logs_count(&self) -> Result<usize> {
		
        let conn = &mut self.pools.diesel.get().await?;

		let count = logs.count().execute(conn).await?;

		Ok(count)

	}

    async fn get_logs_stream() -> Result<PgListener> {
        let mut listener = PgListener::connect(dotenv!("DATABASE_URL")).await?;
        listener.listen_all(["logs"]).await?;
        Ok(listener)
    }

    async fn insert_log(&self, log: LogDto) -> Result<()> {
        let conn = &mut self.pools.diesel.get().await?;

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
