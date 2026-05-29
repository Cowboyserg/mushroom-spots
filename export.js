export function downloadJson(spots) {
  const payload = backupPayload(spots);
  downloadFile(JSON.stringify(payload, null, 2), filename('gribnye-mesta-backup', 'json'), 'application/json');
}

export function downloadSpotJson(spot) {
  const payload = backupPayload([spot], 'mushroom-spots.share.v1');
  downloadFile(JSON.stringify(payload, null, 2), filename('gribnaya-tochka', 'json'), 'application/json');
}

export async function shareJson(spots, title = 'Грибные места') {
  const payload = backupPayload(spots, spots.length === 1 ? 'mushroom-spots.share.v1' : 'mushroom-spots.v1');
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const file = new File([blob], filename(spots.length === 1 ? 'gribnaya-tochka' : 'gribnye-mesta', 'json'), { type: 'application/json' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title,
      text: 'Файл с грибными точками для импорта в PWA «Грибные места».',
      files: [file],
    });
    return;
  }

  downloadFile(blob, file.name, 'application/json');
}

export function parseImportedJson(text) {
  const parsed = JSON.parse(text);
  const spots = Array.isArray(parsed) ? parsed : parsed.spots;
  if (!Array.isArray(spots)) throw new Error('Неверный файл: ожидался массив точек.');
  return spots.map(normalizeSpot);
}

export function downloadGpx(spots) {
  const waypoints = spots.map((spot) => `  <wpt lat="${escapeXml(String(spot.lat))}" lon="${escapeXml(String(spot.lon))}">
    <name>${escapeXml(spot.name || 'Грибное место')}</name>
    <desc>${escapeXml(descriptionForGpx(spot))}</desc>
    <time>${escapeXml(spot.createdAt || new Date().toISOString())}</time>
    ${Number.isFinite(spot.accuracy) ? `<extensions><accuracy>${Math.round(spot.accuracy)}</accuracy></extensions>` : ''}
  </wpt>`).join('\n');

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Mushroom Spots PWA" xmlns="http://www.topografix.com/GPX/1/1">
${waypoints}
</gpx>\n`;
  downloadFile(gpx, filename('gribnye-mesta', 'gpx'), 'application/gpx+xml');
}

export async function fileToDataUrl(file, maxSize = 1280, quality = 0.82) {
  if (!file) return null;
  if (!file.type.startsWith('image/')) throw new Error('Выбранный файл не является изображением.');

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

function backupPayload(spots, schema = 'mushroom-spots.v1') {
  return {
    schema,
    exportedAt: new Date().toISOString(),
    spots,
  };
}

function normalizeSpot(spot) {
  if (!Number.isFinite(Number(spot.lat)) || !Number.isFinite(Number(spot.lon))) {
    throw new Error('Неверный файл: у точки некорректные координаты.');
  }
  const now = new Date().toISOString();
  return {
    id: typeof spot.id === 'string' ? spot.id : crypto.randomUUID(),
    name: String(spot.name || '').slice(0, 140),
    species: String(spot.species || '').slice(0, 140),
    notes: String(spot.notes || '').slice(0, 4000),
    lat: Number(spot.lat),
    lon: Number(spot.lon),
    accuracy: Number.isFinite(Number(spot.accuracy)) ? Number(spot.accuracy) : null,
    averagedAccuracy: Number.isFinite(Number(spot.averagedAccuracy)) ? Number(spot.averagedAccuracy) : null,
    samplesCount: Number.isFinite(Number(spot.samplesCount)) ? Number(spot.samplesCount) : 1,
    photoDataUrl: typeof spot.photoDataUrl === 'string' ? spot.photoDataUrl : null,
    createdAt: typeof spot.createdAt === 'string' ? spot.createdAt : now,
    updatedAt: now,
  };
}

function descriptionForGpx(spot) {
  const parts = [];
  if (spot.species) parts.push(`Тип: ${spot.species}`);
  if (spot.notes) parts.push(spot.notes);
  if (Number.isFinite(spot.accuracy)) parts.push(`Точность GPS: ±${Math.round(spot.accuracy)} м`);
  if (Number.isFinite(spot.averagedAccuracy)) parts.push(`Оценка после усреднения: ±${Math.round(spot.averagedAccuracy)} м`);
  if (spot.samplesCount) parts.push(`Замеры: ${spot.samplesCount}`);
  return parts.join('\n');
}

function downloadFile(content, name, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function filename(prefix, extension) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
