use serde::Deserialize;
use utoipa::ToSchema;




#[derive(Deserialize, ToSchema)]
pub struct GetLogsByRangeModel {
	pub start: i64,
	pub end: i64
}