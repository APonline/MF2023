import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { UserRoutingModule } from "./user-routing.module";

import { UserContainer } from './user.component';
import { SharedModule } from "src/app/shared.module";
import { ProfileComponent } from "src/app/components/user/profile/profile.component";
import { PasswordResetComponent } from "src/app/components/user/passwordReset/passwordReset.component";
import { VerifyComponent } from "src/app/components/user/verify/verify.component";
import { ImageUpdateComponent } from "src/app/components/user/image-update/image-update.component";
import { AngularCropperjsModule } from "angular-cropperjs";

@NgModule({
  declarations: [
    UserContainer,
    ProfileComponent,
    PasswordResetComponent,
    VerifyComponent,
    ImageUpdateComponent
  ],
  imports: [
    UserRoutingModule,
    SharedModule,
    AngularCropperjsModule
    //ImageCropperModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserModule {}
