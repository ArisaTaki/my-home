<template>
  <div class="set" @mouseenter="closeShow = true" @mouseleave="closeShow = false" @click.stop>
    <transition name="el-fade-in-linear">
      <close-one
        class="close"
        theme="filled"
        size="28"
        fill="#ffffff60"
        v-show="closeShow"
        @click="store.setOpenState = false"
      />
    </transition>
    <el-row :gutter="40">
      <el-col :span="12" class="left">
        <div class="logo text-hidden">
          <span class="bg">{{ siteUrl[0] }}</span>
          <span class="sm">.{{ siteUrl[1] }}</span>
        </div>
        <div class="version">
          <div class="num">v&nbsp;{{ config.version }}</div>
          <el-tooltip content="Github 此主页项目" placement="right" :show-arrow="false">
            <github-one class="github" theme="outline" size="24" @click="jumpTo(config.github)" />
          </el-tooltip>
        </div>
        <el-card class="update">
          <template #header>
            <div class="card-header">
              <span>更新日志</span>
            </div>
          </template>
          <div class="upnote">
            <div v-if="isLoading" class="loading-container">
              <el-icon class="loading-icon"><loading /></el-icon>
              <span>加载更新日志中...</span>
            </div>
            <template v-else>
              <div v-if="upData.commits.length === 0" class="empty-log">暂无更新记录</div>
              <div v-for="item in upData.commits" :key="item.message" class="uptext">
                <div class="commit-content">
                  <el-icon v-if="item.type === 'fix'" class="i-icon fix-icon"><bug /></el-icon>
                  <el-icon v-else class="i-icon feature-icon"><add-one /></el-icon>
                  <span class="message">{{ item.message }}</span>
                </div>
                <span class="date">{{ item.date }}</span>
              </div>
            </template>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12" class="right">
        <div class="title">
          <setting-two theme="filled" size="28" fill="#ffffff60" />
          <span class="name">全局设置</span>
        </div>
        <Set />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { CloseOne, SettingTwo, GithubOne, AddOne, Bug, Loading } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import Set from "@/components/Set.vue";
import config from "@/../package.json";

const store = mainStore();
const closeShow = ref(false);
const isLoading = ref(false);

// 站点链接
const siteUrl = computed(() => {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url) return "imsyy.top".split(".");
  // 判断协议前缀
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const urlFormat = url.replace(/^(https?:\/\/)/, "");
    return urlFormat.split(".");
  }
  return url.split(".");
});

// 更新日志
const upData = ref({
  commits: [],
});

// 从本地存储中获取缓存的更新日志
const getCachedChangelog = () => {
  try {
    const cachedData = localStorage.getItem("changelog_cache");
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      // 缓存有效期为1小时
      if (Date.now() - timestamp < 3600000) {
        console.log("使用缓存的更新日志数据");
        return data;
      }
    }
  } catch (error) {
    console.error("读取缓存数据失败:", error);
  }
  return null;
};

