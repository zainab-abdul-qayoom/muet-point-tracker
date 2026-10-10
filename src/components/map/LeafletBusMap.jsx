import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { MUET_CAMPUS_COORDS } from '../../data/mockData';

export default function LeafletBusMap({ height = '460px', showControls = true, focusedBusId = null }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef([]);
  const stopsLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const { buses, routes, setSelectedBus, setSelectedRoute, theme } = useApp();

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: MUET_CAMPUS_COORDS,
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB tile layer dynamically matches selected theme (Positron light vs Dark matter)
      const tileUrl = theme === 'light'
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      if (showControls) {
        L.control.zoom({ position: 'bottomright' }).addTo(map);
      }

      mapInstanceRef.current = map;
    }

    return () => {
      // Keep instance or destroy on unmount
    };
  }, []);

  // Update Tile Layer dynamically when Theme changes
  useEffect(() => {
    if (tileLayerRef.current) {
      const tileUrl = theme === 'light'
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      tileLayerRef.current.setUrl(tileUrl);
    }
  }, [theme]);

  // Draw Route Polylines and Stops
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old polylines
    polylinesRef.current.forEach((pl) => map.removeLayer(pl));
    polylinesRef.current = [];

    if (stopsLayerRef.current) {
      map.removeLayer(stopsLayerRef.current);
    }

    const stopsGroup = L.layerGroup();

    (routes || []).forEach((route) => {
      if (Array.isArray(route.pathCoordinates) && route.pathCoordinates.length > 1) {
        const validCoords = route.pathCoordinates.filter(
          (c) => Array.isArray(c) && c.length === 2 && !isNaN(c[0]) && !isNaN(c[1])
        );
        if (validCoords.length > 1) {
          try {
            const polyline = L.polyline(validCoords, {
              color: route.color || '#10b981',
              weight: 4,
              opacity: 0.85,
              dashArray: route.id === 'route-02' ? null : '6, 6',
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(map);

            polyline.bindTooltip(
              `<div class="font-semibold text-xs py-0.5 px-1">${route.number || ''}: ${route.name || ''}</div>`,
              { sticky: true, className: theme === 'light' ? 'bg-white text-slate-900 border border-slate-200 rounded shadow font-semibold' : 'bg-[#0f221a] text-emerald-400 border border-emerald-900 rounded shadow' }
            );

            polylinesRef.current.push(polyline);
          } catch (e) {
            console.warn('Polyline render skip:', e);
          }
        }
      }

      // Add stops defensively
      if (Array.isArray(route.stops)) {
        route.stops.forEach((stop) => {
          const coords = stop.coords || (stop.lat != null && stop.lng != null ? [Number(stop.lat), Number(stop.lng)] : null);
          if (!coords || !Array.isArray(coords) || coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
            return;
          }

          try {
            const stopMarker = L.circleMarker(coords, {
              radius: stop.isMajor ? 5 : 3.5,
              color: route.color || '#10b981',
              fillColor: theme === 'light' ? '#FFFFFF' : '#0a1713',
              fillOpacity: 0.9,
              weight: 2
            });

            stopMarker.bindTooltip(
              `<div class="text-xs font-medium ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}">
                <span class="${theme === 'light' ? 'text-blue-600' : 'text-emerald-400'} font-bold">${stop.name || 'Stop'}</span>
                <div class="text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}">ETA: ${stop.eta || stop.eta_text || '5 min'} • ${route.number || ''}</div>
              </div>`,
              { direction: 'top', offset: [0, -6], className: theme === 'light' ? 'bg-white text-slate-800 border border-slate-200 rounded px-2 py-1 shadow' : 'bg-[#0f221a] text-slate-200 border border-emerald-900/60 rounded px-2 py-1' }
            );

            stopsGroup.addLayer(stopMarker);
          } catch (e) {
            console.warn('Stop marker render skip:', e);
          }
        });
      }
    });

    stopsGroup.addTo(map);
    stopsLayerRef.current = stopsGroup;
  }, [routes, theme]);

  // Update Bus Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    (buses || []).forEach((bus) => {
      // Don't render offline/inactive buses without valid coordinates
      const coords = bus.coords || (bus.current_lat != null && bus.current_lng != null ? [Number(bus.current_lat), Number(bus.current_lng)] : null);
      if (!coords || !Array.isArray(coords) || coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
        return;
      }

      const isFocused = focusedBusId === bus.id;
      const isBus03 = bus.number === 'Bus 03';

      const tagBgClass = theme === 'light'
        ? 'bg-white/95 border border-slate-300 text-slate-800 shadow'
        : 'bg-[#0b1b15]/95 border border-emerald-500/40 text-emerald-300 shadow-lg';

      const pinBgClass = theme === 'light'
        ? (isBus03 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-blue-300 border border-blue-400')
        : (isBus03 ? 'bg-emerald-500 text-slate-950' : 'bg-[#153427] text-emerald-400 border border-emerald-400/50');

      const markerHtml = `
        <div class="relative group cursor-pointer flex flex-col items-center">
          <!-- Floating ETA tag -->
          <div class="absolute -top-9 whitespace-nowrap ${tagBgClass} backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-transform hover:scale-105 z-20">
            <span class="w-1.5 h-1.5 rounded-full ${bus.isOnline ? (theme === 'light' ? 'bg-blue-500 animate-ping' : 'bg-emerald-400 animate-ping') : 'bg-slate-400'}"></span>
            <span>${bus.number}</span>
            <span class="${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} font-normal">ETA ${bus.eta || '5 min'}</span>
          </div>

          <!-- Bus Pin Marker -->
          <div class="w-8 h-8 rounded-full ${pinBgClass} flex items-center justify-center shadow-lg relative ${bus.isOnline ? 'bus-pulse' : ''}">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
            </svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-bus-marker',
        html: markerHtml,
        iconSize: [36, 48],
        iconAnchor: [18, 24]
      });

      if (markersRef.current[bus.id]) {
        // Move existing marker smoothly
        try {
          markersRef.current[bus.id].setLatLng(coords);
          markersRef.current[bus.id].setIcon(customIcon);
        } catch (e) {
          console.warn('Update marker error:', e);
        }
      } else {
        // Create new marker
        try {
          const marker = L.marker(coords, { icon: customIcon }).addTo(map);

          marker.on('click', () => {
            setSelectedBus(bus);
            const foundRoute = routes.find((r) => r.id === bus.routeId);
            if (foundRoute) setSelectedRoute(foundRoute);
          });

          markersRef.current[bus.id] = marker;
        } catch (e) {
          console.warn('Create marker error:', e);
        }
      }
    });

    // Cleanup decommissioned buses
    Object.keys(markersRef.current).forEach((busId) => {
      if (!buses.some((b) => b.id === busId)) {
        try {
          map.removeLayer(markersRef.current[busId]);
        } catch (e) {}
        delete markersRef.current[busId];
      }
    });
  }, [buses, focusedBusId, theme]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-emerald-950/60 shadow-2xl bg-[#091510]">
      <div ref={mapContainerRef} style={{ height }} className="w-full z-10" />

      {/* Floating Center on MUET button */}
      <button
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(MUET_CAMPUS_COORDS, 14);
          }
        }}
        title="Recenter on MUET Jamshoro"
        className="absolute bottom-4 left-4 z-20 bg-[#0f221a]/90 hover:bg-[#153427] text-emerald-400 border border-emerald-800/70 p-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm transition-all"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        MUET Main Campus
      </button>

      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-20 hidden sm:flex items-center gap-3 bg-[#0c1c15]/90 border border-emerald-900/60 px-3 py-1.5 rounded-lg backdrop-blur-md text-[11px] text-slate-300">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>Route 02 (Tando Bago)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
          <span>Route 03 (DMC)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
          <span>Route 04 (Hyderabad)</span>
        </div>
      </div>
    </div>
  );
}
