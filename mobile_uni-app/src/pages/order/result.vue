<template>
  <view>
    <view class="order-result order-status">
      <block v-if="orderStatus === 'success'">
        <image
          class="status-icon"
          src="//cimg1.fenqile.com/ibanner2/M00/02/03/kKgHAF5NGiGARNIWAAAIFUcKvFo867.png"
        />
        <text class="status-text">支付成功</text>
      </block>
      <block v-else-if="orderStatus === 'fail'">
        <image
          class="status-icon"
          src="//cimg1.fenqile.com/ibanner2/M00/02/03/kKgHAF5NHoCAeEZrAAAIXnvqJgs006.png"
        />
        <text class="status-text">支付失败</text>
      </block>
      <block v-else>
        <image
          class="status-icon"
          src="//cimg1.fenqile.com/ibanner2/M00/02/03/kKgHAF5NHjCAa-n6AAAH6DLE4pA878.png"
        />
        <text class="status-text">处理中</text>
      </block>
    </view>
    <view class="order-tips"><text>小主，商品已经在准备了，请耐心等等哦~</text></view>
    <view class="order-btn" @click="goHome()">
      <text>回到首页</text>
    </view>
  </view>
</template>

<script>
export default {
  components: {},
  data() {
    return {
      orderStatus: ""
    };
  },
  computed: {
    isIphoneX: () => uni.isIphoneX
  },
  methods: {
    // todo 可以搞个轮询
    async get(uuid) {
      const res = (await this.$api.order.getOrderBill({ uuid })) || {};
      this.order = res;
      this.goodsList = [res];
      if (res.status === "initial") {
        this.getCountDown(res.createdTime, uuid);
      }
    },
    goHome() {
      setTimeout(() => {
        uni.switchTab({
          url: "/pages/index/index"
        });
      }, 100);
    }
  },
  async onLoad(options) {}
};
</script>

<style lang="scss">
page {
  background-color: #fff;
}
.order-status {
  margin-top: 130rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}
.status-icon {
  width: 72upx;
  height: 72upx;
}
.status-text {
  padding-left: 18upx;
  font-size: 50upx;
  font-family: PingFangSC-Medium;
  font-weight: 500;
  color: #17161c;
}
.order-tips {
  margin-top: 64upx;
  font-size: 32upx;
  font-family: PingFangSC-Medium;
  font-weight: 500;
  color: #17161c;
  text-align: center;
}
.order-btn {
  width: 360upx;
  height: 100upx;
  line-height: 100upx;
  border-radius: 8upx;
  border: 1px solid #17161c;
  background: #ffffff;
  margin: 160upx auto;
  text-align: center;
}
</style>
