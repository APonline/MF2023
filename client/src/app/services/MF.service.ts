import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class MFService {

  constructor(private http: HttpClient) { }

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

    return day = yyyy + '-' + mm + '-' + dd;
  }

}
