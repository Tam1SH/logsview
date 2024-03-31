use actix_web::http::StatusCode;
use actix_web::{
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    error::InternalError,
};

use futures_util::{
    future::{ready, LocalBoxFuture, Ready},
    FutureExt,
};
use std::{
    panic::AssertUnwindSafe,
    rc::Rc,
    task::{Context, Poll},
};

pub struct ErrorHandlerMiddleware;

impl<S, B> Transform<S, ServiceRequest> for ErrorHandlerMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type Transform = _ErrorHandlerMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(_ErrorHandlerMiddleware {
            service: Rc::new(service),
        }))
    }
}

pub struct _ErrorHandlerMiddleware<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for _ErrorHandlerMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, actix_web::Error>>;

    fn poll_ready(&self, ctx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(ctx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let srv = Rc::clone(&self.service);

        async move {
            let res = AssertUnwindSafe(srv.call(req))
                .catch_unwind()
                .map(move |res| match res {
                    Ok(Ok(res)) => Ok(res),
                    Ok(Err(svc_err)) => Err(svc_err),
                    Err(_panic) => Err(InternalError::new(
                        "The gremlins have taken over!",
                        StatusCode::INTERNAL_SERVER_ERROR,
                    )
                    .into()),
                })
                .await;

            let res = match res {
                Ok(res) => Ok(res),
                Err(err) => {
                    dbg!(&err);

                    if err.to_string().contains("The gremlins have taken over!") {
                        Err(InternalError::new(
                            err.to_string(),
                            StatusCode::INTERNAL_SERVER_ERROR,
                        ))
                    } else {
                        Err(InternalError::new(
                            err.to_string(),
                            err.error_response().status(),
                        ))
                    }
                }
            }?;

            if res.response().error().is_some()
                && (res.status().is_client_error() || res.status().is_server_error())
            {
                let error = res.response().error().unwrap();

                dbg!(error);

                Err(InternalError::new(error.to_string(), res.status()).into())
            } else {
                Ok(res)
            }
        }
        .boxed_local()
    }
}
