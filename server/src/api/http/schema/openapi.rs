use std::{fs::File, io::Write};

use anyhow::Result;
use utoipa::OpenApi;

use crate::api::http::api_error::ApiError;
use crate::api::http::log::response_types::GetLogsCountResponse;
use crate::api::http::log::controller::*;
use crate::data_layer::model::dto::log::LogDto;
use crate::data_layer::model::log::Loglevel;


pub fn openapi() -> Result<()> {
    #[derive(OpenApi)]
    #[openapi(
		paths(
			insert_log,
			get_logs_count
		),
		components(
			schemas(
				GetLogsCountResponse,
				LogDto,
				Loglevel,
				ApiError
			)
		)
	)]
    struct ApiDoc;

    let mut file = File::create(format!(
        "{}/schema/openapi.yaml",
        std::env::current_dir().unwrap().to_str().unwrap()
    ))?;

    let open_api = ApiDoc::openapi().to_yaml().unwrap();
    file.write_all(open_api.as_bytes())?;

    Ok(())
}
