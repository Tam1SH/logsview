use serde::Serialize;
use utoipa::ToSchema;



#[derive(Serialize, ToSchema)]
pub struct GetLogsCountResponse {
	pub count: usize
}