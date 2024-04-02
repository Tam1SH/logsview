use actix_web::{
    get, post, web::{Data, Json}, HttpResponse
};

use uuid::Uuid;

use crate::{
    api::{http::api_error::ApiError, state::AppState},
    data_layer::model::dto::log::LogDto,
    domain::logger::{LoggerService, LoggerServiceProvider},
};

use super::request_types::GetLogsByRangeModel;
use super::response_types::{GetLogsCountResponse, GetLogsByRangeResponse};

#[utoipa::path(
	context_path = "/api",
	tag = "Logs",
	request_body = LogDto,
	responses(
		(status = 200, body = ()),
		(status = 400, body = ApiError),
		(status = 500, body = ApiError)
	)
)]
#[post("/insertLog")]
async fn insert_log(state: Data<AppState>, model: Json<LogDto>) -> Result<HttpResponse, ApiError> {
    let service = LoggerService::new(&state.pools, Uuid::new_v4());

    service.insert_log(model.into_inner()).await?;

    Ok(HttpResponse::Ok().finish())
}

#[utoipa::path(
	context_path = "/api",
	tag = "Logs",
	responses(
		(status = 200, body = GetLogsCountResponse),
		(status = 400, body = ApiError),
		(status = 500, body = ApiError)
	)
)]
#[get("/getLogsCount")]
async fn get_logs_count(state: Data<AppState>) -> Result<Json<GetLogsCountResponse>, ApiError> {
    let service = LoggerService::new(&state.pools, Uuid::new_v4());

    let count = service.get_logs_count().await?;

    Ok(Json(
		GetLogsCountResponse { count }
	))
}



#[utoipa::path(
	context_path = "/api",
	tag = "Logs",
	request_body = GetLogsByRangeModel,
	responses(
		(status = 200, body = GetLogsByRangeResponse),
		(status = 400, body = ApiError),
		(status = 500, body = ApiError)
	)
)]
#[post("/getLogsByRange")]
async fn get_logs_by_range(state: Data<AppState>, model: Json<GetLogsByRangeModel>) -> Result<Json<GetLogsByRangeResponse>, ApiError> {

	
    let service = LoggerService::new(&state.pools, Uuid::new_v4());
	
    let logs = service.get_logs_by_range(model.start..model.end).await?;

    Ok(Json(
		GetLogsByRangeResponse { logs }
	))
}

