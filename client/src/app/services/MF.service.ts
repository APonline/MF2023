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

}
