import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
const get = (url) => new Promise((res, rej) => {
  http.get(url, r => { let d=''; r.on('data', c => d+=c); r.on('end', () => res(d)); }).on('error', rej);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const port = 6900 + Math.floor(Math.random()*50);
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
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await sleep(8000);
  console.log('hero 标题:', await evalJs(`document.querySelector('.hero-display')?.textContent||'无'`));
  console.log('页面文本（前120）:', await evalJs(`document.body.innerText.slice(0,120)`));
  console.log('--- 捕获的 console 错误 ---');
  console.log(errors.length ? errors.slice(0,5).join('\n') : '无错误 ✅');
} catch (e) { console.log('ERROR:', e.message); } finally { chrome.kill(); process.exit(0); }
