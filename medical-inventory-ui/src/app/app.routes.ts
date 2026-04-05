import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Signup } from './pages/signup/signup';

export const routes: Routes = [
  { path: '', component: Login },
  {path: 'signup', component: Signup},
  { path: 'dashboard', component: Dashboard }
];