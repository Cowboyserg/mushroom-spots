/* Mushroom Spots Leaflet Offline Lite Runtime
 * This is not a tile renderer. It is a tiny Leaflet-compatible fallback that
 * keeps the map interaction layer alive when the external Leaflet CDN is not
 * available. The no-basemap provider can still show GPS, saved spots, picked
 * points, chat preview points, friend live markers, popups, and simple lines.
 */
(function () {
  if (window.L) return;

  const NS = 'http://www.w3.org/2000/svg';
  const TILE_SIZE = 256;
  const MAX_LAT = 85.05112878;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeLatLng(input) {
    if (Array.isArray(input)) return { lat: Number(input[0]), lng: Number(input[1]) };
    if (input && typeof input === 'object') {
      return { lat: Number(input.lat), lng: Number(input.lng ?? input.lon) };
    }
    return { lat: 0, lng: 0 };
  }

  function project(latlng, zoom) {
    const scale = TILE_SIZE * Math.pow(2, zoom);
    const lat = clamp(Number(latlng.lat) || 0, -MAX_LAT, MAX_LAT);
    const lng = Number(latlng.lng) || 0;
    const sin = Math.sin((lat * Math.PI) / 180);
    return {
      x: ((lng + 180) / 360) * scale,
      y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale
    };
  }

  function unproject(point, zoom) {
    const scale = TILE_SIZE * Math.pow(2, zoom);
    const lng = (point.x / scale) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * point.y) / scale;
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    return { lat, lng };
  }

  function toPointFromDomEvent(ev, container) {
    const src = ev.touches && ev.touches[0] ? ev.touches[0] : ev.changedTouches && ev.changedTouches[0] ? ev.changedTouches[0] : ev;
    const rect = container.getBoundingClientRect();
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  class Evented {
    constructor() {
      this._events = new Map();
    }
    on(type, handler) {
      for (const name of String(type).split(/\s+/).filter(Boolean)) {
        if (!this._events.has(name)) this._events.set(name, []);
        this._events.get(name).push(handler);
      }
      return this;
    }
    off(type, handler) {
      for (const name of String(type).split(/\s+/).filter(Boolean)) {
        if (!this._events.has(name)) continue;
        if (!handler) {
          this._events.delete(name);
          continue;
        }
        this._events.set(name, this._events.get(name).filter((fn) => fn !== handler));
      }
      return this;
    }
    fire(type, payload = {}) {
      const event = { type, target: this, ...payload };
      for (const handler of this._events.get(type) || []) {
        try { handler(event); } catch (err) { setTimeout(() => { throw err; }); }
      }
      return this;
    }
  }

  class LiteMap extends Evented {
    constructor(element, options = {}) {
      super();
      this._container = typeof element === 'string' ? document.getElementById(element) : element;
      this.options = options;
      this._center = { lat: 56.9496, lng: 24.1052 };
      this._zoom = 12;
      this._layers = new Set();
      this.attributionControl = { setPrefix: () => this };
      this._setupDom();
      this._bindDomEvents();
      setTimeout(() => this.fire('load'), 0);
    }

    _setupDom() {
      const el = this._container;
      el.classList.add('leaflet-container', 'leaflet-offline-lite');
      el.setAttribute('data-map-runtime', 'leaflet-offline-lite');
      el.innerHTML = '';

      this._mapPane = document.createElement('div');
      this._mapPane.className = 'leaflet-map-pane';
      this._mapPane.style.width = '100%';
      this._mapPane.style.height = '100%';

      this._emptyPane = document.createElement('div');
      this._emptyPane.className = 'leaflet-tile-pane leaflet-offline-lite-empty';
      this._emptyPane.innerHTML = '<div class="leaflet-offline-lite-label">Подложка карты недоступна<br><span>GPS и точки работают</span></div>';

      this._overlayPane = document.createElement('div');
      this._overlayPane.className = 'leaflet-overlay-pane';
      this._markerPane = document.createElement('div');
      this._markerPane.className = 'leaflet-marker-pane';
      this._popupPane = document.createElement('div');
      this._popupPane.className = 'leaflet-popup-pane';

      this._svg = document.createElementNS(NS, 'svg');
      this._svg.setAttribute('class', 'leaflet-zoom-animated leaflet-layer');
      this._svg.style.width = '100%';
      this._svg.style.height = '100%';
      this._svg.style.overflow = 'visible';
      this._overlayPane.appendChild(this._svg);

      this._mapPane.appendChild(this._emptyPane);
      this._mapPane.appendChild(this._overlayPane);
      this._mapPane.appendChild(this._markerPane);
      this._mapPane.appendChild(this._popupPane);
      el.appendChild(this._mapPane);
    }

    _bindDomEvents() {
      const bind = (domType, mapType = domType) => {
        this._container.addEventListener(domType, (ev) => {
          if (domType === 'contextmenu') ev.preventDefault();
          const containerPoint = toPointFromDomEvent(ev, this._container);
          const latlng = this.containerPointToLatLng(containerPoint);
          this.fire(mapType, { originalEvent: ev, containerPoint, latlng });
        }, { passive: domType !== 'contextmenu' });
      };
      ['contextmenu', 'mousedown', 'mousemove', 'mouseup', 'mouseout', 'touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((type) => bind(type));
    }

    setView(latlng, zoom) {
      this._center = normalizeLatLng(latlng);
      if (Number.isFinite(Number(zoom))) this._zoom = Number(zoom);
      this._renderLayers();
      this.fire('moveend');
      this.fire('zoomend');
      return this;
    }

    getCenter() { return { ...this._center }; }
    getZoom() { return this._zoom; }
    getSize() {
      const rect = this._container.getBoundingClientRect();
      return { x: Math.round(rect.width), y: Math.round(rect.height) };
    }
    invalidateSize() {
      this._renderLayers();
      this.fire('resize');
      return this;
    }
    fitBounds(bounds) {
      if (bounds && typeof bounds.getCenter === 'function') {
        this.setView(bounds.getCenter(), this._zoom);
      }
      return this;
    }
    scrollWheelZoom() { return this; }

    latLngToContainerPoint(latlngInput) {
      const latlng = normalizeLatLng(latlngInput);
      const size = this.getSize();
      const center = project(this._center, this._zoom);
      const point = project(latlng, this._zoom);
      return { x: point.x - center.x + size.x / 2, y: point.y - center.y + size.y / 2 };
    }

    containerPointToLatLng(point) {
      const size = this.getSize();
      const center = project(this._center, this._zoom);
      return unproject({ x: center.x + point.x - size.x / 2, y: center.y + point.y - size.y / 2 }, this._zoom);
    }

    _addLayer(layer) {
      this._layers.add(layer);
      layer._map = this;
      if (typeof layer._onAdd === 'function') layer._onAdd(this);
      this._renderLayers();
      return layer;
    }

    _removeLayer(layer) {
      this._layers.delete(layer);
      if (typeof layer._onRemove === 'function') layer._onRemove();
      if (this._openPopupOwner === layer) this._closePopup();
      layer._map = null;
      return layer;
    }

    _renderLayers() {
      for (const layer of this._layers) {
        if (typeof layer._render === 'function') layer._render();
      }
      if (this._openPopupOwner && typeof this._openPopupOwner._positionPopup === 'function') {
        this._openPopupOwner._positionPopup();
      }
    }

    _openPopup(owner, html) {
      this._closePopup();
      const popup = document.createElement('div');
      popup.className = 'leaflet-popup leaflet-zoom-animated leaflet-offline-lite-popup';
      popup.innerHTML = `<div class="leaflet-popup-content-wrapper"><div class="leaflet-popup-content">${html || ''}</div></div>`;
      this._popupPane.appendChild(popup);
      this._openPopupOwner = owner;
      owner._popupEl = popup;
      owner._positionPopup();
      this.fire('popupopen', { popup });
    }

    _closePopup() {
      if (this._openPopupOwner && this._openPopupOwner._popupEl) {
        this._openPopupOwner._popupEl.remove();
        this._openPopupOwner._popupEl = null;
      }
      this._openPopupOwner = null;
    }
  }

  class LiteIcon {
    constructor(options = {}) {
      this.options = options;
    }
  }

  class LiteMarker extends Evented {
    constructor(latlng, options = {}) {
      super();
      this._latlng = normalizeLatLng(latlng);
      this.options = options;
      this._popupHtml = '';
    }
    addTo(map) { map._addLayer(this); return this; }
    remove() { if (this._map) this._map._removeLayer(this); return this; }
    setLatLng(latlng) { this._latlng = normalizeLatLng(latlng); this._render(); return this; }
    setIcon(icon) {
      this.options.icon = icon;
      if (this._el) {
        const iconOptions = icon && icon.options ? icon.options : {};
        this._el.className = `leaflet-marker-icon ${iconOptions.className || ''}`.trim();
        this._el.innerHTML = iconOptions.html || '<div class="map-dot"></div>';
      }
      this._render();
      return this;
    }
    bindPopup(html) { this._popupHtml = html || ''; return this; }
    setPopupContent(html) { this._popupHtml = html || ''; if (this._popupEl) this._popupEl.querySelector('.leaflet-popup-content').innerHTML = this._popupHtml; return this; }
    openPopup() { if (this._map) this._map._openPopup(this, this._popupHtml); return this; }
    _onAdd(map) {
      this._el = document.createElement('div');
      const icon = this.options.icon && this.options.icon.options ? this.options.icon.options : {};
      this._el.className = `leaflet-marker-icon ${icon.className || ''}`.trim();
      this._el.innerHTML = icon.html || '<div class="map-dot"></div>';
      this._el.title = this.options.title || '';
      this._el.style.position = 'absolute';
      this._el.style.cursor = 'pointer';
      this._el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.fire('click', { originalEvent: ev, latlng: { ...this._latlng } });
        if (this._popupHtml) this.openPopup();
      });
      map._markerPane.appendChild(this._el);
    }
    _onRemove() { if (this._el) this._el.remove(); this._el = null; }
    _render() {
      if (!this._map || !this._el) return;
      const p = this._map.latLngToContainerPoint(this._latlng);
      const icon = this.options.icon && this.options.icon.options ? this.options.icon.options : {};
      const anchor = icon.iconAnchor || [14, 14];
      this._el.style.transform = `translate3d(${Math.round(p.x - anchor[0])}px, ${Math.round(p.y - anchor[1])}px, 0)`;
      this._positionPopup();
    }
    _positionPopup() {
      if (!this._map || !this._popupEl) return;
      const p = this._map.latLngToContainerPoint(this._latlng);
      this._popupEl.style.transform = `translate3d(${Math.round(p.x - 80)}px, ${Math.round(p.y - 92)}px, 0)`;
    }
  }

  class LiteCircle extends LiteMarker {
    constructor(latlng, options = {}) {
      super(latlng, options);
      this._radius = Number(options.radius) || 0;
    }
    setRadius(radius) { this._radius = Number(radius) || 0; this._render(); return this; }
    _onAdd(map) {
      this._el = document.createElement('div');
      this._el.className = 'leaflet-offline-lite-circle';
      this._el.style.position = 'absolute';
      map._overlayPane.appendChild(this._el);
    }
    _render() {
      if (!this._map || !this._el) return;
      const p = this._map.latLngToContainerPoint(this._latlng);
      const metersPerPixel = 156543.03392 * Math.cos((this._latlng.lat * Math.PI) / 180) / Math.pow(2, this._map.getZoom());
      const radiusPx = clamp(this._radius / Math.max(metersPerPixel, 0.001), 8, 220);
      this._el.style.width = `${Math.round(radiusPx * 2)}px`;
      this._el.style.height = `${Math.round(radiusPx * 2)}px`;
      this._el.style.borderRadius = '50%';
      this._el.style.border = '2px solid rgba(31, 94, 255, .45)';
      this._el.style.background = 'rgba(31, 94, 255, .12)';
      this._el.style.transform = `translate3d(${Math.round(p.x - radiusPx)}px, ${Math.round(p.y - radiusPx)}px, 0)`;
    }
  }

  class LitePolyline {
    constructor(latlngs, options = {}) {
      this._latlngs = (latlngs || []).map(normalizeLatLng);
      this.options = options;
    }
    addTo(map) { map._addLayer(this); return this; }
    remove() { if (this._map) this._map._removeLayer(this); return this; }
    getBounds() {
      const lats = this._latlngs.map((p) => p.lat);
      const lngs = this._latlngs.map((p) => p.lng);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      return { getCenter: () => ({ lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }) };
    }
    _onAdd(map) {
      this._path = document.createElementNS(NS, 'path');
      this._path.setAttribute('fill', 'none');
      this._path.setAttribute('stroke', 'currentColor');
      this._path.setAttribute('stroke-width', String(this.options.weight || 4));
      this._path.setAttribute('stroke-linecap', 'round');
      this._path.setAttribute('class', 'leaflet-offline-lite-polyline');
      map._svg.appendChild(this._path);
    }
    _onRemove() { if (this._path) this._path.remove(); this._path = null; }
    _render() {
      if (!this._map || !this._path) return;
      const d = this._latlngs.map((latlng, index) => {
        const p = this._map.latLngToContainerPoint(latlng);
        return `${index === 0 ? 'M' : 'L'}${Math.round(p.x)} ${Math.round(p.y)}`;
      }).join(' ');
      this._path.setAttribute('d', d);
    }
  }

  class LiteTileLayer extends Evented {
    addTo(map) {
      this._map = map;
      setTimeout(() => this.fire('tileerror', { tile: { src: 'leaflet-offline-lite:no-tile-renderer' } }), 0);
      return this;
    }
    remove() { this._map = null; return this; }
    redraw() { return this; }
  }

  window.L = {
    __mushroomOfflineLite: true,
    version: 'offline-lite-0.6.2',
    map: (element, options) => new LiteMap(element, options),
    marker: (latlng, options) => new LiteMarker(latlng, options),
    circle: (latlng, options) => new LiteCircle(latlng, options),
    polyline: (latlngs, options) => new LitePolyline(latlngs, options),
    divIcon: (options) => new LiteIcon(options),
    tileLayer: () => new LiteTileLayer()
  };
})();
