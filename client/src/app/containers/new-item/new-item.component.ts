import { Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';


@Component({
  selector: 'app-newItem',
  templateUrl: 'new-item.component.html',
  styleUrls: ['./new-item.component.scss']
 })
export class NewitemComponent implements OnInit {

  @ViewChildren('card') card!: QueryList<any>;

    tools = [
      {name:'Artists', value:'artists'},
      {name:'Artist Members', value:'artist_members'},
      {name:'Artist Links', value:'artist_links'},
      {name:'Albums', value:'albums'},
      {name:'Songs', value:'songs'},
      {name:'Comments', value:'comments'},
      {name:'Contacts', value:'contacts'},
      {name:'Documents', value:'documents'},
      // {name:'Friends', value:'friends'},
      {name:'Gigs', value:'gigs'},
      {name:'Images', value:'images'},
      {name:'Socials', value:'socials'},
      {name:'Videos', value:'videos'},
    ]

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
    ) {
    }

    ngOnInit() {

    }

    cardShine(e) {
      for(const card of this.card){
        const rect = card.nativeElement.getBoundingClientRect(),
        x = e.clientX - rect.left,
        y = e.clientY - rect.top;

        card.nativeElement.style.setProperty("--mouse-x", `${x}px`);
        card.nativeElement.style.setProperty("--mouse-y", `${y}px`);
      }
    }

}
