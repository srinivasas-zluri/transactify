import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

export let responseTimeTrend = new Trend('response_time');

export default function () {
  let res = http.get('https://84bfezhjwf.execute-api.ap-south-1.amazonaws.com/api/v1/transaction?page=1&limit=99');
  
  // Record response time for the custom metric
  responseTimeTrend.add(res.timings.duration);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
