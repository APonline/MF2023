import {MatDialog} from '@angular/material/dialog';
import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import * as DialogModule from '../components/dialog/dialog.module';
import { DialogTemplate } from '../components/dialog/templates/dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(public dialog: MatDialog) {}

  openDialog(dialogTemplate, dialogType) {
    const box = {
      title: dialogType.title,
      body: dialogType.body,
      type: dialogType.type,
      user: dialogType.user
    }
    const dialogRef = this.dialog.open(DialogTemplate, {
      data: box
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}


