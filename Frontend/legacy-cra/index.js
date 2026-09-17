import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { store } from './Redux/store';
import { Provider } from "react-redux";
import { Auth0Provider } from '@auth0/auth0-react';
import reportWebVitals from './reportWebVitals';

const auth0Domain = process.env.REACT_APP_AUTH0_DOMAIN || 'your-auth0-domain';
const auth0ClientId = process.env.REACT_APP_AUTH0_CLIENT_ID || 'your-auth0-client-id';
const auth0CallbackUrl = process.env.REACT_APP_AUTH0_CALLBACK_URL || window.location.origin;
const auth0Audience = process.env.REACT_APP_AUTH0_AUDIENCE || 'http://localhost:8082';
const auth0Scope = process.env.REACT_APP_AUTH0_SCOPE || 'openid profile email';

const app = (
  <Provider store={store}>
    <ChakraProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </Provider>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: auth0CallbackUrl,
        audience: auth0Audience,
        scope: auth0Scope,
      }}
      cacheLocation="localstorage"
      useRefreshTokens
    >
      {app}
    </Auth0Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
