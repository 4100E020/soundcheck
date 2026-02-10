/**
 * 帶有位置信息的模擬活動數據
 * 用於測試附近活動功能
 */

export const mockEventsWithLocation = [
  {
    id: 1,
    name: "2026 春浪音樂節",
    venue: "新北市淡水海邊",
    latitude: 25.1688,
    longitude: 121.4467,
    distance: 12.5,
  },
  {
    id: 2,
    name: "Fuji Rock Festival 2026",
    venue: "新潟縣湯澤町",
    latitude: 36.7394,
    longitude: 138.6007,
    distance: 850.3,
  },
  {
    id: 3,
    name: "台北 Live House 演唱會",
    venue: "台北市信義區",
    latitude: 25.0443,
    longitude: 121.5654,
    distance: 3.2,
  },
  {
    id: 4,
    name: "高雄夏日音樂祭",
    venue: "高雄市前鎮區",
    latitude: 22.5917,
    longitude: 120.2708,
    distance: 285.6,
  },
  {
    id: 5,
    name: "台中爵士音樂節",
    venue: "台中市西屯區",
    latitude: 24.1744,
    longitude: 120.6436,
    distance: 145.8,
  },
];

/**
 * 台灣主要城市坐標
 */
export const taiwanCities = {
  taipei: { latitude: 25.0443, longitude: 121.5654, name: "台北" },
  taichung: { latitude: 24.1744, longitude: 120.6436, name: "台中" },
  kaohsiung: { latitude: 22.5917, longitude: 120.2708, name: "高雄" },
  tainan: { latitude: 22.9937, longitude: 120.2153, name: "台南" },
  keelung: { latitude: 25.1276, longitude: 121.7440, name: "基隆" },
  hsinchu: { latitude: 24.8138, longitude: 120.9675, name: "新竹" },
  taoyuan: { latitude: 25.0330, longitude: 121.4680, name: "桃園" },
  nantou: { latitude: 23.8103, longitude: 120.9852, name: "南投" },
  yunlin: { latitude: 23.7145, longitude: 120.4519, name: "雲林" },
  chiayi: { latitude: 23.4626, longitude: 120.4521, name: "嘉義" },
  pingtung: { latitude: 22.6763, longitude: 120.4863, name: "屏東" },
  yilan: { latitude: 24.7612, longitude: 121.7519, name: "宜蘭" },
  hualien: { latitude: 23.9908, longitude: 121.6119, name: "花蓮" },
  taitung: { latitude: 22.7604, longitude: 121.1432, name: "台東" },
};

/**
 * 根據城市名稱獲取坐標
 */
export function getCityCoordinates(cityName: string) {
  const city = Object.values(taiwanCities).find(
    (c) => c.name === cityName || c.name.includes(cityName)
  );
  return city ? { latitude: city.latitude, longitude: city.longitude } : null;
}
