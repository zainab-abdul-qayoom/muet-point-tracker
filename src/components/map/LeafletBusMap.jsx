import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { MUET_CAMPUS_COORDS } from '../../data/mockData';
import { getRouteColor, formatPointNumber, getPointShortNumber } from '../../utils/routeColors';

export default function LeafletBusMap({ height = '460px', showControls = true, focusedBusId = null }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef([]);
  const stopsLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [tileError, setTileError] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

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

      // 100% Free OpenStreetMap tile server with zero watermark
      const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        className: theme === 'light' ? 'light-osm-tiles' : 'dark-tiles'
      }).addTo(map);

      tileLayer.on('tileerror', () => {
        setTileError(true);
      });

      tileLayerRef.current = tileLayer;

      if (showControls) {
        L.control.zoom({ position: 'bottomright' }).addTo(map);
      }

      mapInstanceRef.current = map;
    }

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Invalidate size when height prop changes or container mounts
  useEffect(() => {
    if (mapInstanceRef.current) {
      const t1 = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
      const t2 = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [height]);

  // Update Tile Layer theme dynamically
  useEffect(() => {
    if (tileLayerRef.current && mapInstanceRef.current) {
      const container = mapContainerRef.current;
      if (container) {
        const tiles = container.querySelectorAll('.leaflet-tile-pane');
        tiles.forEach((t) => {
          if (theme === 'light') {
            t.classList.remove('dark-tiles');
          } else {
            t.classList.add('dark-tiles');
          }
        });
      }
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

  // Update Point Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    (buses || []).forEach((bus) => {
      // Don't render offline/inactive points without valid coordinates
      const coords = bus.coords || (bus.current_lat != null && bus.current_lng != null ? [Number(bus.current_lat), Number(bus.current_lng)] : null);
      if (!coords || !Array.isArray(coords) || coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
        return;
      }

      const isFocused = focusedBusId === bus.id;
      const routeConfig = getRouteColor(bus.routeId);
      const pointLabel = formatPointNumber(bus.number);
      const shortNum = getPointShortNumber(bus.number);

      const tagBgClass = theme === 'light'
        ? 'bg-white/95 border border-slate-300 text-slate-800 shadow'
        : 'bg-[#0f172a]/95 border border-slate-700/80 text-slate-100 shadow-xl';

      const markerHtml = `
        <div class="relative group cursor-pointer flex flex-col items-center">
          <!-- Floating ETA tag: compact on mobile to prevent label collision -->
          <div class="absolute -top-9 whitespace-nowrap ${tagBgClass} backdrop-blur-md px-2 py-0.5 rounded-full text-[10.5px] font-bold flex items-center gap-1.5 transition-transform hover:scale-105 z-20">
            <span class="w-1.5 h-1.5 rounded-full ${bus.isOnline ? 'bg-[#22C55E] animate-ping' : 'bg-slate-400'}"></span>
            <span style="color: ${routeConfig.hex}">${pointLabel}</span>
            <span class="${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} font-normal">ETA ${bus.eta || '5 min'}</span>
          </div>

          <!-- Point Badge Marker: displays route-colored number -->
          <div
            style="background-color: ${routeConfig.hex}; box-shadow: 0 0 14px ${bus.isOnline ? routeConfig.hex + '88' : 'transparent'};"
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-slate-950 font-black text-[11px] sm:text-xs flex items-center justify-center border-2 border-white shadow-lg relative ${bus.isOnline ? 'bus-pulse' : ''}"
          >
            ${shortNum}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-point-marker',
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

    // Cleanup decommissioned points
    Object.keys(markersRef.current).forEach((busId) => {
      if (!buses.some((b) => b.id === busId)) {
        try {
          map.removeLayer(markersRef.current[busId]);
        } catch (e) {}
        delete markersRef.current[busId];
      }
    });
  }, [buses, focusedBusId, theme, routes]);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-emerald-950/60 shadow-2xl bg-[#091510] flex-1"
      style={{ minHeight: '340px', height: height === '100%' ? '100%' : 'auto' }}
    >
      <div
        ref={mapContainerRef}
        style={{ height, minHeight: '340px' }}
        className="w-full h-full z-10"
      />

      {/* Friendly Tile Fallback Overlay */}
      {tileError && (
        <div className="absolute top-3 left-3 z-20 bg-amber-950/80 border border-amber-600/50 text-amber-200 text-[11px] px-2.5 py-1 rounded-lg backdrop-blur-md">
          <span>Map tile service offline • Live telemetry markers active</span>
        </div>
      )}

      {/* Floating Center on MUET button */}
      <button
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(MUET_CAMPUS_COORDS, 14);
          }
        }}
        title="Recenter on MUET Jamshoro"
        className="absolute bottom-4 left-4 z-20 bg-[#0f221a]/90 hover:bg-[#153427] text-emerald-400 border border-emerald-800/70 p-2 sm:p-2.5 rounded-lg shadow-lg text-[11px] sm:text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm transition-all cursor-pointer"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>MUET Main Campus</span>
      </button>

      {/* Responsive Map Legend */}
      <div className="absolute top-3 right-3 z-20">
        {/* Desktop Legend */}
        <div className="hidden sm:flex items-center gap-3 bg-[#0c1c15]/90 border border-emerald-900/60 px-3 py-1.5 rounded-lg backdrop-blur-md text-[11px] text-slate-300">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
            <span>Route 02 (Tando Bago)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></span>
            <span>Route 03 (DMC)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
            <span>Route 04 (Hyderabad)</span>
          </div>
        </div>

        {/* Mobile Collapsible Legend */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="bg-[#0c1c15]/95 border border-emerald-900/60 px-2 py-1 rounded-lg backdrop-blur-md text-[10px] text-slate-300 flex items-center gap-1"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Routes Legend {isLegendOpen ? '▴' : '▾'}</span>
          </button>
          {isLegendOpen && (
            <div className="mt-1 bg-[#0c1c15]/95 border border-emerald-900/60 p-2 rounded-lg backdrop-blur-md text-[10px] text-slate-300 space-y-1 shadow-xl">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                <span>Route 02: Tando Bago</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>
                <span>Route 03: DMC / Kotri</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f97316]"></span>
                <span>Route 04: Hyderabad City</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-1 right-12 z-20 text-[9px] text-slate-500 bg-black/40 px-1 rounded pointer-events-none">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}
