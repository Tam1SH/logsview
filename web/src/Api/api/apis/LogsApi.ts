/* tslint:disable */
/* eslint-disable */
/**
 * server
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 0.1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import type {
  ApiError,
  GetLogsByRangeModel,
  GetLogsByRangeResponse,
  GetLogsCountResponse,
  LogDto,
} from '../models/index';
import {
    ApiErrorFromJSON,
    ApiErrorToJSON,
    GetLogsByRangeModelFromJSON,
    GetLogsByRangeModelToJSON,
    GetLogsByRangeResponseFromJSON,
    GetLogsByRangeResponseToJSON,
    GetLogsCountResponseFromJSON,
    GetLogsCountResponseToJSON,
    LogDtoFromJSON,
    LogDtoToJSON,
} from '../models/index';

export interface GetLogsByRangeRequest {
    getLogsByRangeModel: GetLogsByRangeModel;
}

export interface InsertLogRequest {
    logDto: LogDto;
}

/**
 * 
 */
export class LogsApi extends runtime.BaseAPI {

    /**
     */
    async getLogsByRangeRaw(requestParameters: GetLogsByRangeRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GetLogsByRangeResponse>> {
        if (requestParameters['getLogsByRangeModel'] == null) {
            throw new runtime.RequiredError(
                'getLogsByRangeModel',
                'Required parameter "getLogsByRangeModel" was null or undefined when calling getLogsByRange().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/api/getLogsByRange`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: GetLogsByRangeModelToJSON(requestParameters['getLogsByRangeModel']),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => GetLogsByRangeResponseFromJSON(jsonValue));
    }

    /**
     */
    async getLogsByRange(getLogsByRangeModel: GetLogsByRangeModel, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GetLogsByRangeResponse> {
        const response = await this.getLogsByRangeRaw({ getLogsByRangeModel: getLogsByRangeModel }, initOverrides);
        return await response.value();
    }

    /**
     */
    async getLogsCountRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GetLogsCountResponse>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/api/getLogsCount`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => GetLogsCountResponseFromJSON(jsonValue));
    }

    /**
     */
    async getLogsCount(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GetLogsCountResponse> {
        const response = await this.getLogsCountRaw(initOverrides);
        return await response.value();
    }

    /**
     */
    async insertLogRaw(requestParameters: InsertLogRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<any>> {
        if (requestParameters['logDto'] == null) {
            throw new runtime.RequiredError(
                'logDto',
                'Required parameter "logDto" was null or undefined when calling insertLog().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/api/insertLog`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: LogDtoToJSON(requestParameters['logDto']),
        }, initOverrides);

        if (this.isJsonMime(response.headers.get('content-type'))) {
            return new runtime.JSONApiResponse<any>(response);
        } else {
            return new runtime.TextApiResponse(response) as any;
        }
    }

    /**
     */
    async insertLog(logDto: LogDto, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<any> {
        const response = await this.insertLogRaw({ logDto: logDto }, initOverrides);
        return await response.value();
    }

}