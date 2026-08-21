// components/DifyChatbot.jsx —— Dify 聊天机器人（全站全局嵌入）
// 用客户端组件 + useEffect 动态注入，绕开 next/script 策略机制的时序问题：
//   1) 先同步设置 window.difyChatbotConfig
//   2) 再动态加载 embed.min.js（此时配置已就绪，embed 执行时一定能读到）
//   3) 注入气泡按钮 / 窗口的自定义样式
// 注意：baseUrl 必须指向 Dify 服务真实地址。
// 本机 Docker 部署的 Dify 是 http://localhost:8088（映射自容器 80 端口）。
// 上线时改成你的 Dify 域名，如 https://dify.yourdomain.com。

"use client";

import { useEffect } from "react";

const DIFY_TOKEN = "yP0dzwevMBWyqrUY";
const DIFY_BASE_URL = "http://localhost:8088"; // ← 上线时改成 Dify 真实地址

export default function DifyChatbot() {
  useEffect(() => {
    // 防止 React StrictMode / 热更新下重复注入
    if (document.getElementById("dify-chatbot-embed-script")) return;

    // 1) 配置必须最先设置
    // dynamicScript: true 是关键——embed.min.js 默认靠
    // document.body.onload 触发初始化，而动态注入时 load
    // 事件早已触发过，必须让脚本立即执行（Dify 官方为此提供的开关）
    window.difyChatbotConfig = {
      token: DIFY_TOKEN,
      baseUrl: DIFY_BASE_URL,
      dynamicScript: true,
      inputs: {},
      systemVariables: {},
      userVariables: {},
    };

    // 2) 自定义样式
    const style = document.createElement("style");
    style.textContent = `
      #dify-chatbot-bubble-button {
        background-color: #1C64F2 !important;
      }
      #dify-chatbot-bubble-window {
        width: 24rem !important;
        height: 40rem !important;
      }
    `;
    document.head.appendChild(style);

    // 3) 动态加载 embed.min.js（append 后异步加载执行，config 已就绪）
    const script = document.createElement("script");
    script.src = `${DIFY_BASE_URL}/embed.min.js`;
    script.id = "dify-chatbot-embed-script";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
}
