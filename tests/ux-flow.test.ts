import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

/**
 * UX Flow Tests
 * Verify that all screens exist, have proper structure,
 * and key UX patterns are correctly implemented.
 */
describe("UX Flow - Screen Files Exist", () => {
  const requiredScreens = [
    "app/(tabs)/index.tsx",
    "app/(tabs)/events.tsx",
    "app/(tabs)/chat.tsx",
    "app/(tabs)/profile.tsx",
    "app/(tabs)/_layout.tsx",
    "app/event/[id].tsx",
    "app/crew/[id].tsx",
    "app/crew/create.tsx",
    "app/chat/[id].tsx",
    "app/auth/login.tsx",
    "app/auth/signup.tsx",
    "app/nearby-events.tsx",
    "app/song-picker.tsx",
    "app/who-likes-me.tsx",
    "app/ticket-verify/[eventId].tsx",
  ];

  requiredScreens.forEach((screen) => {
    it(`screen file exists: ${screen}`, () => {
      expect(existsSync(join(ROOT, screen))).toBe(true);
    });
  });
});

describe("UX Flow - No undefined color references", () => {
  const screenFiles = [
    "app/(tabs)/index.tsx",
    "app/(tabs)/events.tsx",
    "app/(tabs)/chat.tsx",
    "app/(tabs)/profile.tsx",
    "app/event/[id].tsx",
    "app/crew/[id].tsx",
    "app/crew/create.tsx",
    "app/nearby-events.tsx",
  ];

  screenFiles.forEach((file) => {
    it(`${file} does not use undefined 'secondary' color`, () => {
      const content = readFileSync(join(ROOT, file), "utf-8");
      // 'secondary' is not defined in theme.config.js, so it should not be used
      expect(content).not.toMatch(/text-secondary|bg-secondary/);
    });
  });
});

describe("UX Flow - Event images utility", () => {
  it("event-image-utils.ts exists and exports required functions", () => {
    const filePath = join(ROOT, "lib/event-image-utils.ts");
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("getEventCoverImage");
    expect(content).toContain("getCategoryLabel");
    expect(content).toContain("getCategoryEmoji");
  });
});

describe("UX Flow - Events page uses real API", () => {
  it("events.tsx imports trpc for real data", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/events.tsx"), "utf-8");
    expect(content).toContain("trpc");
    expect(content).toContain("listReal");
  });

  it("event detail page imports trpc for real data", () => {
    const content = readFileSync(join(ROOT, "app/event/[id].tsx"), "utf-8");
    expect(content).toContain("trpc");
    expect(content).toContain("getRealById");
  });

  it("events page uses getEventCoverImage for images", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/events.tsx"), "utf-8");
    expect(content).toContain("getEventCoverImage");
    expect(content).toContain("<Image");
  });

  it("event detail page uses getEventCoverImage for images", () => {
    const content = readFileSync(join(ROOT, "app/event/[id].tsx"), "utf-8");
    expect(content).toContain("getEventCoverImage");
    expect(content).toContain("<Image");
  });
});

describe("UX Flow - Loading and Error States", () => {
  it("events page has loading state", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/events.tsx"), "utf-8");
    expect(content).toContain("isLoading");
    expect(content).toContain("ActivityIndicator");
  });

  it("events page has error state", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/events.tsx"), "utf-8");
    expect(content).toContain("error");
    expect(content).toContain("重新載入");
  });

  it("event detail page has loading state", () => {
    const content = readFileSync(join(ROOT, "app/event/[id].tsx"), "utf-8");
    expect(content).toContain("isLoading");
    expect(content).toContain("ActivityIndicator");
  });

  it("event detail page has error state", () => {
    const content = readFileSync(join(ROOT, "app/event/[id].tsx"), "utf-8");
    expect(content).toContain("活動不存在");
  });

  it("nearby events page has loading state", () => {
    const content = readFileSync(join(ROOT, "app/nearby-events.tsx"), "utf-8");
    expect(content).toContain("isLoading");
    expect(content).toContain("ActivityIndicator");
  });

  it("crew create page has loading state", () => {
    const content = readFileSync(join(ROOT, "app/crew/create.tsx"), "utf-8");
    expect(content).toContain("isLoading");
    expect(content).toContain("ActivityIndicator");
  });
});

describe("UX Flow - Empty States", () => {
  it("events page has empty state", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/events.tsx"), "utf-8");
    expect(content).toContain("ListEmptyComponent");
    expect(content).toContain("沒有符合的活動");
  });

  it("chat page has empty state", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/chat.tsx"), "utf-8");
    expect(content).toContain("ListEmptyComponent");
    expect(content).toContain("還沒有聊天");
  });

  it("nearby events page has empty state", () => {
    const content = readFileSync(join(ROOT, "app/nearby-events.tsx"), "utf-8");
    expect(content).toContain("ListEmptyComponent");
    expect(content).toContain("目前沒有活動");
  });
});

describe("UX Flow - Auth Context Integration", () => {
  it("auth-context.tsx exists", () => {
    expect(existsSync(join(ROOT, "lib/auth-context.tsx"))).toBe(true);
  });

  it("profile page uses AuthContext", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/profile.tsx"), "utf-8");
    expect(content).toContain("useAuthContext");
    expect(content).toContain("isAuthenticated");
  });

  it("login page uses AuthContext", () => {
    const content = readFileSync(join(ROOT, "app/auth/login.tsx"), "utf-8");
    expect(content).toContain("useAuthContext");
    expect(content).toContain("login");
  });

  it("signup page uses AuthContext", () => {
    const content = readFileSync(join(ROOT, "app/auth/signup.tsx"), "utf-8");
    expect(content).toContain("useAuthContext");
    expect(content).toContain("signup");
  });
});

describe("UX Flow - Profile ticket wallet uses real API", () => {
  it("profile page uses trpc for real events in ticket wallet", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/profile.tsx"), "utf-8");
    expect(content).toContain("trpc");
    expect(content).toContain("listReal");
    expect(content).toContain("getEventCoverImage");
  });
});

describe("UX Flow - Navigation Consistency", () => {
  it("tab layout has all 4 tabs configured", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/_layout.tsx"), "utf-8");
    expect(content).toContain('name="index"');
    expect(content).toContain('name="events"');
    expect(content).toContain('name="chat"');
    expect(content).toContain('name="profile"');
  });

  it("discover page has navigation to who-likes-me", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/index.tsx"), "utf-8");
    expect(content).toContain("/who-likes-me");
  });

  it("discover page has navigation to song-picker", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/index.tsx"), "utf-8");
    expect(content).toContain("/song-picker");
  });

  it("events page has navigation to nearby-events", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/events.tsx"), "utf-8");
    expect(content).toContain("/nearby-events");
  });

  it("events page navigates to event detail with real ID", () => {
    const content = readFileSync(join(ROOT, "app/(tabs)/events.tsx"), "utf-8");
    expect(content).toContain("router.push(`/event/${event.id}`)");
  });
});
