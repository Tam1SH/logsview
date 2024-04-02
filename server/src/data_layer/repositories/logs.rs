use anyhow::Result;
use chrono::{DateTime, TimeZone, Utc};
use diesel::{insert_into, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;
use std::ops::Range;

use typed_builder::TypedBuilder;
use crate::{data_layer::{database_connection::pool::Pools, model::log::{Log, Loglevel}}, schema::logs::{dsl::logs, time}};

#[derive(TypedBuilder)]
pub struct Filters {
    #[builder(default, setter(strip_option))]
    pub level: Option<Vec<Loglevel>>,
    #[builder(default, setter(strip_option))]
    pub title: Option<Vec<String>>,
    #[builder(default, setter(strip_option))]
    pub request_id: Option<Vec<Uuid>>,
    #[builder(default, setter(strip_option))]
    pub timestamp: Option<(DateTime<Utc>, DateTime<Utc>)>,
    #[builder(default, setter(strip_option))]
    pub service_name: Option<Vec<String>>,
    #[builder(default, setter(strip_option))]
    pub range: Option<(i64, i64)>,
}

pub struct LogsRepository<'a> {
    pools: &'a Pools,
}

impl<'a> LogsRepository<'a> {

	pub fn new(pools: &'a Pools) -> Self {
		Self { pools }
	}

}

#[allow(async_fn_in_trait)]
pub trait LogsRepositoryProvider {
    async fn get_logs_count_by_filters(&self, filters: Filters) -> Result<i64>;

    async fn get_logs_by_filters(&self, filters: Filters) -> Result<Vec<Log>>;

    async fn get_logs_count(&self) -> Result<i64>;

    async fn get_logs_by_range(&self, range: Range<i64>) -> Result<Vec<Log>>;

    async fn clear_logs_older_than(&self, date: DateTime<Utc>) -> Result<()>;

    async fn insert_log(&self, log: Log) -> Result<()>;
}

