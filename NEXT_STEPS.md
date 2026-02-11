# SoundCheck 後續開發步驟指南

## 當前狀態總結

### ✅ 已完成
1. **完整的應用程式 UI** - 所有頁面和功能介面
2. **KKTIX 爬蟲系統** - 可運作的爬蟲框架 + 場地資料庫
3. **資料庫架構** - 完整的 Schema 和 API 端點
4. **真實 API 整合** - 活動列表已連接真實數據
5. **地理位置服務** - 位置權限和附近活動
6. **43 個單元測試** - 核心功能測試覆蓋

### ⚠️ 待完成的關鍵功能

## 第一優先:修復活動詳情頁面

**問題:** 點擊活動卡片仍顯示舊的測試資料

**修復步驟:**

1. 更新 `app/event/[id].tsx`:
```typescript
// 將 mockEvents 替換為真實 API
const { data: event, isLoading } = trpc.events.getRealById.useQuery({
  id: eventId as string,
});
```

2. 更新路由參數傳遞:
```typescript
// 在 events.tsx 中
router.push(`/event/${e.id}`); // 使用真實的 UUID 而非 index
```

## 第二優先:完成其他平台爬蟲

### iNDIEVOX 爬蟲

**已完成的研究:** `/home/ubuntu/soundcheck/INDIEVOX_RESEARCH.md`

**實作步驟:**

1. 建立 `server/scrapers/indievox-scraper.ts`:
```typescript
// 參考 KKTIX 爬蟲結構
// iNDIEVOX 使用 JSON API 而非 Atom Feed
// API endpoint: https://www.indievox.com/api/events
```

2. 關鍵差異:
- iNDIEVOX 提供 JSON API (更容易解析)
- 需要處理分頁 (每頁 20 個活動)
- 圖片 URL 格式不同

3. 整合到統一爬蟲:
```typescript
// server/scrapers/run-all-scrapers.ts
await scrapeKKTIX();
await scrapeIndievox();
await scrapeAccupass();
```

### Accupass 爬蟲

**實作步驟:**

1. 研究 Accupass API:
```bash
# 檢查是否有公開 API
curl https://www.accupass.com/api/events
```

2. 如果沒有 API,使用 HTML 解析:
```typescript
import * as cheerio from 'cheerio';
// 解析活動列表頁面
const $ = cheerio.load(html);
$('.event-item').each((i, el) => {
  // 提取活動信息
});
```

## 第三優先:實作完整認證系統

### 登入流程

1. 建立 `app/auth/login.tsx`:
```typescript
export default function LoginScreen() {
  const login = trpc.auth.login.useMutation();
  
  const handleLogin = async () => {
    const result = await login.mutateAsync({
      email,
      password,
    });
    
    // 存儲 token
    await SecureStore.setItemAsync('auth_token', result.token);
    
    // 導航到主頁
    router.replace('/(tabs)');
  };
}
```

2. 更新 `server/routers.ts`:
```typescript
login: publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }))
  .mutation(async ({ input, ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    
    // 驗證密碼 (使用 bcrypt)
    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    
    if (!isValid) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    
    // 生成 JWT token
    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);
    
    return { token, user };
  }),
```

### 註冊流程

1. 建立 `app/auth/signup.tsx` (已存在,需連接 API)

2. 更新 API:
```typescript
signup: publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(6),
    displayName: z.string(),
    // ... 其他字段
  }))
  .mutation(async ({ input, ctx }) => {
    // 檢查 email 是否已存在
    const existing = await ctx.db.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT' });
    }
    
    // Hash 密碼
    const passwordHash = await bcrypt.hash(input.password, 10);
    
    // 建立用戶
    const [user] = await ctx.db.insert(users).values({
      ...input,
      passwordHash,
    }).returning();
    
    // 生成 token
    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);
    
    return { token, user };
  }),
```

### 會話管理

