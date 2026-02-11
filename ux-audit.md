# UX Audit Findings

## Issues Found

### 活動頁面圖片
- [x] events.tsx - 已使用 Unsplash 預設封面圖 (event-image-utils.ts)
- [x] event/[id].tsx - 已使用 Unsplash 預設封面圖
- [ ] nearby-events.tsx - 仍用 emoji 🎵 作為圖片佔位符，需修復
- [ ] profile.tsx - 票夾中的活動圖片使用 mockEvents.coverImage (Unsplash URL)，OK

### UX 流程問題
1. ticket-verify/[eventId].tsx - 使用 mockEvents.find(e => e.id === Number(eventId))，但真實活動 ID 是 UUID 字串，會找不到活動
2. crew/create.tsx - 同上，使用 mockEvents.find(e => e.id === Number(eventId))
3. crew/[id].tsx - 使用 mockCrews 和 mockEvents，crew 的 eventId 是 number 但真實 ID 是 string
4. nearby-events.tsx - 使用 mockEvents 而非真實 API，且沒有活動圖片
5. profile.tsx - 票夾使用 mockEvents，router.push(`/event/${event.id}`) 用 number ID
6. 首頁探索 - 使用 mockUsers，功能正常但是模擬資料
7. who-likes-me.tsx - 純模擬資料，功能正常
8. song-picker.tsx - 純模擬資料，功能正常

### 關鍵修復優先順序
1. nearby-events.tsx - 加入活動圖片
2. ticket-verify - 修復活動查找邏輯（支援真實 UUID ID）
3. crew/create - 修復活動查找邏輯
4. profile.tsx - 票夾連結修復
