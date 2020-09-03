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
        const notifyUrl = "https://www.weixin.qq.com/wxpay/pay.php";
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
                        log("parser xml error ", err);
                    } else {
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
                            if (err) {
                                console.log("axios post error", err);
                                resolve({
                                    aaa: "1111",
                                });
                            }
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
     * 全部标记为已读
     * @param {object} params - 条件
     * @return {object|null} - 操作结果
     */
    async callbackWx(params = {}) {
        const { app } = this;
        return {};
    }

    /**
     * code2Session code 换取登陆凭证
     * @param {object} params - 条件
     * @return {object|null} - 操作结果
     */
    async wxCode2Session(params = {}) {
        console.log(params.code)
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
}

module.exports = WxPay;
