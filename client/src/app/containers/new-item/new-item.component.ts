import { Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { ArtistsService } from 'src/app/services/artists.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-newItem',
  templateUrl: 'new-item.component.html',
  styleUrls: ['./new-item.component.scss']
 })
export class NewitemComponent implements OnInit {

  @ViewChildren('card') card!: QueryList<any>;
  group = null;
  groupId = null;
  artistInfo = [];
  artistInfoKeys = [];
  env= 'test';

    tools = [
      {name:'Artist', value:'artist'},
      {name:'Artist Members', value:'artist_members'},
      {name:'Albums', value:'albums'},
      {name:'Songs', value:'songs'},
      {name:'Lyrics', value:'lyrics'},
      {name:'Gigs', value:'gigs'},
      {name:'Tasks', value:'tasks'},
      {name:'Schedule', value:'schedule'},
      {name:'Documents', value:'documents'},
      {name:'Artist Links', value:'artist_links'},
      {name:'Socials', value:'socials'},
      {name:'Campaigns', value:'campaigns'},
      {name:'Comments', value:'comments'},
      {name:'Merch Categories', value:'merch_categories'},
      {name:'Merch', value:'merch'},
      {name:'Contacts', value:'contacts'},
      // {name:'Friends', value:'friends'},
      {name:'Galleries', value:'galleries'},
      {name:'Images', value:'images'},
      {name:'Videos', value:'videos'},
    ]

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private artistsService: ArtistsService,
        private uploadService: FileUploadService,
    ) {
    }

    async ngOnInit() {
      this.env = environment.apiUrl;
      this.groupId = window.location.href.split('/')[4];
      this.group = window.location.href.split('/')[5].replace(/_/g," ").replace(/@/g,"");

      this.artistsService.get(this.groupId).subscribe(res => {
        let obj = {};
        Object.keys(res).map(r => {
          if (r != 'createdAt' && r != 'updatedAt' && r != 'active'
          && r != 'id' && r != 'owner_user' && r != 'profile_image'
          && r != 'profile_banner_image' && r != 'artist_image_1' && r != 'artist_image_2' && r != 'artist_image_3') {
            obj[r] = res[r];
            this.artistInfoKeys.push(r);
          }
        });

        //profile image
        if(res.profile_image != 'default' && res.profile_image != ''){
          let group = res.name.replace(/\s+/g, '-').toLowerCase();
           this.uploadService.getFile(0, res.profile_image, group, 'png').subscribe(r => {
            obj['profile_image'] = r[0].display;
          });
        }else{
          obj['profile_image'] = './assets/images/intrologo.png';
        }
        this.artistInfoKeys.push('profile_image');

        //profile banner
        if(res.profile_banner_image != 'default' && res.profile_banner_image != ''){
          let group = res.name.replace(/\s+/g, '-').toLowerCase();
           this.uploadService.getFile(0, res.profile_banner_image, group, 'png').subscribe(r => {
            obj['profile_banner_image'] = r[0].display;
          });
        }else{
          obj['profile_banner_image'] = './assets/images/intrologo.png';
        }
        this.artistInfoKeys.push('profile_banner_image');

        //profile images
        for(let i=1; i<4; i++){
          if(res['artist_image_'+i] != 'default' && res['artist_image_'+i] != ''){
            let group = res.name.replace(/\s+/g, '-').toLowerCase();
             this.uploadService.getFile(0, res['artist_image_'+i], group, 'png').subscribe(r => {
              obj['artist_image_'+i] = r[0].display;
            });
          }else{
            obj['artist_image_'+i] = './assets/images/intrologo.png';
          }
          this.artistInfoKeys.push('artist_image_'+i);
        }

        this.artistInfo.push(obj);
      });
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
