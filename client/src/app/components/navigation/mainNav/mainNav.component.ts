import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../services/authentication.service';
import { user } from 'src/app/models/users.model';
import { filter, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MFService } from 'src/app/services/MF.service';

@Component({
  selector: 'app-mainNav',
  templateUrl: './mainNav.component.html',
  styleUrls: ['./mainNav.component.scss']
 })
export class MainNavComponent implements OnInit {
    currentUser: any;
    toggle:boolean = true;

    inProject: boolean = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        public MF: MFService,
        private authenticationService: AuthenticationService,
    ) {
        this.currentUser = this.authenticationService.currentUserValue || false;
    }

    ngOnInit() {
      // Set once and on every navigation
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd),
            map(() => this.router.url),
            startWith(this.router.url)
        ).subscribe(url => {
            // show only on project pages (adjust if your project routes differ)
            this.inProject = url.startsWith('/projects');
        });
    }

    change(){
      this.toggle = !this.toggle;
    }

    logout() {
      this.currentUser = undefined;
      this.toggle = false;
      this.authenticationService.logout();
    }
}
