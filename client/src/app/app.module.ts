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
import { MFService } from './services/MF.service';



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
import { NewitemComponent } from './containers/new-item/new-item.component';
import { MessengerContainer } from './containers/messenger/messenger.component';
import { SettingsComponent } from './components/settings/settings.component';
import { NewItemFormComponent } from './components/new-item-form/new-item-form.component';
import { ProjectsContainer } from './containers/projects/projects.component';
import { ArtistMembersFormComponent } from './components/new-item-form/new-item-types/artist-members/artist-members-form.component';
import { ArtistLinksFormComponent } from './components/new-item-form/new-item-types/artist-links/artist-links-form.component';
import { ArtistsFormComponent } from './components/new-item-form/new-item-types/artists/artists-form.component';
import { AlbumsFormComponent } from './components/new-item-form/new-item-types/albums/albums-form.component';
import { CommentsFormComponent } from './components/new-item-form/new-item-types/comments/comments-form.component';
import { ContactsFormComponent } from './components/new-item-form/new-item-types/contacts/contacts-form.component';
import { DocumentsFormComponent } from './components/new-item-form/new-item-types/documents/documents-form.component';
import { GigsFormComponent } from './components/new-item-form/new-item-types/gigs/gigs-form.component';
import { ImagesFormComponent } from './components/new-item-form/new-item-types/images/images-form.component';
import { LyricsFormComponent } from './components/new-item-form/new-item-types/lyrics/lyrics-form.component';
import { SocialsFormComponent } from './components/new-item-form/new-item-types/socials/socials-form.component';
import { SongsFormComponent } from './components/new-item-form/new-item-types/songs/songs-form.component';
import { VideosFormComponent } from './components/new-item-form/new-item-types/videos/videos-form.component';
import { ArtistFormComponent } from './components/new-item-form/new-item-types/artist/artist-form.component';
import { GalleriesFormComponent } from './components/new-item-form/new-item-types/galleries/galleries-form.component';
import { TasksFormComponent } from './components/new-item-form/new-item-types/tasks/tasks-form.component';
import { ScheduleFormComponent } from './components/new-item-form/new-item-types/schedule/schedule-form.component';
import { MerchFormComponent } from './components/new-item-form/new-item-types/merch/merch-form.component';
import { MerchCategoriesFormComponent } from './components/new-item-form/new-item-types/merch-categories/merch-categories-form.component';
import { CampaignsFormComponent } from './components/new-item-form/new-item-types/campaigns/campaigns-form.component';
import { UploadFileComponent } from './components/upload-single/upload-single.component';
import { UploadFilesComponent } from './components/upload-multi/upload-multi.component';
import { NewProjectUpdateComponent } from './components/new-project-update/new-project-update.component';
import { ArtistMembersUpdateComponent } from './components/new-item-form/new-item-types/artist-members/artist-members-update/artist-members-update.component';
import { UserCardComponent } from './components/user/user-card/user-card.component';
import { InviteComponent } from './components/user/invite/invite.component';
import { TagChipsComponent } from './components/tag-chips/tag-chips.component';
import { ContactUpdateComponent } from './components/new-item-form/new-item-types/contacts/contact-update/contact-update.component';
import { ArtistUpdateComponent } from './components/new-item-form/new-item-types/artist/artist-update/artist-update.component';
import { GalleriesUpdateComponent } from './components/new-item-form/new-item-types/galleries/galleries-update/galleries-update.component';
import { ImagesUpdateComponent } from './components/new-item-form/new-item-types/images/images-update/images-update.component';
import { VideosUpdateComponent } from './components/new-item-form/new-item-types/videos/videos-update/videos-update.component';

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
    NewitemComponent,
    NewItemFormComponent,
    ArtistFormComponent,
    ArtistsFormComponent,
    ArtistMembersFormComponent,
    ArtistLinksFormComponent,
    AlbumsFormComponent,
    CommentsFormComponent,
    ContactsFormComponent,
    DocumentsFormComponent,
    GigsFormComponent,
    ImagesFormComponent,
    LyricsFormComponent,
    SocialsFormComponent,
    SongsFormComponent,
    VideosFormComponent,
    MessengerContainer,
    SettingsComponent,
    ProjectsContainer,
    GalleriesFormComponent,
    TasksFormComponent,
    ScheduleFormComponent,
    MerchFormComponent,
    MerchCategoriesFormComponent,
    CampaignsFormComponent,
    UploadFileComponent,
    UploadFilesComponent,
    NewProjectUpdateComponent,
    ArtistMembersUpdateComponent,
    UserCardComponent,
    InviteComponent,
    TagChipsComponent,
    ArtistUpdateComponent,
    ContactUpdateComponent,
    GalleriesUpdateComponent,
    ImagesUpdateComponent,
    VideosUpdateComponent
  ],
  imports: [
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    UserModule,
    BrowserAnimationsModule,
    BrowserModule
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
    DialogService,
    MFService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
