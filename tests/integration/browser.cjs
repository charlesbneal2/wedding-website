const { spawn } = require('node:child_process');
const { createServer } = require('node:http');
const { mkdtemp, readFile, rm, stat } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');

async function startBrowser() {
  const root = path.resolve(__dirname, '..', '..');
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  const server = createServer(async (request, response) => {
    try {
      let file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
      if (!file.startsWith(root + path.sep) && file !== root) {
        response.writeHead(403).end();
        return;
      }
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store' });
      response.end(await readFile(file));
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
      if (error.code !== 'ENOENT') console.error(error);
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const profile = await mkdtemp(path.join(tmpdir(), 'wedding-integration-'));
  const executable = process.env.CHROME_PATH || (process.platform === 'win32' ?
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome');
  let chrome;
  let socket;
  let messageId = 0;
  let navigationId = 0;
  const pending = new Map();
  const events = new Map();
  let chromeError;
  const close = async () => {
    try {
      if (socket?.readyState === WebSocket.OPEN) {
        await send('Browser.close');
        socket.close();
      }
    } finally {
      if (chrome?.pid && chrome.exitCode === null) {
        const exited = once(chrome, 'exit');
        chrome.kill();
        await exited;
      }
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
      await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  };
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++messageId;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Chrome command timed out: ${method}`));
      }, 10000);
      pending.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  function nextEvent(method) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        events.delete(method);
        reject(new Error(`Chrome event timed out: ${method}`));
      }, 10000);
      events.set(method, { resolve, timeout });
    });
  }
  async function evaluate(fn, ...args) {
    const result = await send('Runtime.evaluate', {
      expression: `(${fn.toString()})(...${JSON.stringify(args)})`,
      awaitPromise: true, returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result.value;
  }
  try {
    chrome = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run',
      '--no-default-browser-check', `--user-data-dir=${profile}`, '--remote-debugging-port=0',
      '--remote-debugging-address=127.0.0.1', 'about:blank'], { stdio: 'ignore' });
    chrome.on('error', error => { chromeError = error; });
    let port;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (chromeError) throw chromeError;
      if (chrome.exitCode !== null) throw new Error('Chrome exited before the tests could connect.');
      try {
        port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
        break;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      await delay(100);
    }
    if (!port) throw new Error('Chrome did not start. Set CHROME_PATH to a supported Chrome executable.');
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    const target = (await response.json()).find(target => target.type === 'page');
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await once(socket, 'open');
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (pending.has(message.id)) {
        const { resolve, reject, timeout } = pending.get(message.id);
        pending.delete(message.id);
        clearTimeout(timeout);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else resolve(message.result);
      } else if (events.has(message.method)) {
        const { resolve, timeout } = events.get(message.method);
        events.delete(message.method);
        clearTimeout(timeout);
        resolve(message.params);
      }
    });
    await send('Page.enable');
    await send('Network.enable');
    await send('Network.setBlockedURLs', { urls: ['https://*'] });
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    return {
      send, evaluate, close,
      async navigate(url) {
        const target = new URL(url, `http://127.0.0.1:${server.address().port}`);
        target.searchParams.set('integration', String(++navigationId));
        const loaded = nextEvent('Page.loadEventFired');
        await send('Page.navigate', { url: target.href });
        await loaded;
      },
      async waitFor(fn) {
        for (let attempt = 0; attempt < 100; attempt++) {
          if (await evaluate(fn)) return;
          await delay(50);
        }
        throw new Error(`Browser condition timed out: ${fn.toString()}`);
      },
      async viewport(width, height = 1000, reduced = false) {
        await send('Emulation.setDeviceMetricsOverride', {
          width, height, deviceScaleFactor: 1, mobile: width <= 600,
        });
        await send('Emulation.setTouchEmulationEnabled', { enabled: width <= 600 });
        await send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }],
        });
      },
    };
  } catch (error) {
    await close();
    throw error;
  }
}

module.exports = { startBrowser };
