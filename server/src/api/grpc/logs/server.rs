use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::{api::grpc::server::AppStateImpl, data_layer::model::{dto::log::LogDto, log::Loglevel}, domain::logger::{LoggerService, LoggerServiceProvider}};

use super::g::{logs_service_server::LogsService, Log, LogRequest, LogResponse};


#[derive(Debug, Default)]
pub struct GRpcLoggerService;


#[tonic::async_trait]
impl LogsService for GRpcLoggerService {
	async fn insert_log(
		&self,
		request: Request<LogRequest>
	) -> Result<Response<LogResponse>, Status> {

		let state = request.app_state();
		let LogRequest { log } = request.get_ref();

		let service = LoggerService::new(&state.pool, Uuid::new_v4());

		if let Some(log) = log.clone() {

			match format_log(log) {
				Ok(log) => {
					if let Err(err) = service.insert_log(log).await {
						return Err(Status::internal(err.to_string()));
					}
				},
				Err(err) => {
					return Err(Status::internal(err.to_string()));
				}
			};
			
		}

		Ok(Response::new(LogResponse {
			result: 0,
			error: "".to_string()
		}))
	}
}


fn format_log(log: Log) -> anyhow::Result<LogDto> {

	let additional_data = Some(serde_json::to_value(&log.additional_data)?);

	let message = Some(serde_json::to_value(&log.message)?);

	let controller_name = if log.controller_name.is_empty() {
		Some(log.controller_name)
	} else { 
		None
	};	

	let service_name = if log.service_name.is_empty() {
		Some(log.service_name)
	} else { 
		None
	};	

	let request_id = match Uuid::parse_str(&log.request_id) {
		Ok(uuid) => uuid,
		Err(_) => Uuid::new_v4()
	};

	let level = match log.level {
		0 => Loglevel::DEBUG,
		1 => Loglevel::INFO,
		2 => Loglevel::WARNING,
		3 => Loglevel::ERROR,
		4 => Loglevel::CRITICAL,
		_ => Loglevel::INFO
	};

	Ok(LogDto {
		additional_data,
		message,
		controller_name,
		service_name,
		level,
		title: log.title,
		request_id: Some(request_id)
	})
}