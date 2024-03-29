use serde::Deserialize;
use serde_json::Value;
use uuid::Uuid;

use crate::data_layer::model::log::Loglevel;

#[derive(Deserialize)]
pub struct LogDto {
    pub level: Loglevel,
    pub request_id: Option<Uuid>,
    pub title: String,
    pub service_name: Option<String>,
    pub controller_name: Option<String>,
    pub message: Option<Value>,
    pub additional_data: Option<Value>,
}
