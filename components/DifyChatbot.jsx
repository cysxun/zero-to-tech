// components/DifyChatbot.jsx —— Dify 聊天机器人（全站全局嵌入）
// 用客户端组件 + useEffect 动态注入，绕开 next/script 策略机制的时序问题：
//   1) 先同步设置 window.difyChatbotConfig
//   2) 再动态加载 embed.min.js（此时配置已就绪，embed 执行时一定能读到）
//   3) 注入气泡按钮 / 窗口的自定义样式
// 注意：baseUrl 必须指向"公网用户浏览器能访问到"的 Dify 地址。
//   - 上线：NEXT_PUBLIC_DIFY_BASE_URL 留空 → 运行时取当前站点域名（同源），
//     由 server 的 nginx 把 /embed.min.js、/chatbot/、/api/ 反代到 Dify 8088
//   - 本地开发：.env.local 里设 NEXT_PUBLIC_DIFY_BASE_URL=http://localhost:8088
// 千万别写死 localhost——用户浏览器里的 localhost 指向访问者自己的电脑。

"use client";

import { useEffect } from "react";

const DIFY_TOKEN = "yP0dzwevMBWyqrUY";
// 环境变量优先；留空则运行时取 window.location.origin（网站自己的域名，同源）
const DIFY_BASE_URL = process.env.NEXT_PUBLIC_DIFY_BASE_URL || "";

export default function DifyChatbot() {
  useEffect(() => {
    // 防止 React StrictMode / 热更新下重复注入
    if (document.getElementById("dify-chatbot-embed-script")) return;

    const baseUrl = DIFY_BASE_URL || window.location.origin;

    // 1) 配置必须最先设置
    // dynamicScript: true 是关键——embed.min.js 默认靠
    // document.body.onload 触发初始化，而动态注入时 load
    // 事件早已触发过，必须让脚本立即执行（Dify 官方为此提供的开关）
    window.difyChatbotConfig = {
      token: DIFY_TOKEN,
      baseUrl,
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
    script.src = `${baseUrl}/embed.min.js`;
    script.id = "dify-chatbot-embed-script";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
}
