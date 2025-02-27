<template>
  <div class="setting">
    <el-collapse class="collapse" v-model="activeName" accordion>
      <el-collapse-item title="个性化调整" name="2">
        <div class="item">
          <span class="text">建站日期显示</span>
          <el-switch
            v-model="siteStartShow"
            inline-prompt
            :active-icon="CheckSmall"
            :inactive-icon="CloseSmall"
          />
        </div>
      </el-collapse-item>
      <el-collapse-item title="其他设置" name="4">
        <div>设置内容待增加</div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { CheckSmall, CloseSmall } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { storeToRefs } from "pinia";

const store = mainStore();
const { siteStartShow } = storeToRefs(store);

// 默认选中项
const activeName = ref("1");
</script>

<style lang="scss" scoped>
.setting {
  position: relative;
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  scroll-behavior: smooth;

  .collapse {
    border-radius: 8px;
    --el-collapse-content-bg-color: #ffffff10;
    border-color: transparent;
    box-sizing: border-box;

    // 添加平滑过渡效果
    :deep(.el-collapse-item__wrap),
    :deep(.el-collapse-item__content) {
      transition: all 0.3s ease;
    }

    :deep(.el-collapse-item) {
      margin-bottom: 0;
    }

    :deep(.el-collapse-item__header) {
      background-color: #ffffff30;
      color: #fff;
      font-size: 15px;
      padding-left: 18px;
      border-color: transparent;
      position: sticky;
      top: 0;
      z-index: 10;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #ffffff40;
      }

      &.is-active {
        border-bottom-color: transparent;
      }
    }

    :deep(.el-collapse-item__wrap) {
      border-color: transparent;
      max-height: calc(100vh - 220px); // 防止内容过长溢出屏幕
      overflow-y: auto;

      .el-collapse-item__content {
        padding: 20px;
        z-index: 1;

        .item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          font-size: 14px;
          .el-switch__core {
            border-color: transparent;
            background-color: #ffffff30;
          }
          .el-radio-group {
            .el-radio {
              margin: 2px 10px 2px 0;
              border-radius: 5px;

              &:last-child {
                margin-right: 0;
              }
            }
          }
        }
        .el-radio-group {
          justify-content: space-between;

          .el-radio {
            margin: 10px 16px;
            background: #ffffff26;
            border: 2px solid transparent;
            border-radius: 8px;

            .el-radio__label {
              color: #fff;
            }

            .el-radio__inner {
              background: #ffffff06 !important;
              border: 2px solid #eeeeee !important;
            }

            &.is-checked {
              background: #ffffff06 !important;
              border: 2px solid #eeeeee !important;
            }

            .is-checked {
              .el-radio__inner {
                background-color: #ffffff30 !important;
                border-color: #fff !important;
              }

              & + .el-radio__label {
                color: #fff !important;
              }
            }
          }
        }
      }
    }
  }
}
</style>