1. 建立 Auth Context:
```typescript
// lib/auth-context.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // 從 SecureStore 載入 token
    SecureStore.getItemAsync('auth_token').then(setToken);
  }, []);
  
  const login = async (token: string, user: User) => {
    await SecureStore.setItemAsync('auth_token', token);
    setToken(token);
    setUser(user);
  };
  
  const logout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    setToken(null);
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

2. 在 `app/_layout.tsx` 中包裹 AuthProvider

3. 建立認證守衛:
```typescript
// app/(tabs)/_layout.tsx
export default function TabLayout() {
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user]);
  
  if (!user) {
    return null; // 或顯示載入畫面
  }
  
  return <Tabs>...</Tabs>;
}
```

## 第四優先:實作用戶資料管理

### 個人資料編輯

1. 建立 `app/profile/edit.tsx`:
```typescript
export default function EditProfileScreen() {
  const updateProfile = trpc.users.updateProfile.useMutation();
  
  const handleSave = async () => {
    await updateProfile.mutateAsync({
      displayName,
      bio,
      location,
      // ... 其他字段
    });
    
    router.back();
  };
}
```

### 頭像上傳

1. 使用 expo-image-picker:
```typescript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  
  if (!result.canceled) {
    // 上傳到 S3
    const uploadUrl = await trpc.storage.getUploadUrl.query({
      filename: 'avatar.jpg',
      contentType: 'image/jpeg',
    });
    
    await fetch(uploadUrl, {
      method: 'PUT',
      body: result.assets[0].uri,
    });
    
    // 更新用戶資料
    await updateProfile.mutateAsync({
      avatarUrl: uploadUrl.split('?')[0],
    });
  }
};
```

### 音樂偏好設定

1. 建立 `app/profile/music-preferences.tsx`:
```typescript
export default function MusicPreferencesScreen() {
  const [genres, setGenres] = useState<string[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  
  const savePreferences = trpc.users.updateMusicPreferences.useMutation();
  
  const handleSave = async () => {
    await savePreferences.mutateAsync({
      genres,
      favoriteArtists: artists,
      // ... 其他偏好
    });
  };
}
```

## 第五優先:執行所有爬蟲

### 建立統一爬蟲腳本

```typescript
// server/scrapers/run-all-scrapers.ts
import { scrapeKKTIX } from './kktix-scraper';
import { scrapeIndievox } from './indievox-scraper';
import { scrapeAccupass } from './accupass-scraper';

async function runAllScrapers() {
  console.log('Starting all scrapers...');
  
  try {
    console.log('1/3 Scraping KKTIX...');
    const kktixEvents = await scrapeKKTIX();
    console.log(`✓ KKTIX: ${kktixEvents.length} events`);
    
    console.log('2/3 Scraping iNDIEVOX...');
    const indievoxEvents = await scrapeIndievox();
    console.log(`✓ iNDIEVOX: ${indievoxEvents.length} events`);
    
    console.log('3/3 Scraping Accupass...');
    const accupassEvents = await scrapeAccupass();
    console.log(`✓ Accupass: ${accupassEvents.length} events`);
    
    const total = kktixEvents.length + indievoxEvents.length + accupassEvents.length;
    console.log(`\n✅ Total events scraped: ${total}`);
  } catch (error) {
    console.error('Scraper failed:', error);
    throw error;
  }
}

runAllScrapers();
```

### 設置定時任務

```typescript
// server/cron-jobs.ts
import cron from 'node-cron';
import { runAllScrapers } from './scrapers/run-all-scrapers';

// 每天凌晨 2 點執行
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Running daily scraper...');
  try {
    await runAllScrapers();
    console.log('[CRON] Scraper completed successfully');
  } catch (error) {
    console.error('[CRON] Scraper failed:', error);
    // TODO: 發送失敗通知
  }
});
```

## 測試清單

### 爬蟲測試
- [ ] KKTIX 爬蟲成功爬取活動
- [ ] iNDIEVOX 爬蟲成功爬取活動
- [ ] Accupass 爬蟲成功爬取活動
- [ ] 所有活動正確存儲到資料庫
- [ ] 地理編碼正確運作
- [ ] 重複活動被正確去重

### 前端測試
- [ ] 活動列表顯示真實數據
- [ ] 活動詳情顯示真實數據
- [ ] 點擊活動卡片導航正確
- [ ] 篩選和排序功能正常
- [ ] 附近活動功能正常

### 認證測試
- [ ] 註冊流程完整
- [ ] 登入流程完整
- [ ] 會話持久化
- [ ] 登出功能正常
- [ ] 認證守衛正確阻擋未登入用戶

### 用戶資料測試
- [ ] 個人資料編輯成功
- [ ] 頭像上傳成功
- [ ] 音樂偏好保存成功
- [ ] 資料在應用程式中正確顯示

## 預估工作量

- **爬蟲系統完成:** 4-6 小時
- **活動詳情修復:** 1-2 小時
- **認證系統:** 6-8 小時
- **用戶資料管理:** 4-6 小時
- **測試與修復:** 4-6 小時

**總計:** 約 20-28 小時

## 建議的執行順序

1. **第一天:** 修復活動詳情頁面 + 完成 iNDIEVOX 爬蟲
2. **第二天:** 完成 Accupass 爬蟲 + 執行所有爬蟲並驗證數據
3. **第三天:** 實作登入和註冊流程
4. **第四天:** 實作會話管理和認證守衛
5. **第五天:** 實作用戶資料管理功能
6. **第六天:** 全面測試和修復問題

---

**注意:** 所有代碼示例都是基於當前項目架構,可以直接使用或稍作調整後使用。
