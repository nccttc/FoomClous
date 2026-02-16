"use strict";
// Copyright 2020 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.datamanager_v1 = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-irregular-whitespace */
const googleapis_common_1 = require("googleapis-common");
var datamanager_v1;
(function (datamanager_v1) {
    /**
     * Data Manager API
     *
     * A unified ingestion API for data partners, agencies and advertisers to connect first-party data across Google advertising products.
     *
     * @example
     * ```js
     * const {google} = require('googleapis');
     * const datamanager = google.datamanager('v1');
     * ```
     */
    class Datamanager {
        context;
        audienceMembers;
        events;
        requestStatus;
        constructor(options, google) {
            this.context = {
                _options: options || {},
                google,
            };
            this.audienceMembers = new Resource$Audiencemembers(this.context);
            this.events = new Resource$Events(this.context);
            this.requestStatus = new Resource$Requeststatus(this.context);
        }
    }
    datamanager_v1.Datamanager = Datamanager;
    class Resource$Audiencemembers {
        context;
        constructor(context) {
            this.context = context;
        }
        ingest(paramsOrCallback, optionsOrCallback, callback) {
            let params = (paramsOrCallback ||
                {});
            let options = (optionsOrCallback || {});
            if (typeof paramsOrCallback === 'function') {
                callback = paramsOrCallback;
                params = {};
                options = {};
            }
            if (typeof optionsOrCallback === 'function') {
                callback = optionsOrCallback;
                options = {};
            }
            const rootUrl = options.rootUrl || 'https://datamanager.googleapis.com/';
            const parameters = {
                options: Object.assign({
                    url: (rootUrl + '/v1/audienceMembers:ingest').replace(/([^:]\/)\/+/g, '$1'),
                    method: 'POST',
                    apiVersion: '',
                }, options),
                params,
                requiredParams: [],
                pathParams: [],
                context: this.context,
            };
            if (callback) {
                (0, googleapis_common_1.createAPIRequest)(parameters, callback);
            }
            else {
                return (0, googleapis_common_1.createAPIRequest)(parameters);
            }
        }
        remove(paramsOrCallback, optionsOrCallback, callback) {
            let params = (paramsOrCallback ||
                {});
            let options = (optionsOrCallback || {});
            if (typeof paramsOrCallback === 'function') {
                callback = paramsOrCallback;
                params = {};
                options = {};
            }
            if (typeof optionsOrCallback === 'function') {
                callback = optionsOrCallback;
                options = {};
            }
            const rootUrl = options.rootUrl || 'https://datamanager.googleapis.com/';
            const parameters = {
                options: Object.assign({
                    url: (rootUrl + '/v1/audienceMembers:remove').replace(/([^:]\/)\/+/g, '$1'),
                    method: 'POST',
                    apiVersion: '',
                }, options),
                params,
                requiredParams: [],
                pathParams: [],
                context: this.context,
            };
            if (callback) {
                (0, googleapis_common_1.createAPIRequest)(parameters, callback);
            }
            else {
                return (0, googleapis_common_1.createAPIRequest)(parameters);
            }
        }
    }
    datamanager_v1.Resource$Audiencemembers = Resource$Audiencemembers;
    class Resource$Events {
        context;
        constructor(context) {
            this.context = context;
        }
        ingest(paramsOrCallback, optionsOrCallback, callback) {
            let params = (paramsOrCallback || {});
            let options = (optionsOrCallback || {});
            if (typeof paramsOrCallback === 'function') {
                callback = paramsOrCallback;
                params = {};
                options = {};
            }
            if (typeof optionsOrCallback === 'function') {
                callback = optionsOrCallback;
                options = {};
            }
            const rootUrl = options.rootUrl || 'https://datamanager.googleapis.com/';
            const parameters = {
                options: Object.assign({
                    url: (rootUrl + '/v1/events:ingest').replace(/([^:]\/)\/+/g, '$1'),
                    method: 'POST',
                    apiVersion: '',
                }, options),
                params,
                requiredParams: [],
                pathParams: [],
                context: this.context,
            };
            if (callback) {
                (0, googleapis_common_1.createAPIRequest)(parameters, callback);
            }
            else {
                return (0, googleapis_common_1.createAPIRequest)(parameters);
            }
        }
    }
    datamanager_v1.Resource$Events = Resource$Events;
    class Resource$Requeststatus {
        context;
        constructor(context) {
            this.context = context;
        }
        retrieve(paramsOrCallback, optionsOrCallback, callback) {
            let params = (paramsOrCallback ||
                {});
            let options = (optionsOrCallback || {});
            if (typeof paramsOrCallback === 'function') {
                callback = paramsOrCallback;
                params = {};
                options = {};
            }
            if (typeof optionsOrCallback === 'function') {
                callback = optionsOrCallback;
                options = {};
            }
            const rootUrl = options.rootUrl || 'https://datamanager.googleapis.com/';
            const parameters = {
                options: Object.assign({
                    url: (rootUrl + '/v1/requestStatus:retrieve').replace(/([^:]\/)\/+/g, '$1'),
                    method: 'GET',
                    apiVersion: '',
                }, options),
                params,
                requiredParams: [],
                pathParams: [],
                context: this.context,
            };
            if (callback) {
                (0, googleapis_common_1.createAPIRequest)(parameters, callback);
            }
            else {
                return (0, googleapis_common_1.createAPIRequest)(parameters);
            }
        }
    }
    datamanager_v1.Resource$Requeststatus = Resource$Requeststatus;
})(datamanager_v1 || (exports.datamanager_v1 = datamanager_v1 = {}));
