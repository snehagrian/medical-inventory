import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Reports } from './pages/reports/reports';
import { Signup } from './pages/signup/signup';
import { authGuard } from './auth.guard';
import { AppShell } from './layout/app-shell/app-shell';

export const routes: Routes = [
  { path: '', component: Login, pathMatch: 'full' },
  { path: 'signup', component: Signup },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'reports', component: Reports }
    ]
  }
];
