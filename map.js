const TILE_SIZE = 256;
const DEFAULT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export class SlippyMap {
  constructor({ root, tileLayer, markerLayer, onSpotClick }) {
    this.root = root;
    this.tileLayer = tileLayer;
    this.markerLayer = markerLayer;
    this.onSpotClick = onSpotClick;
    this.center = { lat: 56.9496, lon: 24.1052 };
    this.zoom = 13;
    this.spots = [];
    this.currentPosition = null;
    this.drag = null;

    this.attachEvents();
    this.render();
  }

  setCenter(lat, lon, zoom = this.zoom) {
    this.center = clampLatLon({ lat, lon });
    this.zoom = clampZoom(zoom);
    this.render();
  }

  setSpots(spots) {
    this.spots = spots;
    this.renderMarkers();
  }

  setCurrentPosition(position) {
    this.currentPosition = position;
    this.renderMarkers();
  }

  zoomBy(delta) {
    this.zoom = clampZoom(this.zoom + delta);
    this.render();
  }

  attachEvents() {
    this.root.addEventListener('pointerdown', (event) => {
      this.drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        centerPx: project(this.center.lat, this.center.lon, this.zoom),
      };
      this.root.setPointerCapture(event.pointerId);
    });

    this.root.addEventListener('pointermove', (event) => {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;
      const dx = event.clientX - this.drag.startX;
      const dy = event.clientY - this.drag.startY;
      const nextPx = {
        x: this.drag.centerPx.x - dx,
        y: this.drag.centerPx.y - dy,
      };
      this.center = unproject(nextPx.x, nextPx.y, this.zoom);
      this.render();
    });

    const endDrag = (event) => {
      if (this.drag && event.pointerId === this.drag.pointerId) this.drag = null;
    };
    this.root.addEventListener('pointerup', endDrag);
    this.root.addEventListener('pointercancel', endDrag);

    this.root.addEventListener('wheel', (event) => {
      event.preventDefault();
      this.zoomBy(event.deltaY < 0 ? 1 : -1);
    }, { passive: false });
  }

  render() {
    this.renderTiles();
    this.renderMarkers();
  }

  renderTiles() {
    const rect = this.root.getBoundingClientRect();
    const centerPx = project(this.center.lat, this.center.lon, this.zoom);
    const topLeft = {
      x: centerPx.x - rect.width / 2,
      y: centerPx.y - rect.height / 2,
    };
    const startX = Math.floor(topLeft.x / TILE_SIZE) - 1;
    const startY = Math.floor(topLeft.y / TILE_SIZE) - 1;
    const endX = Math.floor((topLeft.x + rect.width) / TILE_SIZE) + 1;
    const endY = Math.floor((topLeft.y + rect.height) / TILE_SIZE) + 1;
    const maxTile = 2 ** this.zoom;

    const fragment = document.createDocumentFragment();

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        if (y < 0 || y >= maxTile) continue;
        const wrappedX = ((x % maxTile) + maxTile) % maxTile;
        const img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        img.loading = 'eager';
        img.src = DEFAULT_TILE_URL
          .replace('{z}', String(this.zoom))
          .replace('{x}', String(wrappedX))
          .replace('{y}', String(y));
        img.style.left = `${x * TILE_SIZE - topLeft.x}px`;
        img.style.top = `${y * TILE_SIZE - topLeft.y}px`;
        fragment.appendChild(img);
      }
    }

    this.tileLayer.replaceChildren(fragment);
  }

  renderMarkers() {
    const rect = this.root.getBoundingClientRect();
    const centerPx = project(this.center.lat, this.center.lon, this.zoom);
    const fragment = document.createDocumentFragment();

    if (this.currentPosition) {
      const p = project(this.currentPosition.lat, this.currentPosition.lon, this.zoom);
      const x = p.x - centerPx.x + rect.width / 2;
      const y = p.y - centerPx.y + rect.height / 2;

      if (Number.isFinite(this.currentPosition.accuracy)) {
        const radiusPx = metersToPixels(this.currentPosition.accuracy, this.currentPosition.lat, this.zoom);
        const ring = document.createElement('div');
        ring.className = 'accuracy-ring';
        ring.style.left = `${x}px`;
        ring.style.top = `${y}px`;
        ring.style.width = `${Math.max(radiusPx * 2, 14)}px`;
        ring.style.height = `${Math.max(radiusPx * 2, 14)}px`;
        fragment.appendChild(ring);
      }

      const marker = document.createElement('div');
      marker.className = 'marker current';
      marker.style.left = `${x}px`;
      marker.style.top = `${y}px`;
      marker.title = 'Текущее местоположение';
      fragment.appendChild(marker);
    }

    for (const spot of this.spots) {
      const p = project(spot.lat, spot.lon, this.zoom);
      const x = p.x - centerPx.x + rect.width / 2;
      const y = p.y - centerPx.y + rect.height / 2;
      if (x < -80 || y < -80 || x > rect.width + 80 || y > rect.height + 80) continue;

      const marker = document.createElement('button');
      marker.className = 'marker';
      marker.type = 'button';
      marker.style.left = `${x}px`;
      marker.style.top = `${y}px`;
      marker.title = spot.name || 'Сохранённая точка';
      marker.innerHTML = `<span>${escapeHtml((spot.species || spot.name || '🍄').slice(0, 12))}</span>`;
      marker.addEventListener('click', (event) => {
        event.stopPropagation();
        this.onSpotClick?.(spot.id);
      });
      fragment.appendChild(marker);
    }

    this.markerLayer.replaceChildren(fragment);
  }
}

export function project(lat, lon, zoom) {
  const sinLat = Math.sin(lat * Math.PI / 180);
  const scale = TILE_SIZE * (2 ** zoom);
  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

export function unproject(x, y, zoom) {
  const scale = TILE_SIZE * (2 ** zoom);
  const lon = x / scale * 360 - 180;
  const n = Math.PI - 2 * Math.PI * y / scale;
  const lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return clampLatLon({ lat, lon });
}

function metersToPixels(meters, lat, zoom) {
  const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / (2 ** zoom);
  return meters / metersPerPixel;
}

function clampLatLon({ lat, lon }) {
  return {
    lat: Math.max(-85, Math.min(85, Number(lat))),
    lon: ((((Number(lon) + 180) % 360) + 360) % 360) - 180,
  };
}

function clampZoom(zoom) {
  return Math.max(1, Math.min(19, Math.round(zoom)));
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}
