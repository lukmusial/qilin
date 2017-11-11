import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'babel-polyfill';

import App from 'views/Insurer';

import es6Promise from 'es6-promise';
import 'isomorphic-fetch';
import getWeb3 from 'utils/getWeb3'

// Load SCSS
//import '../css/side-menu';

es6Promise.polyfill();

const render = Component => {
  ReactDOM.render(
    <AppContainer>
        <Component />
    </AppContainer>,
    document.getElementById('root')
  );
};

// Render app
render(App);

if (module.hot) {
  module.hot.accept('./views/Insurer/', () => {
    const NewApp = require('./views/Insurer/index').default; // eslint-disable-line global-require
    render(NewApp);
  });
}
