use actix_web::{http::StatusCode, HttpResponse};
use serde::Serialize;
use utoipa::ToSchema;
use std::fmt;

#[derive(Debug, Serialize, ToSchema)]
pub struct ApiError {
    pub message: String,
    #[serde(skip)]
    pub http_code: StatusCode,
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", serde_json::to_string(self).unwrap())
    }
}

impl actix_web::error::ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        match self.http_code {
            StatusCode::INTERNAL_SERVER_ERROR => HttpResponse::InternalServerError().json(self),
            StatusCode::BAD_REQUEST => HttpResponse::BadRequest().json(self),
            _ => HttpResponse::InternalServerError().json(self),
        }
    }
}

impl From<anyhow::Error> for ApiError {
    fn from(value: anyhow::Error) -> Self {
        Self {
            http_code: StatusCode::INTERNAL_SERVER_ERROR,
            message: value.to_string(),
        }
    }
}
