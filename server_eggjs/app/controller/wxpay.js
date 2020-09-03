'use strict';
const Controller = require('../core/base_controller');
class WxPay extends Controller {

  async wxpay() {
    const ctx = this.ctx;
    const result = await ctx.service.wxpay.payunifiedorder();
    ctx.body = result;
  }

  /* 微信回调 */
  async wxNotify() {
    const ctx = this.ctx;
    const result = await ctx.service.wxpay.wxNotify(ctx.params);
    ctx.body = result;
  }
}
module.exports = WxPay;
