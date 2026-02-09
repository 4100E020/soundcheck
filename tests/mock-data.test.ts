import { describe, it, expect } from "vitest";
import {
  mockEvents,
  mockUsers,
  mockCrews,
  getDaysUntil,
  formatEventDate,
  getEventTypeLabel,
  getCrewTypeInfo,
} from "../lib/mock-data";
import {
  mockChatRooms,
  mockMessages,
  formatMessageTime,
  formatMessageTimeDetailed,
} from "../lib/mock-chat-data";

describe("Mock Data", () => {
  it("should have mock events with required fields", () => {
    expect(mockEvents.length).toBeGreaterThan(0);
    for (const event of mockEvents) {
      expect(event.id).toBeDefined();
      expect(event.name).toBeTruthy();
      expect(event.venue).toBeTruthy();
      expect(event.coverImage).toBeTruthy();
      expect(event.startDate).toBeInstanceOf(Date);
      expect(event.eventType).toBeTruthy();
      expect(typeof event.participantCount).toBe("number");
      expect(typeof event.vvipCount).toBe("number");
    }
  });

  it("should have mock users with required fields", () => {
    expect(mockUsers.length).toBeGreaterThan(0);
    for (const user of mockUsers) {
      expect(user.id).toBeDefined();
      expect(user.nickname).toBeTruthy();
      expect(user.avatar).toBeTruthy();
      expect(typeof user.age).toBe("number");
      expect(user.topArtists).toBeInstanceOf(Array);
      expect(user.topArtists.length).toBeGreaterThan(0);
    }
  });

  it("should have mock crews with required fields", () => {
    expect(mockCrews.length).toBeGreaterThan(0);
    for (const crew of mockCrews) {
      expect(crew.id).toBeDefined();
      expect(crew.title).toBeTruthy();
      expect(crew.type).toBeTruthy();
      expect(typeof crew.currentMembers).toBe("number");
      expect(typeof crew.maxMembers).toBe("number");
      expect(crew.currentMembers).toBeLessThanOrEqual(crew.maxMembers);
    }
  });

  it("getDaysUntil should return correct days", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(getDaysUntil(tomorrow)).toBe(1);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getDaysUntil(yesterday)).toBeLessThan(0);
  });

  it("formatEventDate should return a string", () => {
    const date = new Date(2026, 2, 28);
    const result = formatEventDate(date);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("getEventTypeLabel should return correct labels", () => {
    expect(getEventTypeLabel("festival")).toBe("音樂祭");
    expect(getEventTypeLabel("concert")).toBe("演唱會");
    expect(getEventTypeLabel("livehouse")).toBe("Live House");
  });

  it("getCrewTypeInfo should return correct info", () => {
    const transport = getCrewTypeInfo("transport");
    expect(transport.emoji).toBe("🚗");
    expect(transport.label).toBe("交通共乘");

    const accommodation = getCrewTypeInfo("accommodation");
    expect(accommodation.emoji).toBe("🏨");
    expect(accommodation.label).toBe("住宿分攤");

    const onsite = getCrewTypeInfo("onsite");
    expect(onsite.emoji).toBe("🎤");
    expect(onsite.label).toBe("現場揪人");

    const ticket = getCrewTypeInfo("ticket");
    expect(ticket.emoji).toBe("🎫");
    expect(ticket.label).toBe("票券交易");
  });
});

describe("Mock Chat Data", () => {
  it("should have mock chat rooms with required fields", () => {
    expect(mockChatRooms.length).toBeGreaterThan(0);
    for (const room of mockChatRooms) {
      expect(room.id).toBeDefined();
      expect(room.name).toBeTruthy();
      expect(room.avatar).toBeTruthy();
      expect(room.type).toMatch(/^(private|crew)$/);
      expect(typeof room.unreadCount).toBe("number");
    }
  });

  it("should have mock messages with required fields", () => {
    expect(mockMessages.length).toBeGreaterThan(0);
    for (const msg of mockMessages) {
      expect(msg.id).toBeDefined();
      expect(msg.chatRoomId).toBeDefined();
      expect(msg.content).toBeTruthy();
      expect(msg.createdAt).toBeInstanceOf(Date);
    }
  });

  it("formatMessageTime should return a string", () => {
    const now = new Date();
    const result = formatMessageTime(now);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formatMessageTimeDetailed should return a string", () => {
    const now = new Date();
    const result = formatMessageTimeDetailed(now);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
