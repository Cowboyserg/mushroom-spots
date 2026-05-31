import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GeoAverager,
  bearingDegrees,
  distanceMeters,
  formatBearing,
  formatCoord,
  formatMeters,
} from './geo.js';

test('distanceMeters returns zero for identical coordinates', () => {
  const point = { lat: 52.1, lon: 5.1 };
  assert.equal(Math.round(distanceMeters(point, point)), 0);
});

test('distanceMeters returns a realistic distance for nearby coordinates', () => {
  const from = { lat: 52.1, lon: 5.1 };
  const to = { lat: 52.1009, lon: 5.1 };
  const distance = distanceMeters(from, to);

  assert.ok(distance > 95);
  assert.ok(distance < 105);
});

test('bearingDegrees returns a normalized compass angle', () => {
  const bearing = bearingDegrees(
    { lat: 52.1, lon: 5.1 },
    { lat: 52.2, lon: 5.2 }
  );

  assert.ok(Number.isFinite(bearing));
  assert.ok(bearing >= 0);
  assert.ok(bearing < 360);
});

test('format helpers keep expected Russian field formatting', () => {
  assert.equal(formatCoord(52.123456789), '52.123457');
  assert.equal(formatCoord(Number.NaN), '—');
  assert.equal(formatMeters(12.4), '±12 м');
  assert.equal(formatMeters(null), '—');
  assert.equal(formatBearing(91.6), '92°');
  assert.equal(formatBearing(undefined), '—');
});

test('GeoAverager ignores invalid samples and averages valid GPS positions', () => {
  const averager = new GeoAverager();

  averager.add({
    coords: {
      latitude: Number.NaN,
      longitude: 5,
      accuracy: 20,
      altitude: null,
      heading: null,
      speed: null,
    },
    timestamp: 1,
  });

  averager.add({
    coords: {
      latitude: 52,
      longitude: 5,
      accuracy: 10,
      altitude: null,
      heading: null,
      speed: null,
    },
    timestamp: 2,
  });

  const result = averager.average();

  assert.equal(averager.count(), 1);
  assert.equal(result.lat, 52);
  assert.equal(result.lon, 5);
  assert.equal(result.accuracy, 10);
  assert.equal(result.samplesCount, 1);
});
