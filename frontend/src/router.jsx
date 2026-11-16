import { createBrowserRouter } from 'react-router'
import { AppShell } from './components/AppShell.jsx'
import { setUnauthorizedHandler } from './lib/api.js'
import { loginAction, registerAction } from './lib/authActions.js'
import { logoutAction, requireAdmin, requireGuest, requireUser } from './lib/guards.js'
import { queryClient } from './lib/queryClient.js'
import { ErrorPage, NotFound, Splash } from './routes/ErrorPage.jsx'

// Data router: guards run as route loaders, forms submit to route actions.
// Pages are lazy-loaded so each ships as its own chunk.
export const router = createBrowserRouter([
  {
    ErrorBoundary: ErrorPage,
    HydrateFallback: Splash,
    children: [
      { path: '/login', loader: requireGuest, action: loginAction, lazy: () => import('./routes/Login.jsx') },
      { path: '/register', loader: requireGuest, action: registerAction, lazy: () => import('./routes/Register.jsx') },
      { path: '/logout', action: logoutAction, loader: () => logoutAction() },
      {
        id: 'app',
        path: '/',
        loader: requireUser,
        Component: AppShell,
        children: [
          { index: true, lazy: () => import('./routes/Dashboard.jsx') },
          { path: 'transactions', lazy: () => import('./routes/Transactions.jsx') },
          { path: 'users', loader: requireAdmin, lazy: () => import('./routes/Users.jsx') },
          { path: '*', Component: NotFound },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
])

// A 401 from the API ends the session and sends the user to sign in.
setUnauthorizedHandler(() => {
  queryClient.clear()
  router.navigate('/login', { replace: true })
})
