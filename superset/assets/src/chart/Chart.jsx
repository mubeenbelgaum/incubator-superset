import PropTypes from 'prop-types';
import React from 'react';
import { Logger, LOG_ACTIONS_RENDER_CHART_CONTAINER } from '../logger';
import Loading from '../components/Loading';
import RefreshChartOverlay from '../components/RefreshChartOverlay';
import StackTraceMessage from '../components/StackTraceMessage';
import ErrorBoundary from '../components/ErrorBoundary';
import ChartRenderer from './ChartRenderer';
import './chart.css';

const propTypes = {
  annotationData: PropTypes.object,
  actions: PropTypes.object,
  chartId: PropTypes.number.isRequired,
  datasource: PropTypes.object.isRequired,
  filters: PropTypes.object,
  formData: PropTypes.object.isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
  setControlValue: PropTypes.func,
  timeout: PropTypes.number,
  vizType: PropTypes.string.isRequired,
  triggerRender: PropTypes.bool,
  // state
  chartAlert: PropTypes.string,
  chartStatus: PropTypes.string,
  chartStackTrace: PropTypes.string,
  queryResponse: PropTypes.object,
  triggerQuery: PropTypes.bool,
  refreshOverlayVisible: PropTypes.bool,
  errorMessage: PropTypes.node,
  // dashboard callbacks
  addFilter: PropTypes.func,
  onQuery: PropTypes.func,
};

const BLANK = {};

const defaultProps = {
  addFilter: () => BLANK,
  filters: BLANK,
  setControlValue() {},
  triggerRender: false,
};

class Chart extends React.PureComponent {
  componentDidMount() {
    if (this.props.triggerQuery) {
      this.props.actions.runQuery(
        this.props.formData,
        false,
        this.props.timeout,
        this.props.chartId,
      );
    }
  }

  handleRenderFailure(error, info) {
    const { actions, chartId } = this.props;
    console.warn(error); // eslint-disable-line
    actions.chartRenderingFailed(error.toString(), chartId, info ? info.componentStack : null);

    Logger.append(LOG_ACTIONS_RENDER_CHART_CONTAINER, {
      slice_id: chartId,
      has_err: true,
      error_details: error.toString(),
      start_offset: this.renderStartTime,
      duration: Logger.getTimestamp() - this.renderStartTime,
    });
  }

  render() {
    const {
      width,
      height,
      chartAlert,
      chartStackTrace,
      chartStatus,
      errorMessage,
      onQuery,
      queryResponse,
      refreshOverlayVisible,
    } = this.props;

    const isLoading = chartStatus === 'loading';

    // this allows <Loading /> to be positioned in the middle of the chart
    const containerStyles = isLoading ? { height, width } : null;
    const isFaded = refreshOverlayVisible && !errorMessage;
    this.renderContainerStartTime = Logger.getTimestamp();

    return (
      <ErrorBoundary onError={this.handleRenderContainerFailure} showMessage={false}>
        <div
          className={`chart-container ${isLoading ? 'is-loading' : ''}`}
          style={containerStyles}
        >

          {isLoading && <Loading size={50} />}

          {chartAlert && (
            <StackTraceMessage
              message={chartAlert}
              link={queryResponse ? queryResponse.link : null}
              stackTrace={chartStackTrace}
            />
          )}

          {!isLoading && !chartAlert && isFaded && (
            <RefreshChartOverlay
              width={width}
              height={height}
              onQuery={onQuery}
            />
          )}
          <div className={`slice_container ${isFaded ? ' faded' : ''}`}>
            <ChartRenderer
              {...this.props}
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}

Chart.propTypes = propTypes;
Chart.defaultProps = defaultProps;

export default Chart;
