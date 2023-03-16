import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-alert',
  templateUrl: 'alert.component.html',
  styleUrls: ['./alert.component.scss']
})

export class AlertComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  message: any;
  alertContainer: any;

  constructor(private alertService: AlertService) { }

  ngOnInit() {
    this.alertContainer = document.getElementById('alertMsg');
    this.subscription = this.alertService.getAlert()
      .subscribe(message => {
        switch (message && message.type) {
          case 'success':
            message.cssClass = 'alert alert-success';
            break;
          case 'error':
            message.cssClass = 'alert alert-danger';
            break;
        }

        this.message = message;
        this.alertContainer.classList.add('alert');

        setTimeout(() => {
          this.alertContainer.classList.remove('alert');
          setTimeout(() => {
            this.alertService.clear();
          }, 5000);
        }, 5000);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
