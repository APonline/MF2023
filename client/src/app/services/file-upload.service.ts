import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const baseUrl = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  private baseUrl = `${baseUrl}`;

  constructor(private http: HttpClient) { }

  upload(file: File): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();

    formData.append('file', file);

    const req = new HttpRequest('POST', `${this.baseUrl}upload`, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request(req);
  }

  downloadFile(id: any, name: any): Observable<any> {
    return this.http.get(`${this.baseUrl}files/${name}`);
  }

  getFiles(): Observable<any> {
    return this.http.get(`${this.baseUrl}files`);
  }
}
