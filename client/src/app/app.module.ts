import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { environment } from '../environments/environment';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

// used to create fake backend
import { ErrorInterceptor } from './helpers/error.interceptor';
import { JwtInterceptor } from './helpers/jwt.interceptors';

// Services
import { AlertService } from './services/alert.service';
import { AuthenticationService } from './services/authentication.service';
import { UserService } from './services/user.service';
import { SocketioService } from './services/socketio.service';
import { FileUploadService } from './services/file-upload.service';
import { AlbumsService } from './services/albums.service';
import { ArtistsLinksService } from './services/artist_links.service';
import { ArtistMembersService } from './services/artist_members.service';
import { ArtistsService } from './services/artists.service';
import { CommentsService } from './services/comments.service';
import { ContactsService } from './services/contacts.service';
import { DocumentsService } from './services/documents.service';
import { FriendsService } from './services/friends.service';
import { ImagesService } from './services/images.service';
import { SocialsService } from './services/socials.service';
import { SongsService } from './services/songs.service';
import { VidoesService } from './services/videos.service';
import { GigsService } from './services/gigs.service';
import { DialogService } from './services/dialog.service';



// Modules
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UserModule } from './containers/user/user.module';
import { SharedModule } from './shared.module';


// Components
import { AppComponent } from './app.component';
import { HomeContainer } from './containers/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AlertComponent } from './components/alert/alert.component';
import { LandingContainer} from './containers/landing/landing.component';
import { MainNavComponent } from './components/navigation/mainNav/mainNav.component';
import { SignupContainer } from './containers/signup/signup.component';
import { UploadFilesComponent } from './components/upload-multi/upload-multi.component';
import { NewitemComponent } from './containers/new-item/new-item.component';
import { NewItemFormComponent } from './components/new-item-form/new-item-form.component';
import { MessengerContainer } from './containers/messenger/messenger.component';
import { SettingsComponent } from './components/settings/settings.component';

// export const PICK_FORMATS = {
//   parse: {dateInput: {month: 'short', year: 'numeric', day: 'numeric'}},
//   display: {
//       dateInput: 'input',
//       monthYearLabel: {year: 'numeric', month: 'short'},
//       dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
//       monthYearA11yLabel: {year: 'numeric', month: 'long'}
//   }
// };

// class PickDateAdapter extends NativeDateAdapter {
//   format(date: Date, displayFormat: Object): string {
//       if (displayFormat === 'input') {
//           return formatDate(date,'yyyy-MM-dd',this.locale);;
//       } else {
//           return date.toDateString();
//       }
//   }
// }

@NgModule({
  schemas: [ CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA ],
  declarations: [
    AppComponent,
    HomeContainer,
    LandingContainer,
    LoginComponent,
    SignupContainer,
    RegisterComponent,
    AlertComponent,
    MainNavComponent,
    UploadFilesComponent,
    NewitemComponent,
    NewItemFormComponent,
    MessengerContainer,
    SettingsComponent
  ],
  imports: [
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    UserModule,
    BrowserAnimationsModule,
    BrowserModule,
  ],
  providers: [
    SocketioService,
    //{provide: DateAdapter, useClass: PickDateAdapter},
    //{provide: MAT_DATE_FORMATS, useValue: PICK_FORMATS},
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    AlertService,
    AuthenticationService,
    UserService,
    FileUploadService,
    AlbumsService,
    ArtistsLinksService,
    ArtistMembersService,
    ArtistsService,
    CommentsService,
    ContactsService,
    DocumentsService,
    FriendsService,
    ImagesService,
    SocialsService,
    SongsService,
    VidoesService,
    GigsService,
    DialogService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
