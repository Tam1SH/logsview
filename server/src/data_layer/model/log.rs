use chrono::{DateTime, Utc};
use diesel::{deserialize::Queryable, prelude::Insertable, query_builder::AsChangeset, Selectable};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::prelude::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;
use derive_more::Display;

#[derive(sqlx::Type, Display, Debug, Serialize, Deserialize, diesel_derive_enum::DbEnum, ToSchema, Clone, Copy)]
#[ExistingTypePath = "crate::schema::sql_types::Loglevel"]
#[serde(rename_all = "lowercase")]
pub enum Loglevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR,
    CRITICAL,
}


#[derive(FromRow, Debug, Serialize, Deserialize, Queryable, Selectable, Insertable, AsChangeset, ToSchema)]
#[diesel(table_name = crate::schema::logs)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Log {
    #[schema(value_type = String, format = "date-time")]
    pub time: DateTime<Utc>,
    pub level: Loglevel,
    pub request_id: Uuid,
    pub title: String,
    pub service_name: Option<String>,
    pub controller_name: Option<String>,
    pub message: Option<Value>,
    pub additional_data: Option<Value>,
}
