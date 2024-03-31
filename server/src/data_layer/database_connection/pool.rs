use diesel_async::pooled_connection::deadpool::Pool as AsyncConnectionPool;
use diesel_async::pooled_connection::AsyncDieselConnectionManager;
use diesel_async::AsyncPgConnection;
use sqlx::PgPool;

#[derive(Clone)]
pub struct Pools {
    pub diesel: AsyncConnectionPool<AsyncPgConnection>,
    pub sqlx: PgPool,
}
pub async fn setup_pool() -> Pools {
    let config = AsyncDieselConnectionManager::<AsyncPgConnection>::new(dotenv!("DATABASE_URL"));

    Pools {
        diesel: AsyncConnectionPool::builder(config)
            .max_size(20)
            .build()
            .unwrap(),
        sqlx: sqlx::PgPool::connect(dotenv!("DATABASE_URL"))
            .await
            .unwrap(),
    }
}
