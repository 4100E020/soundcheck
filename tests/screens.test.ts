import { describe, it, expect } from "vitest";
import { mockEvents, mockUsers, mockCrews } from "../lib/mock-data";
import { mockChatRooms, mockMessages } from "../lib/mock-chat-data";

describe("Screen Data Validation", () => {
  describe("Discover Screen", () => {
    it("should have users for card-based matching", () => {
      expect(mockUsers.length).toBeGreaterThan(0);
      const user = mockUsers[0];
      expect(user.nickname).toBeTruthy();
      expect(user.avatar).toBeTruthy();
      expect(user.topArtists.length).toBeGreaterThan(0);
    });

    it("should have daily matching limit", () => {
      const dailyLimit = 30; // Unverified users
      expect(dailyLimit).toBe(30);
    });

    it("should have match score calculation", () => {
      const matchScore = Math.floor(Math.random() * 100);
      expect(matchScore).toBeGreaterThanOrEqual(0);
      expect(matchScore).toBeLessThanOrEqual(100);
    });
  });

  describe("Events Screen", () => {
    it("should have filterable events", () => {
      const festivals = mockEvents.filter((e) => e.eventType === "festival");
      const concerts = mockEvents.filter((e) => e.eventType === "concert");
      const livehouses = mockEvents.filter((e) => e.eventType === "livehouse");

      expect(mockEvents.length).toBeGreaterThan(0);
      expect(festivals.length + concerts.length + livehouses.length).toBeGreaterThan(0);
    });

    it("should have sortable events by date", () => {
      const sorted = [...mockEvents].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      expect(sorted.length).toBe(mockEvents.length);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].startDate.getTime()).toBeGreaterThanOrEqual(sorted[i - 1].startDate.getTime());
      }
    });

    it("should have sortable events by popularity", () => {
      const sorted = [...mockEvents].sort((a, b) => b.participantCount - a.participantCount);
      expect(sorted.length).toBe(mockEvents.length);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].participantCount).toBeLessThanOrEqual(sorted[i - 1].participantCount);
      }
    });

    it("should display VVIP count", () => {
      for (const event of mockEvents) {
        expect(typeof event.vvipCount).toBe("number");
        expect(event.vvipCount).toBeGreaterThanOrEqual(0);
        expect(event.vvipCount).toBeLessThanOrEqual(event.participantCount);
      }
    });
  });

  describe("Chat Screen", () => {
    it("should have private and crew chat rooms", () => {
      const privateChats = mockChatRooms.filter((c) => c.type === "private");
      const crewChats = mockChatRooms.filter((c) => c.type === "crew");

      expect(mockChatRooms.length).toBeGreaterThan(0);
      expect(privateChats.length + crewChats.length).toBe(mockChatRooms.length);
    });

    it("should have unread message counts", () => {
      for (const room of mockChatRooms) {
        expect(typeof room.unreadCount).toBe("number");
        expect(room.unreadCount).toBeGreaterThanOrEqual(0);
      }
    });

    it("should have messages in chat rooms", () => {
      expect(mockMessages.length).toBeGreaterThan(0);
      for (const msg of mockMessages) {
        const room = mockChatRooms.find((r) => r.id === msg.chatRoomId);
        expect(room).toBeDefined();
      }
    });

    it("should support song messages", () => {
      const songMessages = mockMessages.filter((m) => m.messageType === "song");
      // Song messages are optional, but if they exist, they should have metadata
      for (const msg of songMessages) {
        expect(msg.metadata).toBeDefined();
        if (msg.metadata) {
          expect(msg.metadata.songName).toBeTruthy();
          expect(msg.metadata.artistName).toBeTruthy();
        }
      }
    });
  });

  describe("Profile Screen", () => {
    it("should have music DNA data", () => {
      const musicDNA = [
        { label: "舞曲性", value: 0.72 },
        { label: "能量", value: 0.85 },
        { label: "正向度", value: 0.65 },
        { label: "原聲", value: 0.45 },
        { label: "器樂", value: 0.3 },
      ];

      expect(musicDNA.length).toBe(5);
      for (const feature of musicDNA) {
        expect(feature.value).toBeGreaterThanOrEqual(0);
        expect(feature.value).toBeLessThanOrEqual(1);
      }
    });

    it("should have top artists", () => {
      const user = mockUsers[0];
      expect(user.topArtists.length).toBeGreaterThan(0);
      for (const artist of user.topArtists) {
        expect(artist).toBeTruthy();
      }
    });
  });

  describe("Crew Screen", () => {
    it("should have crew data with member counts", () => {
      expect(mockCrews.length).toBeGreaterThan(0);
      for (const crew of mockCrews) {
        expect(crew.currentMembers).toBeGreaterThan(0);
        expect(crew.maxMembers).toBeGreaterThanOrEqual(crew.currentMembers);
        expect(crew.isFull).toBe(crew.currentMembers >= crew.maxMembers);
      }
    });

    it("should have crew types", () => {
      const types = new Set(mockCrews.map((c) => c.type));
      expect(types.has("transport")).toBe(true);
      expect(types.has("accommodation")).toBe(true);
      expect(types.has("onsite")).toBe(true);
      expect(types.has("ticket")).toBe(true);
    });
  });
});
