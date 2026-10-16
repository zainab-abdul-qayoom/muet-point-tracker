// MUET Point Tracker - Shared Route Accent Colors & Tokens
// Route 01: Cyan / Teal
// Route 02: Green / Emerald (Campus Primary)
// Route 03: Purple / Violet
// Route 04: Orange
// Route 05: Blue / Sky

export const ROUTE_COLORS = {
  'route-01': {
    primary: '#14b8a6', // Teal
    bg: 'bg-teal-500/15',
    text: 'text-teal-300',
    border: 'border-teal-500/40',
    ring: 'ring-teal-500/30',
    badge: 'bg-teal-950/80 text-teal-300 border-teal-800/80',
    badgeLight: 'bg-teal-50 text-teal-700 border-teal-300',
    hex: '#14b8a6'
  },
  'route-02': {
    primary: '#10b981', // Emerald / Green
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    ring: 'ring-emerald-500/30',
    badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    badgeLight: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    hex: '#10b981'
  },
  'route-03': {
    primary: '#a855f7', // Purple / Violet
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-500/40',
    ring: 'ring-purple-500/30',
    badge: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
    badgeLight: 'bg-purple-50 text-purple-700 border-purple-300',
    hex: '#a855f7'
  },
  'route-04': {
    primary: '#f97316', // Orange
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    border: 'border-orange-500/40',
    ring: 'ring-orange-500/30',
    badge: 'bg-orange-950/80 text-orange-300 border-orange-800/80',
    badgeLight: 'bg-orange-50 text-orange-700 border-orange-300',
    hex: '#f97316'
  },
  'route-05': {
    primary: '#3b82f6', // Blue
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    border: 'border-blue-500/40',
    ring: 'ring-blue-500/30',
    badge: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
    badgeLight: 'bg-blue-50 text-blue-700 border-blue-300',
    hex: '#3b82f6'
  }
};

export function getRouteColor(routeId) {
  return ROUTE_COLORS[routeId] || ROUTE_COLORS['route-02'];
}

export function formatPointNumber(numberStr) {
  if (!numberStr) return 'Point';
  // Replaces "Bus 03" with "Point 03"
  return numberStr.replace(/^Bus\s*/i, 'Point ');
}

export function getPointShortNumber(numberStr) {
  if (!numberStr) return 'PT';
  const match = numberStr.match(/\d+/);
  return match ? match[0] : 'PT';
}
