import {Component, Inject} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog',
  templateUrl: 'dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogTemplate {
  title='';
  body='';
  type='';
  user={};

  constructor(@Inject(MAT_DIALOG_DATA) public data: any){
    this.title = data.title;
    this.body = data.body;
    this.type = data.type;
    this.user = data.user;

  }
}
