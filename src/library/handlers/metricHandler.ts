// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { BatchProcessor } from "./shared/batchProcessor";
import { Config } from "../configuration";
import {
    CustomMetricsHandler,
    StandardMetricsHandler,
    PerformanceCounterMetricsHandler,
    LiveMetricsHandler,
} from "../../autoCollection";
import { HeartBeatHandler } from "../../autoCollection/metrics/handlers/heartBeatHandler";
import { AzureHttpMetricsInstrumentation } from "../../autoCollection/metrics/collection/azureHttpMetricsInstrumentation";
import { IMetricExceptionDimensions, IMetricTraceDimensions } from "../../autoCollection/metrics/types";


export class MetricHandler {
    private _config: Config;
    private _batchProcessor: BatchProcessor;
    private _perfCounterMetricsHandler: PerformanceCounterMetricsHandler;
    private _standardMetricsHandler: StandardMetricsHandler;
    private _liveMetricsHandler: LiveMetricsHandler;
    private _heartbeatHandler: HeartBeatHandler;
    private _customMetricsHandler: CustomMetricsHandler;

    constructor(config: Config) {
        this._config = config;
        this._customMetricsHandler = new CustomMetricsHandler(config);
        if (this._config.enableAutoCollectPreAggregatedMetrics) {
            this._standardMetricsHandler = new StandardMetricsHandler(this._config);
        }
        if (this._config.enableSendLiveMetrics) {
            this._liveMetricsHandler = new LiveMetricsHandler(this._config);
        }
        if (this._config.enableAutoCollectPerformance) {
            this._perfCounterMetricsHandler = new PerformanceCounterMetricsHandler(this._config);
        }
        if (this._config.enableAutoCollectHeartbeat) {
            this._heartbeatHandler = new HeartBeatHandler(this._config);
        }
    }

    public start() {
        this._perfCounterMetricsHandler?.start();
        this._liveMetricsHandler?.start();
        this._standardMetricsHandler?.start();
        this._heartbeatHandler?.start();
    }

    public async shutdown(): Promise<void> {
        this._customMetricsHandler.shutdown();
        this._perfCounterMetricsHandler?.shutdown();
        this._standardMetricsHandler?.shutdown();
        this._liveMetricsHandler?.shutdown();
        this._heartbeatHandler?.shutdown();
    }

    public getConfig(): Config {
        return this._config;
    }

    public getCustomMetricsHandler(): CustomMetricsHandler {
        return this._customMetricsHandler;
    }

    public getStandardMetricsHandler(): StandardMetricsHandler {
        return this._standardMetricsHandler;
    }

    public getPerCounterAzureHttpInstrumentation(): AzureHttpMetricsInstrumentation {
        return this._perfCounterMetricsHandler?.getHttpMetricsInstrumentation();
    }

    public getLiveMetricsAzureHttpInstrumentation(): AzureHttpMetricsInstrumentation {
        return this._liveMetricsHandler?.getHttpMetricsInstrumentation();
    }

    public countException(dimensions: IMetricExceptionDimensions): void {
        this._liveMetricsHandler?.getExceptionMetrics().countException(dimensions);
        this._standardMetricsHandler?.getExceptionMetrics().countException(dimensions);
    }

    public countTrace(dimensions: IMetricTraceDimensions): void {
        this._standardMetricsHandler?.getTraceMetrics().countTrace(dimensions);
    }

    public async flush(): Promise<void> {
        await this._batchProcessor.triggerSend();
    }
}