impl LogsRepositoryProvider for LogsRepository<'_> {

    async fn get_logs_by_filters(&self, filters: Filters) -> Result<Vec<Log>> {

		let levels = filters
			.level
			.unwrap_or_default()
			.iter()
			.map(|level| level.to_string())
			.collect::<Vec<_>>();

        let titles = filters.title.unwrap_or_default();

        let (start, end) = match filters.timestamp {
            Some((start, end)) => (start, end),
            None => (
                chrono::Utc.with_ymd_and_hms(2000, 11, 24, 0, 0, 0).unwrap(),
                chrono::Utc.with_ymd_and_hms(2100, 12, 31, 0, 0, 0).unwrap(),
            ),
        };

		let (range_start, range_end) = match filters.range {
			Some((start, end)) => (start, end),
			None => (0, i64::MAX),
		};

        let service_names = filters.service_name.unwrap_or_default();

        let request_ids = filters.request_id.unwrap_or_default();

        let logs_ = sqlx::query_as::<_, Log>(
            r#"
        	SELECT * FROM logs
        	WHERE ((level = ANY($1)) OR cardinality($1) = 0)
        	AND ((title = ANY($2)) OR cardinality($2) = 0)
        	AND (timestamp BETWEEN $3 AND $4)
        	AND ((request_id = ANY($5)) OR cardinality($5) = 0)
        	AND ((service_name = ANY($6)) OR cardinality($6) = 0)
			ORDER BY time DESC
			LIMIT $7 OFFSET $8
        "#)
			.bind(levels)
			.bind(titles)
			.bind(start)
			.bind(end)
			.bind(request_ids)
			.bind(service_names)
			.bind(range_end - range_start)
			.bind(range_start)
			.fetch_all(&self.pools.sqlx)
			.await?;

        Ok(logs_)

    }

    async fn get_logs_count_by_filters(&self, filters: Filters) -> Result<i64> {

		let levels = filters
			.level
			.unwrap_or_default()
			.iter()
			.map(|level| level.to_string())
			.collect::<Vec<_>>();

        let titles: Vec<String> = filters.title.unwrap_or_default();

        let (start, end) = match filters.timestamp {
            Some((start, end)) => (start, end),
            None => (
                chrono::Utc.with_ymd_and_hms(2000, 11, 24, 0, 0, 0).unwrap(),
                chrono::Utc.with_ymd_and_hms(2100, 12, 31, 0, 0, 0).unwrap(),
            ),
        };

        let service_names: Vec<String> = filters.service_name.unwrap_or_default();

        let request_ids = filters.request_id.unwrap_or_default();

		let logs_ = sqlx::query_scalar(
            r#"
			SELECT COUNT(*) FROM logs
        	WHERE ((level = ANY($1)) OR cardinality($1) = 0)
        	AND ((title = ANY($2)) OR cardinality($2) = 0)
        	AND (timestamp BETWEEN $3 AND $4)
        	AND ((request_id = ANY($5)) OR cardinality($5) = 0)
        	AND ((service_name = ANY($6)) OR cardinality($6) = 0)
        "#)
			.bind(levels)
			.bind(titles)
			.bind(start)
			.bind(end)
			.bind(request_ids)
			.bind(service_names)
			.fetch_one(&self.pools.sqlx)
			.await?;

		Ok(logs_)
		
    }

    async fn get_logs_count(&self) -> Result<i64> {
        let conn = &mut self.pools.diesel.get().await?;

		let count = logs.count().get_result(conn).await?;

		Ok(count)
    }

    async fn get_logs_by_range(&self, range: Range<i64>) -> Result<Vec<Log>> {
		
        let conn = &mut self.pools.diesel.get().await?;

		let logs_ = logs
        	.order_by(time.desc())
            .offset(range.start)
            .limit(range.end - range.start)
            .load(conn)
            .await?;

        Ok(logs_)
    }

    async fn clear_logs_older_than(&self, date: DateTime<Utc>) -> Result<()> {
		let conn = &mut self.pools.diesel.get().await?;

		diesel::delete(logs.filter(time.lt(date)))
			.execute(conn)
			.await?;
	
		Ok(())
    }

    async fn insert_log(&self, log: Log) -> Result<()> {

        let conn = &mut self.pools.diesel.get().await?;

        insert_into(logs).values(&log).execute(conn).await?;
		
        Ok(())
    }
}

// #[cfg(test)]
// mod tests {
//     use super::*;

//     use crate::test_imports;
//     use chrono::{Duration, Timelike};
//     use serde_json::json;
//     test_imports!();

//     with_pools_serial!(filter_logs, filters_logs_func);
//     with_pools_serial!(count_logs, count_logs_func);
//     with_pools_serial!(range_logs, range_logs_func);
//     with_pools_serial!(clear_logs, clear_logs_func);
//     with_pools_serial!(insert_log, insert_log_func);

//     fn generate_logs() -> Vec<LogDb> {
//         (1..=5)
//             .map(|i| {
//                 LogDb {
//                     id: 0, //db be like: "i don't care lol 😜"
//                     level: LogLevel::Info as i32,
//                     title: format!("Test{}", i),
//                     timestamp: Utc::now() + Duration::minutes(i.into()),
//                     user_id: Some(i),
//                     message: Some(json!({ "test_field" : format!("Test message {}", i)})),
//                     importance: Importance::Default as i32,
//                     service_name: format!("TestService{}", i),
//                     additional_data: None,
//                     request_id: uuid::Uuid::new_v4().to_string(),
//                 }
//             })
//             .collect()
//     }

//     async fn filters_logs_func(env: TestEnv<'_>) {
//         let mut repo = env
//             .ctx
//             .factory
//             .create_repository::<LogsRepository>()
//             .default()
//             .await
//             .unwrap();

//         let logs = generate_logs();

//         for log in &logs {
//             repo.insert_log(log.clone()).await.unwrap();
//         }

//         let filters = Filters::builder()
//             .level(vec![LogLevel::Info])
//             .title(vec!["Test1".to_string()])
//             .timestamp((
//                 Utc::now() - Duration::minutes(2),
//                 Utc::now() + Duration::minutes(2),
//             ))
//             .user_id(vec![1])
//             .importance(vec![Importance::Default])
//             .service_name(vec!["TestService1".to_string()])
//             .build();

//         let result = repo.get_logs_by_filters(filters).await.unwrap();

//         assert_eq!(result.len(), 1);
//         let returned_log = &result[0];

//         assert_eq!(returned_log.level, LogLevel::Info as i32);
//         assert_eq!(returned_log.title, "Test1");
//         assert_eq!(returned_log.user_id, Some(1));
//         assert_eq!(
//             returned_log.message.as_ref().unwrap().to_string(),
//             r#"{"test_field":"Test message 1"}"#
//         );
//         assert_eq!(returned_log.importance, Importance::Default as i32);
//         assert_eq!(returned_log.service_name, "TestService1");
//     }

//     async fn range_logs_func(env: TestEnv<'_>) {
//         let mut repo = env
//             .ctx
//             .factory
//             .create_repository::<LogsRepository>()
//             .default()
//             .await
//             .unwrap();

//         let logs = generate_logs();

//         for log in &logs {
//             repo.insert_log(log.clone()).await.unwrap();
//         }

//         let range = 0..2;
//         let result = repo.get_logs_by_range(range).await.unwrap();

//         assert_eq!(result.len(), 2);
//         for i in 0..2 {
//             let returned_log = &result[i];
//             let expected_log = &logs[i];

//             assert_eq!(returned_log.level, expected_log.level);
//             assert_eq!(returned_log.title, expected_log.title);
//             assert_eq!(
//                 returned_log.timestamp.second(),
//                 expected_log.timestamp.second()
//             );
//             assert_eq!(returned_log.user_id, expected_log.user_id);
//             assert_eq!(returned_log.message, expected_log.message);
//             assert_eq!(returned_log.importance, expected_log.importance);
//             assert_eq!(returned_log.service_name, expected_log.service_name);
//         }
//     }

//     async fn count_logs_func(env: TestEnv<'_>) {
//         let mut repo = env
//             .ctx
//             .factory
//             .create_repository::<LogsRepository>()
//             .default()
//             .await
//             .unwrap();

//         let logs = generate_logs();

//         for log in &logs {
//             repo.insert_log(log.clone()).await.unwrap();
//         }

//         let filters = Filters::builder()
//             .level(vec![LogLevel::Info])
//             .title(vec!["Test1".to_string()])
//             .user_id(vec![1])
//             .importance(vec![Importance::Default])
//             .service_name(vec!["TestService1".to_string()])
//             .build();

//         let count = repo.get_logs_count_by_filters(filters).await.unwrap();

//         assert_eq!(count, 1);

//         let filters = Filters::builder().build();

//         let count = repo.get_logs_count_by_filters(filters).await.unwrap();

//         assert_eq!(count, 5);
//     }

//     async fn clear_logs_func(env: TestEnv<'_>) {
//         let mut repo = env
//             .ctx
//             .factory
//             .create_repository::<LogsRepository>()
//             .default()
//             .await
//             .unwrap();

//         let logs = generate_logs();

//         for log in &logs {
//             repo.insert_log(log.clone()).await.unwrap();
//         }

//         let date = Utc::now();
//         repo.clear_logs_older_than(date).await.unwrap();

//         // let remaining_logs = sqlx::query_as!(LogDb, "SELECT * FROM logs")
//         //     .fetch_all(env.state.db)
//         //     .await
//         //     .unwrap();
//         // for log in remaining_logs {
//         //     assert!(log.timestamp > date);
//         // }
//     }

//     async fn insert_log_func(env: TestEnv<'_>) {
//         let mut repo = env
//             .ctx
//             .factory
//             .create_repository::<LogsRepository>()
//             .default()
//             .await
//             .unwrap();

//         let logs = generate_logs();

//         for log in &logs {
//             repo.insert_log(log.clone()).await.unwrap();

//             // let inserted_log =
//             //     sqlx::query_as!(LogDb, "SELECT * FROM logs WHERE title = $1", log.title)
//             //         .fetch_one(env.state.db)
//             //         .await
//             //         .unwrap();

//             // assert_eq!(inserted_log.level, log.level);
//             // assert_eq!(inserted_log.title, log.title);
//             // // разница в микросекунды.
//             // // assert_eq!(inserted_log.timestamp, log.timestamp);
//             // assert_eq!(inserted_log.user_id, log.user_id);
//             // assert_eq!(inserted_log.message, log.message);
//             // assert_eq!(inserted_log.importance, log.importance);
//             // assert_eq!(inserted_log.service_name, log.service_name);
//             // assert_eq!(inserted_log.additional_data, log.additional_data);
//         }
//     }
// }
