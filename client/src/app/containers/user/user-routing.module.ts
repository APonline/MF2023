import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PasswordResetComponent } from 'src/app/components/user/passwordReset/passwordReset.component';
import { ProfileComponent } from 'src/app/components/user/profile/profile.component';
import { VerifyComponent } from 'src/app/components/user/verify/verify.component';

import { AuthGuard } from '../../helpers/auth.guard';
import { UserContainer } from './user.component';


const routes: Routes = [
  { path: '', component: UserContainer,
    children : [
      { path: 'verify', component: VerifyComponent },
      { path: 'passwordReset', component: PasswordResetComponent, data: { animation: 'user/passwordReset', layer: 1 }  },
      { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], data: { animation: 'user/profile', layer: 1 }  },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }

