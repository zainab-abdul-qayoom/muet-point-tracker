import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  INITIAL_BUSES,
  INITIAL_ROUTES,
  INITIAL_DRIVERS,
  INITIAL_NOTIFICATIONS,
  MOCK_STUDENT_PROFILE,
  RECENT_ADMIN_ACTIVITIES
} from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Current user state (Null by default for unauthenticated users)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Clear legacy localStorage auth keys so new browser sessions always require sign-in
      localStorage.removeItem('muet_tracker_user');
      localStorage.removeItem('muet_tracker_token');

      const savedUser = sessionStorage.getItem('muet_tracker_user');
      const savedToken = sessionStorage.getItem('muet_tracker_token');
      if (savedUser && savedToken) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.isAuthenticated) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Session parse error:', e);
    }
    return null;
  });

  const [authToken, setAuthToken] = useState(() => {
    return sessionStorage.getItem('muet_tracker_token') || '';
  });

  // Theme Management: 'default' (MUET Emerald Dark) | 'light' (Clean White & Slate Blue)
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('muet_tracker_theme') || 'default';
    } catch {
      return 'default';
    }
  });

  const applyThemeToDom = useCallback((themeName) => {
    const chosen = themeName === 'light' ? 'light' : 'default';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', chosen);
      if (chosen === 'light') {
        document.documentElement.classList.add('theme-light');
        document.body.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
        document.body.classList.remove('theme-light');
      }
    }
  }, []);

  const setTheme = useCallback((newTheme) => {
    const chosen = newTheme === 'light' ? 'light' : 'default';
    setThemeState(chosen);
    try {
      localStorage.setItem('muet_tracker_theme', chosen);
    } catch (e) {
      console.warn('Could not save theme:', e);
    }
    applyThemeToDom(chosen);
  }, [applyThemeToDom]);

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme, applyThemeToDom]);

  // Tab & Navigation Permission Guards
  const getDefaultTabForRole = useCallback((role) => {
    if (role === 'Admin') return 'admin-fleet';
    if (role === 'Driver') return 'driver-trip';
    return 'home';
  }, []);

  const isTabAllowedForRole = useCallback((tab, role) => {
    if (tab === 'admin-fleet') return role === 'Admin';
    if (tab === 'driver-trip') return role === 'Driver' || role === 'Admin';
    return true; // Student and shared public views
  }, []);

  // Initialize activeTab with session validation (prevents unauthenticated tab restoration)
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('muet_tracker_user');
      const savedToken = sessionStorage.getItem('muet_tracker_token');
      if (savedUser && savedToken) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.isAuthenticated) {
          const savedTab = sessionStorage.getItem('muet_active_tab');
          if (savedTab && (savedTab !== 'admin-fleet' || parsed.role === 'Admin') && (savedTab !== 'driver-trip' || parsed.role === 'Driver' || parsed.role === 'Admin')) {
            return savedTab;
          }
          if (parsed.role === 'Admin') return 'admin-fleet';
          if (parsed.role === 'Driver') return 'driver-trip';
          return 'home';
        }
      }
    } catch (e) {
      console.warn('Tab restore error:', e);
    }
    return 'home';
  });

  const setActiveTab = useCallback((newTab) => {
    setActiveTabState(newTab);
    try {
      sessionStorage.setItem('muet_active_tab', newTab);
    } catch {}
  }, []);

  const [buses, setBuses] = useState(INITIAL_BUSES);
  const [routes, setRoutes] = useState(INITIAL_ROUTES);
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [adminActivities, setAdminActivities] = useState(RECENT_ADMIN_ACTIVITIES);

  // Selected entities for modals / focus
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & previews & responsive mobile drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Simulation controls
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // 1x, 2x, 5x
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  // Save user & token changes to sessionStorage (preserved on refresh within same session)
  useEffect(() => {
    if (currentUser && currentUser.isAuthenticated) {
      sessionStorage.setItem('muet_tracker_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('muet_tracker_user');
      sessionStorage.removeItem('muet_active_tab');
    }
  }, [currentUser]);

  useEffect(() => {
    if (authToken) {
      sessionStorage.setItem('muet_tracker_token', authToken);
    } else {
      sessionStorage.removeItem('muet_tracker_token');
    }
  }, [authToken]);

  // Verify stored session token on startup within the same session
  useEffect(() => {
    const savedToken = sessionStorage.getItem('muet_tracker_token');
    if (savedToken) {
      fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setCurrentUser(prev => ({
            ...prev,
            ...data.user,
            isAuthenticated: true,
            initials: data.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
          }));

          // Validate current activeTab against verified user's database role
          const storedTab = sessionStorage.getItem('muet_active_tab');
          if (storedTab && !isTabAllowedForRole(storedTab, data.user.role)) {
            const safeTab = getDefaultTabForRole(data.user.role);
            setActiveTabState(safeTab);
            sessionStorage.setItem('muet_active_tab', safeTab);
          }
        } else {
          // Token expired or invalid
          setCurrentUser(null);
          setAuthToken('');
          sessionStorage.removeItem('muet_tracker_user');
          sessionStorage.removeItem('muet_tracker_token');
          sessionStorage.removeItem('muet_active_tab');
          setActiveTabState('home');
        }
      })
      .catch(() => {
        // Offline / network failure: allow existing cached user to remain
      });
    } else {
      sessionStorage.removeItem('muet_active_tab');
    }
  }, [getDefaultTabForRole, isTabAllowedForRole]);

  // Ensure Admin user has a valid token for API actions
  const refreshAuthToken = useCallback(async (role, identifier, password) => {
    try {
      let id = identifier;
      let pwd = password;

      if (!id || !pwd) {
        if (role === 'Admin') {
          id = 'admin@muet.edu.pk';
          pwd = 'admin123';
        } else if (role === 'Driver') {
          id = 'DRV-7712';
          pwd = 'driver123';
        } else {
          id = 'MUET-2023-CS-001';
          pwd = 'password123';
        }
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id, password: pwd })
      });

      const data = await res.json();
      if (data.success && data.token) {
        setAuthToken(data.token);
        return data.token;
      }
    } catch (err) {
      console.warn('Could not refresh auth token:', err);
    }
    return null;
  }, []);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);

  // Fetch and sync buses, routes, and notifications permanently from SQLite on load
  const loadDataFromBackend = useCallback(async () => {
    try {
      setIsLoadingData(true);
      setDataError(null);

      // 1. Fetch routes first so buses have route information
      let loadedRoutes = INITIAL_ROUTES;
      try {
        const routeRes = await fetch('/api/routes');
        const routeData = await routeRes.json();
        if (routeData.success && Array.isArray(routeData.data) && routeData.data.length > 0) {
          loadedRoutes = routeData.data.map((dbRoute) => {
            const initialMatch = INITIAL_ROUTES.find((r) => r.id === dbRoute.id || r.number === dbRoute.number);
            const dbStops = Array.isArray(dbRoute.stops) ? dbRoute.stops : [];
            const mappedStops = dbStops.map((s, idx) => {
              const fallbackStop = initialMatch?.stops?.find((ms) => ms.name === s.name || ms.id === s.id);
              const coords = s.coords || (s.lat != null && s.lng != null ? [Number(s.lat), Number(s.lng)] : fallbackStop?.coords) || [25.4057, 68.2618];
              return {
                id: s.id || `stop-${idx}`,
                name: s.name,
                coords: coords,
                eta: s.eta || s.eta_text || fallbackStop?.eta || '5 min',
                isMajor: Boolean(s.is_major || s.isMajor || fallbackStop?.isMajor)
              };
            });

            const pathCoordinates = (initialMatch?.pathCoordinates && initialMatch.pathCoordinates.length > 1)
              ? initialMatch.pathCoordinates
              : (mappedStops.length > 1 ? mappedStops.map((s) => s.coords) : (initialMatch?.pathCoordinates || []));

            return {
              ...initialMatch,
              ...dbRoute,
              stops: mappedStops.length > 0 ? mappedStops : (initialMatch?.stops || []),
              pathCoordinates
            };
          });
          setRoutes(loadedRoutes);
        }
      } catch (rErr) {
        console.warn('Routes fetch notice:', rErr.message);
      }

      // 2. Fetch live buses
      try {
        const busRes = await fetch('/api/buses');
        const busData = await busRes.json();

        if (busData.success && Array.isArray(busData.data) && busData.data.length > 0) {
          setBuses((prevBuses) => {
            return busData.data.map((dbBus) => {
              const existing = prevBuses.find((p) => p.id === dbBus.id || p.number === dbBus.number);
              const route = loadedRoutes.find((r) => r.id === dbBus.route_id);
              const routeName = route ? route.name : (dbBus.route_name || 'Main Campus ➔ Hyderabad');

              let badgeType = 'green';
              if (dbBus.status === 'Maintenance') badgeType = 'amber';
              else if (dbBus.status === 'Inactive') badgeType = 'slate';
              else if (dbBus.number === 'Bus 05') badgeType = 'purple';
              else if (dbBus.number === 'Bus 07' || dbBus.number === 'Bus 09') badgeType = 'orange';
              else if (dbBus.number === 'Bus 04') badgeType = 'cyan';

              const coords = existing?.coords || [Number(dbBus.current_lat) || 25.4057, Number(dbBus.current_lng) || 68.2618];

              return {
                id: dbBus.id,
                number: dbBus.number,
                plate: dbBus.plate,
                routeId: dbBus.route_id,
                routeName: routeName,
                driverId: dbBus.driver_id || 'drv-01',
                driverName: dbBus.driver_name || 'Assigned Driver',
                driverPhone: existing?.driverPhone || '+92 300 1234567',
                status: dbBus.status || 'Arriving',
                statusColor: dbBus.status === 'Maintenance' ? 'amber' : dbBus.status === 'Inactive' ? 'slate' : 'emerald',
                badgeType: badgeType,
                eta: dbBus.eta || '5 min',
                speed: dbBus.speed || '40 km/h',
                capacity: dbBus.capacity || 65,
                passengers: dbBus.passengers || 0,
                occupancyLevel: (dbBus.passengers || 0) > 55 ? 'Crowded' : 'Comfortable',
                coords: coords,
                currentLocationName: dbBus.current_location_name || 'Main Campus Terminal',
                nextStopName: dbBus.next_stop_name || 'Academic Block',
                targetProgress: existing?.targetProgress || 0.15,
                isOnline: Boolean(dbBus.is_online),
                lastUpdate: 'Just now'
              };
            });
          });
        }
      } catch (bErr) {
        console.warn('Buses fetch notice:', bErr.message);
      }

      // 3. Fetch notifications
      try {
        const notifRes = await fetch('/api/notifications');
        const notifData = await notifRes.json();
        if (notifData.success && Array.isArray(notifData.data) && notifData.data.length > 0) {
          setNotifications(notifData.data);
        }
      } catch (nErr) {
        console.warn('Notifications fetch notice:', nErr.message);
      }
    } catch (err) {
      console.warn('Backend API sync notice:', err.message);
      setDataError(err.message);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadDataFromBackend();
    // Also acquire token for active user if missing
    if (!authToken && currentUser?.isAuthenticated) {
      refreshAuthToken(currentUser.role);
    }
  }, []);

  // Real-time bus movement simulation engine along route coordinates
  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      setBuses((prevBuses) => {
        return prevBuses.map((bus) => {
          // If offline or inactive or maintenance, don't move
          if (!bus.isOnline || bus.status === 'Maintenance' || bus.status === 'Inactive') {
            return bus;
          }

          const route = routes.find((r) => r.id === bus.routeId);
          if (!route || !route.pathCoordinates || route.pathCoordinates.length < 2) {
            return bus;
          }

          // Progress along the path
          const speedStep = 0.008 * simulationSpeed;
          let newProgress = (bus.targetProgress || 0) + speedStep;
          if (newProgress >= 1) newProgress = 0; // Loop route

          const totalSegments = route.pathCoordinates.length - 1;
          const floatIndex = newProgress * totalSegments;
          const currentIndex = Math.floor(floatIndex);
          const nextIndex = Math.min(currentIndex + 1, totalSegments);
          const segmentFraction = floatIndex - currentIndex;

          const p1 = route.pathCoordinates[currentIndex];
          const p2 = route.pathCoordinates[nextIndex];

          const lat = p1[0] + (p2[0] - p1[0]) * segmentFraction;
          const lng = p1[1] + (p2[1] - p1[1]) * segmentFraction;

          // Determine nearest next stop
          const stopIndex = Math.min(
            Math.floor(newProgress * (route.stops.length || 1)),
            route.stops.length - 1
          );
          const nextStop = route.stops[stopIndex] || { name: 'Main Campus' };

          // Dynamic simulated ETA decrement
          const remainingMinutes = Math.max(1, Math.round((1 - segmentFraction) * 6));
          const etaText = `${remainingMinutes} min`;

          return {
            ...bus,
            coords: [lat, lng],
            targetProgress: newProgress,
            eta: etaText,
            nextStopName: nextStop.name,
            lastUpdate: 'Just now'
          };
        });
      });

      setLastUpdateTime(new Date());
    }, 2000 / simulationSpeed);

    return () => clearInterval(interval);
  }, [isSimulationRunning, simulationSpeed, routes]);

  // Auth actions
  const loginUser = async (roleOrCreds, maybeCreds = {}) => {
    try {
      // Support both loginUser({ identifier, password }) and legacy loginUser(role, credentials)
      let payload = {};
      if (typeof roleOrCreds === 'object' && roleOrCreds !== null) {
        payload = roleOrCreds;
      } else {
        const role = roleOrCreds;
        payload = {
          identifier: maybeCreds.identifier || (role === 'Admin' ? 'admin@muet.edu.pk' : role === 'Driver' ? 'DRV-7712' : 'MUET-2023-CS-001'),
          password: maybeCreds.password || (role === 'Admin' ? 'admin123' : role === 'Driver' ? 'driver123' : 'password123')
        };
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.user && data.token) {
        setAuthToken(data.token);
        const userObj = {
          ...data.user,
          initials: data.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          isAuthenticated: true
        };
        setCurrentUser(userObj);
        sessionStorage.setItem('muet_tracker_token', data.token);
        sessionStorage.setItem('muet_tracker_user', JSON.stringify(userObj));
        localStorage.removeItem('muet_tracker_token');
        localStorage.removeItem('muet_tracker_user');

        // Role-based redirection after verified login
        if (data.user.role === 'Admin') {
          setActiveTab('admin-fleet');
        } else if (data.user.role === 'Driver') {
          setActiveTab('driver-trip');
        } else {
          setActiveTab('home');
        }
        setIsAuthModalOpen(false);
        return { success: true, user: userObj };
      }

      return { success: false, error: data.error || 'Invalid credentials' };
    } catch (err) {
      console.warn('Login request error:', err.message);
      return { success: false, error: err.message || 'Unable to connect to authentication service' };
    }
  };

  const registerStudent = async (studentData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });

      const data = await res.json();
      if (data.success && data.user) {
        // Direct newly registered student to Sign In rather than auto-logging in
        return {
          success: true,
          message: data.message || `Account created successfully for Roll No ${studentData.rollNo}! Please sign in.`,
          user: data.user
        };
      }

      return { success: false, error: data.error || 'Registration failed' };
    } catch (err) {
      console.warn('Registration request error:', err.message);
      return { success: false, error: err.message || 'Unable to connect to registration service' };
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setAuthToken('');
    sessionStorage.removeItem('muet_tracker_user');
    sessionStorage.removeItem('muet_tracker_token');
    sessionStorage.removeItem('muet_active_tab');
    localStorage.removeItem('muet_tracker_user');
    localStorage.removeItem('muet_tracker_token');
    setActiveTabState('home');
  };

  // Driver actions
  const startDriverTrip = async (busId) => {
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, status: 'On Route', statusColor: 'emerald', isOnline: true } : b))
    );
    try {
      const token = authToken || (await refreshAuthToken('Driver'));
      await fetch(`/api/buses/${busId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'On Route', is_online: 1 })
      });
    } catch (e) {
      console.warn('Driver trip update notice:', e);
    }
    addAdminActivity(`Driver started live trip on ${busId}`);
  };

  const endDriverTrip = async (busId) => {
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, status: 'Standby', isOnline: false } : b))
    );
    try {
      const token = authToken || (await refreshAuthToken('Driver'));
      await fetch(`/api/buses/${busId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'Inactive', is_online: 0 })
      });
    } catch (e) {
      console.warn('Driver trip update notice:', e);
    }
    addAdminActivity(`Driver completed trip on ${busId}`);
  };

  const updateDriverStatus = async (busId, newStatus) => {
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, status: newStatus } : b))
    );
    try {
      const token = authToken || (await refreshAuthToken('Driver'));
      await fetch(`/api/buses/${busId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.warn('Driver status update notice:', e);
    }
  };

  const advanceNextStop = (busId) => {
    setBuses((prev) =>
      prev.map((b) => {
        if (b.id !== busId) return b;
        const currentRoute = routes.find((r) => r.id === b.routeId);
        if (!currentRoute) return b;
        const currentStopIdx = currentRoute.stops.findIndex((s) => s.name === b.nextStopName);
        const nextIdx = (currentStopIdx + 1) % currentRoute.stops.length;
        return {
          ...b,
          nextStopName: currentRoute.stops[nextIdx].name,
          eta: '2 min'
        };
      })
    );
  };

  // Admin actions (PERMANENT SQLite DATABASE PERSISTENCE)
  const addBus = async (newBus) => {
    try {
      let token = authToken || localStorage.getItem('muet_tracker_token');
      if (!token || currentUser?.role !== 'Admin') {
        token = await refreshAuthToken('Admin');
      }

      const payload = {
        number: newBus.number,
        plate: newBus.plate,
        route_id: newBus.routeId || newBus.route_id || 'route-04',
        driver_name: newBus.driverName || newBus.driver_name || 'Assigned Driver',
        capacity: Number(newBus.capacity) || 65,
        status: newBus.status || 'Arriving',
        current_lat: (newBus.coords && newBus.coords[0]) || 25.4057,
        current_lng: (newBus.coords && newBus.coords[1]) || 68.2618,
        current_location_name: newBus.currentLocationName || 'Main Campus Terminal',
        next_stop_name: newBus.nextStopName || 'Academic Block',
        is_online: 1
      };

      let res = await fetch('/api/buses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401 || res.status === 403) {
        token = await refreshAuthToken('Admin');
        res = await fetch('/api/buses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const result = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to save bus to database');
      }

      const dbBus = result.data;
      const matchingRoute = routes.find((r) => r.id === dbBus.route_id);

      const createdBusObj = {
        id: dbBus.id,
        number: dbBus.number,
        plate: dbBus.plate,
        routeId: dbBus.route_id,
        routeName: matchingRoute ? matchingRoute.name : 'Main Campus ➔ Hyderabad',
        driverId: dbBus.driver_id || 'drv-01',
        driverName: dbBus.driver_name,
        driverPhone: '+92 300 1234567',
        status: dbBus.status,
        statusColor: 'emerald',
        badgeType: 'green',
        eta: dbBus.eta || '5 min',
        speed: dbBus.speed || '40 km/h',
        capacity: dbBus.capacity,
        passengers: dbBus.passengers || 0,
        occupancyLevel: 'Comfortable',
        coords: [Number(dbBus.current_lat) || 25.4057, Number(dbBus.current_lng) || 68.2618],
        currentLocationName: dbBus.current_location_name,
        nextStopName: dbBus.next_stop_name,
        targetProgress: 0.1,
        isOnline: true,
        lastUpdate: 'Just now'
      };

      setBuses((prev) => [...prev.filter((b) => b.id !== createdBusObj.id), createdBusObj]);
      addAdminActivity(`Admin registered new vehicle: ${createdBusObj.number} (${createdBusObj.plate})`);
      return { success: true, bus: createdBusObj };
    } catch (err) {
      console.error('addBus API error:', err);
      throw err;
    }
  };

  const updateBus = async (busId, updatedData) => {
    setBuses((prev) => prev.map((b) => (b.id === busId ? { ...b, ...updatedData } : b)));
    addAdminActivity(`Admin modified bus details for ${busId}`);

    try {
      let token = authToken;
      if (!token) token = await refreshAuthToken('Admin');

      await fetch(`/api/buses/${busId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
    } catch (err) {
      console.warn('Update bus API error:', err);
    }
  };

  const deleteBus = async (busId) => {
    setBuses((prev) => prev.filter((b) => b.id !== busId));
    addAdminActivity(`Admin decommissioned vehicle ${busId}`);

    try {
      let token = authToken;
      if (!token) token = await refreshAuthToken('Admin');

      await fetch(`/api/buses/${busId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.warn('Delete bus API error:', err);
    }
  };

  const broadcastAlert = async (alertData) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: alertData.title,
      message: alertData.message,
      time: 'Just now',
      category: 'alert',
      type: alertData.type || 'delay',
      isRead: false,
      severity: alertData.severity || 'warning'
    };
    setNotifications((prev) => [newNotif, ...prev]);
    addAdminActivity(`Admin broadcasted emergency alert: "${alertData.title}"`);

    try {
      let token = authToken;
      if (!token) token = await refreshAuthToken('Admin');

      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(alertData)
      });
    } catch (err) {
      console.warn('Broadcast alert API error:', err);
    }
  };

  const addAdminActivity = (text) => {
    setAdminActivities((prev) => [
      { id: Date.now(), text, time: 'Just now', type: 'system' },
      ...prev.slice(0, 9)
    ]);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authToken,
        setAuthToken,
        refreshAuthToken,
        theme,
        setTheme,
        activeTab,
        setActiveTab,
        buses,
        setBuses,
        routes,
        setRoutes,
        drivers,
        notifications,
        setNotifications,
        unreadCount,
        markAllNotificationsRead,
        selectedRoute,
        setSelectedRoute,
        selectedBus,
        setSelectedBus,
        searchQuery,
        setSearchQuery,
        isSimulationRunning,
        setIsSimulationRunning,
        simulationSpeed,
        setSimulationSpeed,
        lastUpdateTime,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isMobilePreviewOpen,
        setIsMobilePreviewOpen,
        isAiAssistantOpen,
        setIsAiAssistantOpen,
        isReportIssueOpen,
        setIsReportIssueOpen,
        isQRScannerOpen,
        setIsQRScannerOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        adminActivities,
        loginUser,
        registerStudent,
        logoutUser,
        startDriverTrip,
        endDriverTrip,
        updateDriverStatus,
        advanceNextStop,
        addBus,
        updateBus,
        deleteBus,
        broadcastAlert,
        isLoadingData,
        dataError,
        loadDataFromBackend
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
