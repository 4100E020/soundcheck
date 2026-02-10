import { describe, it, expect } from "vitest";
import {
  calculateDistance,
  formatDistance,
  findNearbyEvents,
  getDirection,
  isSameCity,
  sortByDistance,
  sortByPopularity,
  type Coordinates,
} from "../lib/location-utils";
import { mockEventsWithLocation, taiwanCities } from "../lib/mock-data-with-location";

describe("Location Utils", () => {
  const taipei: Coordinates = { latitude: 25.0443, longitude: 121.5654 };
  const kaohsiung: Coordinates = { latitude: 22.5917, longitude: 120.2708 };
  const taichung: Coordinates = { latitude: 24.1744, longitude: 120.6436 };

  describe("calculateDistance", () => {
    it("should calculate distance between two coordinates", () => {
      const distance = calculateDistance(taipei, kaohsiung);
      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(310);
    });

    it("should return 0 for same coordinates", () => {
      const distance = calculateDistance(taipei, taipei);
      expect(distance).toBe(0);
    });

    it("should calculate distance symmetrically", () => {
      const d1 = calculateDistance(taipei, taichung);
      const d2 = calculateDistance(taichung, taipei);
      expect(d1).toBeCloseTo(d2, 1);
    });
  });

  describe("formatDistance", () => {
    it("should format distances less than 1km in meters", () => {
      const result = formatDistance(0.5);
      expect(result).toContain("公尺");
    });

    it("should format distances in kilometers", () => {
      const result = formatDistance(5);
      expect(result).toContain("公里");
    });

    it("should round large distances", () => {
      const result = formatDistance(150);
      expect(result).toContain("150");
    });
  });

  describe("findNearbyEvents", () => {
    it("should find events within radius", () => {
      const events = mockEventsWithLocation.map((e) => ({
        id: e.id,
        name: e.name,
        latitude: e.latitude,
        longitude: e.longitude,
      }));

      const nearby = findNearbyEvents(taipei, events, 50);
      expect(nearby.length).toBeGreaterThan(0);
    });

    it("should return all events if no location provided", () => {
      const events = mockEventsWithLocation.map((e) => ({
        id: e.id,
        name: e.name,
        latitude: e.latitude,
        longitude: e.longitude,
      }));

      const result = findNearbyEvents(null, events, 50);
      expect(result.length).toBe(events.length);
    });

    it("should sort by distance ascending", () => {
      const events = mockEventsWithLocation.map((e) => ({
        id: e.id,
        name: e.name,
        latitude: e.latitude,
        longitude: e.longitude,
      }));

      const nearby = findNearbyEvents(taipei, events, 1000);
      // Verify nearby is not empty and has distances
      expect(nearby.length).toBeGreaterThan(0);
      // Check that first item has smallest distance
      if (nearby.length > 1) {
        const first = nearby[0].distance || Infinity;
        const second = nearby[1].distance || Infinity;
        expect(first).toBeLessThanOrEqual(second);
      }
    });
  });

  describe("getDirection", () => {
    it("should return correct cardinal directions", () => {
      const north: Coordinates = { latitude: 26, longitude: 121.5654 };
      const south: Coordinates = { latitude: 24, longitude: 121.5654 };
      const east: Coordinates = { latitude: 25.0443, longitude: 122 };
      const west: Coordinates = { latitude: 25.0443, longitude: 121 };

      expect(getDirection(taipei, north)).toBe("北");
      expect(getDirection(taipei, south)).toBe("南");
      expect(getDirection(taipei, east)).toBe("東");
      expect(getDirection(taipei, west)).toBe("西");
    });
  });

  describe("isSameCity", () => {
    it("should identify same city", () => {
      const result = isSameCity(taipei, taichung, 150);
      expect(result).toBe(true);
    });

    it("should identify different cities", () => {
      const result = isSameCity(taipei, kaohsiung, 150);
      expect(result).toBe(false);
    });
  });

  describe("sortByDistance", () => {
    it("should sort events by distance", () => {
      const events = [
        { id: 1, distance: 50 },
        { id: 2, distance: 10 },
        { id: 3, distance: 30 },
      ];

      const sorted = sortByDistance(events);
      expect(sorted[0].distance).toBe(10);
      expect(sorted[1].distance).toBe(30);
      expect(sorted[2].distance).toBe(50);
    });

    it("should handle undefined distances", () => {
      const events = [
        { id: 1, distance: 50 },
        { id: 2, distance: undefined },
        { id: 3, distance: 30 },
      ];

      const sorted = sortByDistance(events);
      expect(sorted[0].distance).toBe(30);
      expect(sorted[1].distance).toBe(50);
      expect(sorted[2].distance).toBeUndefined();
    });
  });

  describe("sortByPopularity", () => {
    it("should sort events by participant count", () => {
      const events = [
        { id: 1, participantCount: 50 },
        { id: 2, participantCount: 200 },
        { id: 3, participantCount: 100 },
      ];

      const sorted = sortByPopularity(events);
      expect(sorted[0].participantCount).toBe(200);
      expect(sorted[1].participantCount).toBe(100);
      expect(sorted[2].participantCount).toBe(50);
    });
  });

  describe("Taiwan Cities", () => {
    it("should have valid coordinates for all cities", () => {
      Object.values(taiwanCities).forEach((city) => {
        expect(typeof city.latitude).toBe("number");
        expect(typeof city.longitude).toBe("number");
        expect(city.latitude).toBeGreaterThan(20);
        expect(city.latitude).toBeLessThan(27);
        expect(city.longitude).toBeGreaterThan(119);
        expect(city.longitude).toBeLessThan(122);
      });
    });

    it("should have unique city names", () => {
      const names = Object.values(taiwanCities).map((c) => c.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toEqual(names.length);
    });
  });
});
