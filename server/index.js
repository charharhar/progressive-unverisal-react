import { resolve as pathResolve } from 'path';
import express from 'express';
import compression from 'compression';
import appRootDir from 'app-root-dir';
import config from '../tools/config';

import App from '../shared/App';
import security from './middleware/security';
import serviceWorker from './middleware/serviceWorker';
import offlinePage from './middleware/offlinePage';
import renderApp from './middleware/renderApp';

const ngrok = process.env.ENABLE_TUNNEL === 'true' ? require('ngrok') : false;
const isProd = process.env.NODE_ENV === 'production';
const {
  host,
  webPath,
  publicPath,
  serverPort,
  offlinePageName,
  clientOutputPath,
} = config;

const app = express();

// ===========================
//         Middlewares
// ===========================
app.disable('x-powered-by');
app.use(...security);

// Gzip compress all responses
app.use(compression());

if (isProd) {
  // Register service worker
  app.get('/sw.js', serviceWorker);
  // Serve offline page template
  app.get(`${webPath}${offlinePageName}`, offlinePage);
}

// Serve ./build/client from /client
app.use(webPath, express.static(pathResolve(appRootDir.get(), clientOutputPath)));
// Serve ./public from /
app.use('/', express.static(pathResolve(appRootDir.get(), publicPath)));
// Render the react application
app.use(renderApp);

// ===========================
//       HTTP Listener
// ===========================

const server = app.listen(serverPort, host, (err) => {
  if (err) {
    return console.error(err);
  }

  if (ngrok) {
    ngrok.connect(serverPort, (innerErr, url) => {
      if (innerErr) {
        return console.error(err);
      }
      console.log(`Server tunnel enabled at ${url}`)
    })
  } else {
    console.log(`Server listening at http://${host}:${serverPort}`)
  }
})

export default server;
