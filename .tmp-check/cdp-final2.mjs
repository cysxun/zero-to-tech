import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
const get = (url) => new Promise((res, rej) => {
  http.get(url, r => { let d=''; r.on('data', c => d+=c); r.on('end', () => res(d)); }).on('error', rej);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const port = 6700 + Math.floor(Math.random()*50);
const dataDir = `/tmp/cdp-${Date.now()}`;
fs.mkdirSync(dataDir, { recursive: true });
const chrome = spawn('google-chrome', [
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  `--remote-debugging-port=${port}`,`--user-data-dir=${dataDir}`,'about:blank'
], { stdio: 'ignore' });
try {
  let tabs;
  for (let i = 0; i < 20; i++) { await sleep(500); try { tabs = JSON.parse(await get(`http://127.0.0.1:${port}/json`)); if (tabs.length) break; } catch {} }
  const page = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map();
  const errors = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map(a=>a.value||a.description||'').join(' '));
    if (msg.method === 'Runtime.exceptionThrown') errors.push('EXC: ' + JSON.stringify(msg.params.exceptionDetails?.exception?.description||msg.params.exceptionDetails?.text));
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  const send = (method, params={}) => new Promise(res => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({id: mid, method, params})); });
  const evalJs = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); return r.result?.result?.value; };
  await send('Page.enable'); await send('Runtime.enable');
  // 用 127.0.0.1 访问（之前 CORS 会拦的场景）
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
  await sleep(8000);
  console.log('=== 主页（127.0.0.1:3000） ===');
  console.log('hero:', await evalJs(`document.querySelector('.hero-display')?.textContent||'无'`));
  console.log('errors:', errors.length ? errors.slice(0,3).join('\n') : '无 ✅');
  // 去文字实验室
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/text-lab' });
  await sleep(6000);
  console.log('=== 文字实验室 ===');
  // 清空错误列表重新收集
  errors.length = 0;
  console.log('点击分析按钮...');
  await evalJs(`document.querySelector('button.primary-button')?.click()`);
  await sleep(4000);
  console.log('结果卡片:', await evalJs(`document.querySelector('.result-card, [class*="result"]')?.innerText?.slice(0,200)||'无'`));
  console.log('errors:', errors.length ? errors.slice(0,3).join('\n') : '无 ✅');
} catch (e) { console.log('ERROR:', e.message); } finally { chrome.kill(); process.exit(0); }
