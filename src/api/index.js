// import axios from "axios";
import fetchJsonp from "fetch-jsonp";

/**
 * 音乐播放器
 */

// 获取音乐播放列表
export const getPlayerList = async (server, type, id) => {
  const res = await fetch(
    `${import.meta.env.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`,
  );
  const data = await res.json();

  if (data[0].url.startsWith("@")) {
    // eslint-disable-next-line no-unused-vars
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = data[0].url.split("@").slice(1);
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const domain = (
      jsonpData.req_0.data.sip.find((i) => !i.startsWith("http://ws")) ||
      jsonpData.req_0.data.sip[0]
    ).replace("http://", "https://");

    return data.map((v, i) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: domain + jsonpData.req_0.data.midurlinfo[i].purl,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  } else {
    return data.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: v.url,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  return await res.json();
};

/**
 * 和风天气 API
 */

// 获取位置信息
export const getQWeatherLocation = async (key, location = "auto_ip") => {
  try {
    const url = `https://geoapi.qweather.com/v2/city/lookup?key=${key}&location=${location}`;
    console.log("请求和风天气位置API URL:", url);

    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== "200") {
      console.error("和风天气位置API错误:", data);
    }

    return data;
  } catch (error) {
    console.error("和风天气位置API请求失败:", error);
    return { code: "500", msg: error.message };
  }
};

// 获取实时天气
export const getQWeatherNow = async (key, location) => {
  try {
    const url = `https://devapi.qweather.com/v7/weather/now?key=${key}&location=${location}`;
    console.log("请求和风天气API URL:", url);

    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== "200") {
      console.error("和风天气API错误:", data);
    }

    return data;
  } catch (error) {
    console.error("和风天气API请求失败:", error);
    return { code: "500", msg: error.message };
  }
};
