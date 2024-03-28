use actix_web::{http::StatusCode, HttpResponse};
use anyhow::Error as AnyError;
use derive_more::{Deref, Display};
use serde::Serialize;
use std::fmt;

#[derive(Debug, Deref, Display)]
pub struct Error(pub AnyError);

#[derive(Serialize, Debug)]
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

impl From<Error> for ApiError {
    fn from(value: Error) -> Self {
        Self {
            http_code: StatusCode::INTERNAL_SERVER_ERROR,
            message: value.to_string(),
        }
    }
}

impl actix_web::error::ResponseError for Error {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::InternalServerError().body((*self).to_string())
    }
}
