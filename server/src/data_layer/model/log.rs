use chrono::{DateTime, Utc};
use diesel::{deserialize::Queryable, prelude::Insertable, query_builder::AsChangeset, Selectable};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, diesel_derive_enum::DbEnum, ToSchema)]
#[ExistingTypePath = "crate::schema::sql_types::Loglevel"]
pub enum Loglevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR,
    CRITICAL,
}

#[derive(Debug, Serialize, Deserialize, Queryable, Selectable, Insertable, AsChangeset)]
#[diesel(table_name = crate::schema::logs)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Log {
    pub time: DateTime<Utc>,
    pub level: Loglevel,
    pub request_id: Uuid,
    pub title: String,
    pub service_name: Option<String>,
    pub controller_name: Option<String>,
    pub message: Option<Value>,
    pub additional_data: Option<Value>,
}
