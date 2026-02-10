import React, { createContext, useContext, useState, useEffect } from "react";
import * as Location from "expo-location";
import { Platform } from "react-native";

interface LocationContextType {
  userLocation: { latitude: number; longitude: number } | null;
  userCity: string | null;
  locationPermission: boolean;
  loading: boolean;
  error: string | null;
  requestLocationPermission: () => Promise<boolean>;
  updateLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      return false;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      setLocationPermission(granted);
      if (granted) {
        await updateLocation();
      }
      return granted;
    } catch (err) {
      setError("位置權限申請失敗");
      return false;
    }
  };

  const updateLocation = async () => {
    if (Platform.OS === "web") {
      return;
    }

    setLoading(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("位置權限未授予");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Get city name
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (geocode[0]) {
          setUserCity(geocode[0].city || geocode[0].region || "未知位置");
        }
      } catch (geocodeErr) {
        console.warn("地理編碼失敗:", geocodeErr);
      }

      setError(null);
    } catch (err) {
      setError("無法獲取位置");
      console.error("位置獲取失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  // 初始化位置
  useEffect(() => {
    const initLocation = async () => {
      if (Platform.OS === "web") {
        return;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationPermission(true);
        await updateLocation();
      }
    };

    initLocation();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        userCity,
        locationPermission,
        loading,
        error,
        requestLocationPermission,
        updateLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return context;
}
