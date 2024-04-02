use serde::Serialize;
use utoipa::ToSchema;

use crate::data_layer::model::log::Log;



#[derive(Serialize, ToSchema)]
pub struct GetLogsCountResponse {
	pub count: i64
}

#[derive(Serialize, ToSchema)]
pub struct GetLogsByRangeResponse {
	pub logs: Vec<Log>
}