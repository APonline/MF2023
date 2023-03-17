import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { environment } from '../environments/environment';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// used to create fake backend
import { ErrorInterceptor } from './helpers/error.interceptor';
import { JwtInterceptor } from './helpers/jwt.interceptors';

// Apollo
import { getMainDefinition } from 'apollo-utilities';
import { WebSocketLink } from 'apollo-link-ws';
import { ApolloModule, Apollo } from 'apollo-angular';
import { HttpLink } from 'apollo-link-http';
import { ApolloLink, split, execute } from 'apollo-link';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { parse } from 'graphql';

// Services
import { AlertService } from './services/alert.service';
import { AuthenticationService } from './services/authentication.service';
import { UserService } from './services/user.service';

// Modules
import { UserModule } from './containers/user/user.module';

// Components
import { AppComponent } from './app.component';
import { HomeContainer } from './containers/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AlertComponent } from './components/alert/alert.component';
import { LandingContainer} from './containers/landing/landing.component';
import { MainNavComponent } from './components/navigation/mainNav/mainNav.component';
import { SignupContainer } from './containers/signup/signup.component';
import { SharedModule } from './shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SocketioService } from './services/socketio.service';


@NgModule({
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  declarations: [
    AppComponent,
    HomeContainer,
    LandingContainer,
    LoginComponent,
    SignupContainer,
    RegisterComponent,
    AlertComponent,
    MainNavComponent,
  ],
  imports: [
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    ApolloModule,
    UserModule,
    BrowserAnimationsModule,
    BrowserModule,
  ],
  providers: [
    SocketioService,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    AlertService,
    AuthenticationService,
    UserService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
