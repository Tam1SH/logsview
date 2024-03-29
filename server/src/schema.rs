// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::query_builder::QueryId, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "loglevel"))]
    pub struct Loglevel;
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::Loglevel;

    logs (time) {
        time -> Timestamptz,
        level -> Loglevel,
        request_id -> Uuid,
        title -> Text,
        service_name -> Nullable<Text>,
        controller_name -> Nullable<Text>,
        message -> Nullable<Jsonb>,
        additional_data -> Nullable<Jsonb>,
    }
}
