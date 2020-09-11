"use strict";

const Service = require("egg").Service;
const axios = require("axios");
const xml2js = require("xml2js");
const xmlParser = new xml2js.Parser();

const payParams = {
  appid: "wxeb98655bdfa04de3",
  mch_id: "1601560828",
  device_info: "wxmini",
  nonce_str: Math.random().toString(36).substr(2, 15),

};

/**
 * wxpay 支付相关 - 消息通知
 * @class
 */
class WxPay extends Service {
  /**
   * 微信预下单
   */
  async wxbeforeOrder(params, notice) {
    const { ctx, app } = this;
    const {
      wx_getNonceStr,
      wx_getPaySign,
      wx_getTradeId,
      wx_getPrePaySign,
      wx_wxSendData,
    } = app;
    const attach = "GJS-ORG";
    const nonceStr = wx_getNonceStr();
    const productIntro = params.productIntro || "农家好商品";
    const wx_openId = params.wx_openId || "111111";
    console.log("((((((((((((((((((((((((((");
    console.log(params);
    // 生成商家内部自定义的订单号, 商家内部的系统用的, 理论上只要不和其他订单重复, 使用任意的字符串都是可以的
    const tradeId = wx_getTradeId(attach);
    const notifyUrl = "https://www.katoto.cn/api/weapp/callbackWx";
    const IP = ctx.request.ip || "127.0.0.1";
    let price = params.price || 1;
    // 生成签名 需要顺序
    const sign = wx_getPrePaySign(
      payParams.appid,
      attach,
      productIntro,
      payParams.mch_id,
      nonceStr,
      notifyUrl,
      wx_openId,
      tradeId,
      IP,
      price
    );
    if (params.uuid) {
      await this.app.model.GoodsOrder.addOrderSignTrade({
        uuid: params.uuid,
        sign: sign,
        tradeId: tradeId,
      });
    }
    const sendData = wx_wxSendData(
      payParams.appid,
      attach,
      productIntro,
      payParams.mch_id,
      nonceStr,
      notifyUrl,
      wx_openId,
      tradeId,
      IP,
      price,
      sign
    );

    console.log(sendData);
    console.log("-----sendData---------");
    // 使用 axios 发送数据带微信支付服务器, 没错, 后端也可以使用 axios
    let wxResponse = await axios.post(
      "https://api.mch.weixin.qq.com/pay/unifiedorder",
      sendData
    );
    return formateResponse(wxResponse);
    function formateResponse(wxResponse) {
      // 微信返回的数据也是 xml, 使用 xmlParser 将它转换成 js 的对象
      return new Promise((resolve) => {
        xmlParser.parseString(wxResponse.data, (err, success) => {
          if (err) {
            console.log("parser xml error ", err);
          } else {
            console.log(success.xml);
            if (
              success.xml.return_code &&
              success.xml.return_code[0] === "SUCCESS"
            ) {
              if (success.xml.prepay_id) {
                //   拿到prepay_id 之后，再次进行二次签名，返回
                const prepayId = success.xml.prepay_id[0];
                const payParamsObj = wx_getPayParams(prepayId, tradeId);
                // 返回给前端, 这里是 express 的写法
                console.log(success.xml);
                console.log(")))))))))))))))))))))))))))))))))))))))");
                console.log(payParamsObj);
                resolve(payParamsObj);
              } else {
                resolve(success.xml);
              }
            } else {
              // 错误处理
              console.log("axios post error", err);
              resolve({
                error: success.xml,
              });
            }
          }
        });
      });
    }

    function wx_getPayParams(prepayId, tradeId) {
      const nonceStr = wx_getNonceStr();
      const timeStamp = new Date().getTime().toString();
      const packageId = "prepay_id=" + prepayId;
      const paySign = wx_getPaySign(
        payParams.appid,
        timeStamp,
        nonceStr,
        packageId
      );
      // 前端需要的所有数据, 都从这里返回过去
      const payParamsObj = {
        nonceStr: nonceStr,
        timeStamp: timeStamp,
        package: packageId,
        paySign: paySign,
        signType: "MD5",
        tradeId: tradeId,
      };
      console.log("=================");
      console.log(payParamsObj);
      return payParamsObj;
    }
  }