// 缓存更新日志到本地存储
const cacheChangelog = (data) => {
  try {
    localStorage.setItem(
      "changelog_cache",
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  } catch (error) {
    console.error("缓存数据失败:", error);
  }
};

// 从GitHub API获取提交记录
const loadChangelog = async () => {
  isLoading.value = true;

  // 先尝试获取缓存的数据
  const cachedData = getCachedChangelog();
  if (cachedData) {
    upData.value = cachedData;
    isLoading.value = false;
    return;
  }

  try {
    // 从package.json中获取GitHub仓库信息
    const repoUrl = config.github;
    // 解析仓库所有者和名称
    const matches = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!matches || matches.length < 3) {
      throw new Error("无法解析GitHub仓库信息");
    }

    const owner = matches[1];
    const repo = matches[2];

    // 使用GitHub API获取最近的提交记录
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=30&sha=dev`;
    console.log("正在从以下地址获取提交记录:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`GitHub API 请求失败: ${response.status}`);
    }

    const commits = await response.json();
    console.log(`获取到${commits.length}条提交记录`);

    // 处理提交记录
    const commitList = [];

    commits.forEach((commit) => {
      const message = commit.commit.message.split("\n")[0]; // 获取提交消息的第一行
      const date = new Date(commit.commit.committer.date);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      // 排除版本更新和自动生成的提交
      if (
        message.includes("版本号") ||
        message.includes("[skip ci]") ||
        message.includes("Merge") ||
        message.includes("merge") ||
        message.includes("chore:")
      ) {
        return;
      }

      // 清理提交信息，去除前缀
      const cleanedMessage = message
        .replace(
          /^(feat|fix|feat|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9\-_.]+\))?:\s*/,
          "",
        )
        .trim();

      if (cleanedMessage && !commitList.some((item) => item.message === cleanedMessage)) {
        commitList.push({
          message: cleanedMessage,
          date: formattedDate,
          type: message.match(/^fix|修复|bug|订正/i) ? "fix" : "feature",
        });
      }
    });

    // 更新数据，最多显示10条记录
    const result = {
      commits: commitList.slice(0, 10),
    };

    // 缓存结果
    cacheChangelog(result);

    upData.value = result;
    console.log("处理后的更新日志:", upData.value);
  } catch (error) {
    console.error("无法从GitHub获取更新日志:", error);
    // 回退到静态数据
    upData.value = {
      commits: [
        { message: "使用GitHub API直接获取提交记录", date: "2023-04-20", type: "feature" },
        { message: "修复更新日志显示问题", date: "2023-04-15", type: "fix" },
      ],
    };
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadChangelog();
});

// 跳转源代码仓库
const jumpTo = (url) => {
  window.open(url);
};
</script>

<style lang="scss" scoped>
.set {
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  background: rgb(255 255 255 / 40%);
  border-radius: 6px;
  padding: 40px;

  .close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 28px;
    height: 28px;

    &:hover {
      transform: scale(1.2);
    }

    &:active {
      transform: scale(1);
    }
  }

  .el-row {
    height: 100%;
    flex-wrap: nowrap;

    .left {
      height: 100%;
      padding-left: 40px !important;
      padding-bottom: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .logo {
        transform: translateY(-8%);
        font-family: "Pacifico-Regular";
        padding-left: 22px;
        width: 100%;
        height: 260px;
        min-height: 140px;
        .bg {
          font-size: 5rem;
        }

        .sm {
          margin-left: 6px;
          font-size: 2rem;
        }

        @media (max-width: 990px) {
          .bg {
            font-size: 4.5rem;
          }
          .sm {
            font-size: 1.7rem;
          }
        }
        @media (max-width: 825px) {
          .bg {
            font-size: 3.8rem;
          }
          .sm {
            font-size: 1.3rem;
          }
        }
      }

      .version {
        display: flex;
        flex-direction: row;
        align-items: center;

        .num {
          font-size: 2rem;
          font-family: "Pacifico-Regular";
        }

        .github {
          width: 24px;
          height: 24px;
          margin-left: 12px;
          margin-top: 6px;

          &:hover {
            transform: scale(1.2);
          }
        }
      }

      .update {
        margin-top: 30px;
        height: 100%;

        :deep(.el-card__body) {
          height: 100%;

          .upnote {
            padding: 20px;
            height: calc(100% - 56px);
            overflow-y: auto;

            .loading-container {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100%;
              color: #666;

              .loading-icon {
                font-size: 32px;
                margin-bottom: 10px;
                animation: rotate 1.5s linear infinite;
              }

              @keyframes rotate {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            }

            .empty-log {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100%;
              color: #999;
              font-style: italic;
            }

            .uptext {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 16px;

              &:nth-last-of-type(1) {
                padding: 0;
              }

              .commit-content {
                display: flex;
                align-items: center;
                flex: 1;
                min-width: 0;
              }

              .message {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .date {
                font-size: 12px;
                margin-left: 8px;
                flex-shrink: 0;
              }

              .fix-icon {
                color: #f56c6c;
              }

              .feature-icon {
                color: #67c23a;
              }

              .i-icon {
                width: 22px;
                height: 22px;
                margin-right: 8px;
                flex-shrink: 0;
              }
            }
          }
        }
      }
    }

    .right {
      height: 100%;
      padding-right: 40px !important;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .title {
        display: flex;
        align-items: center;
        flex-direction: row;
        font-size: 18px;
        margin-bottom: 16px;

        .i-icon {
          width: 28px;
          height: 28px;
          margin-right: 6px;
        }
      }
    }
  }
}
</style>
