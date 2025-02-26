<template>
  <div class="weather" v-if="weatherData.city && weatherData.weather">
    <span>{{ weatherData.city }}&nbsp;</span>
    <span>{{ weatherData.weather }}&nbsp;</span>
    <span>{{ weatherData.temperature }}℃</span>
    <span class="sm-hidden">
      &nbsp;{{
        weatherData.winddirection?.endsWith("风")
          ? weatherData.winddirection
          : weatherData.winddirection + "风"
      }}&nbsp;
    </span>
    <span class="sm-hidden">{{ weatherData.windpower }}&nbsp;级</span>
  </div>
  <div class="weather" v-else>
    <span>天气数据获取失败</span>
  </div>
</template>

<script setup>
import { getQWeatherLocation, getQWeatherNow } from "@/api";
import { Error } from "@icon-park/vue-next";

// 和风天气API Key从环境变量获取，如果不存在则使用默认值
const weatherKey = import.meta.env.VITE_QWEATHER_KEY;

// 天气数据
const weatherData = reactive({
  city: null, // 城市
  weather: null, // 天气现象
  temperature: null, // 实时气温
  winddirection: null, // 风向描述
  windpower: null, // 风力级别
});

// 通过IP API获取用户位置信息
const getUserLocationByIp = async () => {
  try {
    // 使用ipapi.co服务（支持HTTPS）
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();

    if (data && data.city) {
      return {
        city: data.city,
        location: `${data.longitude},${data.latitude}`,
        success: true,
      };
    }

    // 备用方案：使用ipgeolocation.io（免费且支持HTTPS）
    try {
      const backupResponse = await fetch(
        "https://api.ipgeolocation.io/ipgeo?apiKey=42834f26df244474a5afe5e5a148c806",
      );
      const backupData = await backupResponse.json();

      if (backupData && backupData.city) {
        return {
          city: backupData.city,
          location: `${backupData.longitude},${backupData.latitude}`,
          success: true,
        };
      }
    } catch (err) {
      console.log("备用IP位置服务请求失败", err);
    }

    throw new Error("所有IP定位服务均失败");
  } catch (error) {
    console.error("通过IP获取位置失败:", error);
    return { success: false };
  }
};

// 获取天气数据
const getWeatherData = async () => {
  try {
    // 1. 尝试通过IP-API获取用户位置
    const ipLocation = await getUserLocationByIp();

    // 如果IP-API定位成功
    if (ipLocation.success) {
      weatherData.city = ipLocation.city;

      // 使用经纬度获取天气信息
      const weatherResult = await getQWeatherNow(weatherKey, ipLocation.location);

      console.log("天气API响应:", weatherResult); // 添加详细日志

      if (weatherResult.code !== "200") {
        throw new Error("天气信息获取失败：" + weatherResult.code);
      }

      const now = weatherResult.now;
      weatherData.weather = now.text;
      weatherData.temperature = now.temp;
      weatherData.winddirection = now.windDir;
      weatherData.windpower = now.windScale;
    }
    // 如果IP-API定位失败，回退到和风天气的auto_ip功能
    else {
      // 通过和风天气API的auto_ip获取位置信息
      const locationData = await getQWeatherLocation(weatherKey);

      if (locationData.code !== "200") {
        throw new Error("位置信息获取失败：" + locationData.code);
      }

      const location = locationData.location[0];
      weatherData.city = location.name;

      // 获取天气信息
      const weatherResult = await getQWeatherNow(weatherKey, location.id);

      if (weatherResult.code !== "200") {
        throw new Error("天气信息获取失败：" + weatherResult.code);
      }

      const now = weatherResult.now;
      weatherData.weather = now.text;
      weatherData.temperature = now.temp;
      weatherData.winddirection = now.windDir;
      weatherData.windpower = now.windScale;
    }
  } catch (error) {
    console.error("天气信息获取失败:", error);
    onError("天气信息获取失败");
  }
};

// 报错信息
const onError = (message) => {
  ElMessage({
    message,
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  console.error(message);
};

onMounted(() => {
  // 调用获取天气
  getWeatherData();
});
</script>
