import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';

import moment from 'moment';
import { MediaplayerComponent } from '../components/mediaplayer/mediaplayer.component';

@Injectable({
  providedIn: 'root'
})
export class MFService {

  constructor(
    private http: HttpClient,
    public dialog: MatDialog,
  ) { }

  capitalizeWords(arr) {
    return arr.map((word) => {
      const capitalizedFirst = word.charAt(0).toUpperCase();
      const rest = word.slice(1).toLowerCase();
      return capitalizedFirst + rest;
    });
  }

  dateAdjust(date) {
    return moment(date).format("YYYY-MM-DD");
  }

  getDate() {
    let today = new Date();
    let day = '';
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = 0 + dd;
    if (mm < 10) mm = 0 + mm;

    return day = yyyy + '-' + ('0' + mm).toString().slice(-2) + '-' + ('0' + dd).toString().slice(-2);
  }

  openMediaPlayer(obj) {
    obj.tool = 'media';
    const dialogRef = this.dialog.open(MediaplayerComponent, {
      panelClass: 'dialog-box',
      width: '85%',
      height: '80vh',
      data:obj
    });

    dialogRef.afterClosed().subscribe(async result => {
      if(result){
      }
    });
  }

}
