import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeContainer} from './containers/home/home.component';
import { AuthGuard } from './helpers/auth.guard';
import { LandingContainer } from './containers/landing/landing.component';
import { SignupContainer } from './containers/signup/signup.component';

const routes: Routes = [
  { path: '', component: HomeContainer, canActivate: [AuthGuard], data: { animation: 'home', layer: 1 } },
  { path: 'login', component: LandingContainer, data: { animation: 'login', layer: 2 } },
  { path: 'signup', component: SignupContainer, data: { animation: 'signup', layer: 3 } },
  { path: 'user',
    loadChildren: () => import('./containers/user/user.module').then(mod => mod.UserModule)
  },

  // otherwise redirect to home
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule { }

