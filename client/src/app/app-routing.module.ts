import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeContainer} from './containers/home/home.component';
import { AuthGuard } from './helpers/auth.guard';
import { LandingContainer } from './containers/landing/landing.component';
import { SignupContainer } from './containers/signup/signup.component';
import { NewitemComponent } from './containers/new-item/new-item.component';
import { NewItemFormComponent } from './components/new-item-form/new-item-form.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ProjectsContainer } from './containers/projects/projects.component';

const routes: Routes = [
  { path: '', component: HomeContainer, canActivate: [AuthGuard], data: { animation: '' } },
  { path: 'login', component: LandingContainer, data: { animation: 'login' } },
  { path: 'signup', component: SignupContainer, data: { animation: 'signup' } },
  { path: 'user',
    loadChildren: () => import('./containers/user/user.module').then(mod => mod.UserModule), data: { animation: 'user' }
  },
  { path: 'projects', component: ProjectsContainer, canActivate: [AuthGuard], data: { animation: 'projects' } },
  //{ path: 'items', component: NewitemComponent, canActivate: [AuthGuard], data: { animation: 'items' } },
  { path: 'projects/:id/:url', component: NewitemComponent, canActivate: [AuthGuard], data: { animation: 'projects/:id/:url' } },
  { path: 'projects/new-edit/:id/:url/:id', component: NewItemFormComponent, canActivate: [AuthGuard], data: { animation: 'projects/new-edit/:id/:url/:id' } },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard], data: { animation: 'settings' } },

  // otherwise redirect to home
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule { }

