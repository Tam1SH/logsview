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

import { mapValues } from '../runtime';
import type { Log } from './Log';
import {
    LogFromJSON,
    LogFromJSONTyped,
    LogToJSON,
} from './Log';

/**
 * 
 * @export
 * @interface GetLogsByRangeResponse
 */
export interface GetLogsByRangeResponse {
    /**
     * 
     * @type {Array<Log>}
     * @memberof GetLogsByRangeResponse
     */
    logs: Array<Log>;
}

/**
 * Check if a given object implements the GetLogsByRangeResponse interface.
 */
export function instanceOfGetLogsByRangeResponse(value: object): boolean {
    if (!('logs' in value)) return false;
    return true;
}

export function GetLogsByRangeResponseFromJSON(json: any): GetLogsByRangeResponse {
    return GetLogsByRangeResponseFromJSONTyped(json, false);
}

export function GetLogsByRangeResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetLogsByRangeResponse {
    if (json == null) {
        return json;
    }
    return {
        
        'logs': ((json['logs'] as Array<any>).map(LogFromJSON)),
    };
}

export function GetLogsByRangeResponseToJSON(value?: GetLogsByRangeResponse | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'logs': ((value['logs'] as Array<any>).map(LogToJSON)),
    };
}

