'use strict';

const Service = require('egg').Service;
// const xmlbuilder = require('xmlbuilder').xmlbuilder;
const uuidv5 = require('uuid/v5').uuidv5;
const qs = require('qs').qs;
const md5 = require('md5').md5;

// import * as uuidv5 from 'uuid/v5';
// import * as qs from 'qs';
// import * as md5 from 'md5';

const appid = 'appid';
const secret = 'secret';

class Weixin extends Service {

  /* 获取微信openid */
  async getUserOpenid({ code }) {
    const ctx = this.ctx;
    const result = await ctx.curl(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}=&js_code=${code}&grant_type=authorization_code`, {
      method: 'GET',
    });
    return result.data;
  }

  /* 获取微信access_token */
  async getAccess_token() {
    const ctx = this.ctx;
    const result = await ctx.curl(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`, {
      method: 'GET',
    });
    return result.data;
  }

  /* 统一下单 */
  async payunifiedorder() {
    const ctx = this.ctx;
    const uuid = uuidv5('', uuidv5.DNS).replace(/-/g, '').toUpperCase();
    console.log(ctx.ip.replace(/::ffff:/g, ''));
    const order = {
      appid,
      body: '腾讯充值中心-QQ会员充值',
      nonce_str: uuid,
      notify_url: 'http://x5z5g2.natappfree.cc/getpay',
      out_trade_no: uuid,
      spbill_create_ip: '123.12.12.123',
      total_fee: 1,
      trade_type: 'APP',
    };
    const objStr = qs.stringify(order);
    const preSign = objStr + '&key=192006250b4c09247ec02edce69f6a2d';
    order.sign = md5(preSign).toUpperCase();
    // const xml = xmlbuilder.create(order).end({ pretty: true });
    const result = await ctx.curl('https://api.mch.weixin.qq.com/pay/unifiedorder', {
      method: 'POST',
      data: {},
    });
    console.log(result.data);
    // 二次签名，返回给app即可，由app端进行微信支付吊起
    const paysign2 = {
      appid: result.data.appid[0],
      noncestr: result.data.nonce_str[0],
      package: 'Sign=WXPay',
      partnerid: result.data.mch_id[0],
      prepayid: result.data.prepay_id[0],
      timestamp: Number(Date.now() / 1000), // 注意：时间必需为秒
    };

    const payPrestr = qs.stringify(paysign2) + 'key=微信商户平台的key'; // 不知道的话，可以问老板
    paysign2.sign = md5(payPrestr).toUpperCase();
    return paysign2;
  }

  // 微信回调
  async wxNotify(params) {
    const ctx = this.ctx;
    // 接受微信参数
    const payQuery = {
      appid: params.appid[0],
      mch_id: params.mch_id[0],
      nonce_str: params.nonce_str[0],
      out_trade_no: params.out_trade_no[0],
      transaction_id: params.transaction_id[0],
    };
    const payQueryString = qs.stringify(payQuery) + 'key=微信商户平台的key';
    payQuery.sign = md5(payQueryString).toUpperCase();
    // const payQueryxml = xmlbuilder.create(payQuery).end({ pretty: true });
    // 查询订单是否支付成功
    const result = await ctx.curl('https://api.mch.weixin.qq.com/pay/orderquery', {
      method: 'POST',
      //   data: payQueryxml,
      data: {},
    });

    if (result.data.xml.return_code[0] && result.xml.return_code[0] === 'SUCCESS' && result.xml.trade_state[0] === 'SUCCESS') {
      // 告诉微信，你收到支付结果通知了
      const res = {
        return_code: '<![CDATA[SUCCESS]]>',
        return_msg: '<![CDATA[OK]]>',
      };
      //   const resxml = xmlbuilder.create(res).end({ pretty: true });
      //   return resxml;
      return {};
    }
  }
}

module.exports = Weixin;
