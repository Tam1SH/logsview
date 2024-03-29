use actix_web::{
    post,
    web::{Data, Json},
    HttpResponse,
};

use uuid::Uuid;

use crate::{
    api::{http::api_error::ApiError, state::AppState},
    data_layer::model::dto::log::LogDto,
    domain::logger::{LoggerService, LoggerServiceProvider},
};

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
    let service = LoggerService::new(&state.pool, Uuid::new_v4());

	service.insert_log(model.into_inner()).await?;

    Ok(HttpResponse::Ok().finish())
}
