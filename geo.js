export class GeoAverager {
  constructor() {
    this.samples = [];
  }

  clear() {
    this.samples = [];
  }

  add(position) {
    const coords = position.coords;
    if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) return;

    this.samples.push({
      lat: coords.latitude,
      lon: coords.longitude,
      accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
      altitude: Number.isFinite(coords.altitude) ? coords.altitude : null,
      heading: Number.isFinite(coords.heading) ? coords.heading : null,
      speed: Number.isFinite(coords.speed) ? coords.speed : null,
      timestamp: position.timestamp || Date.now(),
    });
  }

  count() {
    return this.samples.length;
  }

  bestAccuracy() {
    return this.samples.reduce((best, sample) => {
      if (sample.accuracy == null) return best;
      return best == null ? sample.accuracy : Math.min(best, sample.accuracy);
    }, null);
  }

  average() {
    if (!this.samples.length) return null;

    let weightSum = 0;
    let latSum = 0;
    let lonSum = 0;
    const usable = this.samples.filter((sample) => sample.accuracy == null || sample.accuracy <= 50);
    const samples = usable.length ? usable : this.samples;

    for (const sample of samples) {
      const accuracy = Math.max(sample.accuracy || 20, 1);
      const weight = 1 / (accuracy * accuracy);
      weightSum += weight;
      latSum += sample.lat * weight;
      lonSum += sample.lon * weight;
    }

    const bestAccuracy = this.bestAccuracy();
    return {
      lat: latSum / weightSum,
      lon: lonSum / weightSum,
      accuracy: bestAccuracy,
      averagedAccuracy: estimateAveragedAccuracy(samples),
      samplesCount: this.samples.length,
      rawSamplesKept: samples.length,
    };
  }
}

function estimateAveragedAccuracy(samples) {
  if (!samples.length) return null;
  const accuracies = samples
    .map((sample) => sample.accuracy)
    .filter((accuracy) => Number.isFinite(accuracy) && accuracy > 0);
  if (!accuracies.length) return null;
  const best = Math.min(...accuracies);
  const median = accuracies.sort((a, b) => a - b)[Math.floor(accuracies.length / 2)];
  return Math.max(best / Math.sqrt(Math.max(samples.length, 1)), best * 0.55, median * 0.35);
}

export function formatCoord(value) {
  return Number.isFinite(value) ? value.toFixed(6) : '—';
}

export function formatMeters(value) {
  return Number.isFinite(value) ? `±${Math.round(value)} м` : '—';
}

export function distanceMeters(a, b) {
  const radius = 6371000;
  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const dPhi = toRad(b.lat - a.lat);
  const dLambda = toRad(b.lon - a.lon);
  const x = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function bearingDegrees(from, to) {
  if (!from || !to) return null;
  const phi1 = toRad(from.lat);
  const phi2 = toRad(to.lat);
  const lambda1 = toRad(from.lon);
  const lambda2 = toRad(to.lon);
  const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function formatBearing(value) {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value)}°`;
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

function toDeg(radians) {
  return radians * 180 / Math.PI;
}