  /**
   * 接收支付通知
   * @param {object} params - 条件
   * @return {object|null} - 操作结果
   */
  async callbackWx(params = {}) {
    // 一定要做签名验证,并校验返回的订单金额是否与商户侧的订单金额一致 (读出订单，设置订单)
    console.log("==========callbackWx 微信回调参数=======");
    console.log(params);
    console.log("==========callbackWx 微信回调参数=======");
    params = {
      return_code: "SUCCESS",
      return_msg: `<xml>
        <appid><![CDATA[wx2421b1c4370ec43b]]></appid>
        <attach><![CDATA[支付测试]]></attach>
        <bank_type><![CDATA[CFT]]></bank_type>
        <fee_type><![CDATA[CNY]]></fee_type>
        <is_subscribe><![CDATA[Y]]></is_subscribe>
        <mch_id><![CDATA[10000100]]></mch_id>
        <nonce_str><![CDATA[5d2b6c2a8db53831f7eda20af46e531c]]></nonce_str>
        <openid><![CDATA[oUpF8uMEb4qRXf22hE3X68TekukE]]></openid>
        <out_trade_no><![CDATA[ty_GJS-ORG_159970952133829196]]></out_trade_no>
        <result_code><![CDATA[SUCCESS]]></result_code>
        <return_code><![CDATA[SUCCESS]]></return_code>
        <sign><![CDATA[9F316A05193F167C786F4860D223D8C9]]></sign>
        <time_end><![CDATA[20140903131540]]></time_end>
        <total_fee>1</total_fee>
        <coupon_fee><![CDATA[10]]></coupon_fee>
        <coupon_count><![CDATA[1]]></coupon_count>
        <coupon_type><![CDATA[CASH]]></coupon_type>
        <coupon_id><![CDATA[10000]]></coupon_id>
        <trade_type><![CDATA[JSAPI]]></trade_type>
        <transaction_id><![CDATA[1004400740201409030005092168]]></transaction_id>
      </xml>`,
    };
    let _this = this;
    return await xmlParseFn(params.return_msg);
    function xmlParseFn(msg) {
      return new Promise(async (resolve) => {
        xmlParser.parseString(msg, async (err, success) => {
          if (success && success.xml && success.xml.out_trade_no) {
            // 跟进订单号找出订单记录 签名
            let _getData = await _this.app.model.GoodsOrder.getLineByTrade({
              sign: success.xml.sign[0],
              tradeId: success.xml.out_trade_no[0],
            });
            console.log(_getData && _getData.dataValues);
            console.log("------_getData-value-------");
            if (_getData && _getData.dataValues && _getData.dataValues.uuid) {
              // 更新数据的status 状态
              await _this.app.model.GoodsOrder.callbackWxpay({
                uuid: _getData.dataValues.uuid,
              });
              resolve({
                type: "callback_wx",
                data: `<xml>
                      <return_code><![CDATA[SUCCESS]]></return_code>
                      <return_msg><![CDATA[OK]]></return_msg>
                    </xml>`,
              });
            }
            resolve({
              type: "callback_wx_error",
              data: `<xml>
                      <return_code><![CDATA[SUCCESS]]></return_code>
                      <return_msg><![CDATA[OK]]></return_msg>
                    </xml>`,
            });
          }
        });
      });
    }
  }

  /**
   * code2Session code 换取登陆凭证
   * @param {object} params - 条件
   * @return {object|null} - 操作结果
   */
  async wxCode2Session(params = {}) {
    console.log(params.code);
    let _backData = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${payParams.appid}&secret=${payParams.AppSecret}&js_code=${params.code}&grant_type=authorization_code`
    );
    return _backData.data;
    // const payParams = {
    //     appid: "wxeb98655bdfa04de3",
    //     mch_id: "1601560828",
    //     device_info: "wxmini",
    //     nonce_str: Math.random().toString(36).substr(2, 15),
    //     AppSecret: "d4b607fd1f28478fd1ee00326ceea0fc",
    //     PAY_API_KEY = "Gho9V4VC2ttDwPxXHyJCOsJUcs8OXiUa"
    //   };
  }
  /**
   * 根据uuid获取订单，不验证组织
   * @param {string} uuid - 条件
   * @return {object|null} - 查找结果
   */
  async getByUuid(uuid) {
    const { app } = this;
    return await app.model.GoodsOrder.getByUuid(uuid);
  }
}

module.exports = WxPay;
