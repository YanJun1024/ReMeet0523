<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')
})
</script>

<style lang="scss">
/* 全局样式 */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #F8F9FA;
  /* 主色调 - 小程序使用 page 选择器 */
  --primary-color: #4A90E2;
  --primary-light: #E3F2FD;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --border-color: #E8E8E8;
  --card-bg: #FFFFFF;
  --page-bg: #F8F9FA;
}
</style>
