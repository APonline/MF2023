import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FileUploadService } from './file-upload.service';
import {cloneDeep} from 'lodash';

const baseUrl = environment.apiUrl + `artist-members`;
const signup = environment.apiUrl + 'auth/signup';

@Injectable({
  providedIn: 'root'
})
export class ArtistMembersService {
  public projects$: Subject<any> = new Subject();

  constructor(private http: HttpClient, private uploadService: FileUploadService,) { }

  getAll(): Observable<any> {
    return this.http.get<any[]>(baseUrl);
  }

  getAllForArtist(id: any): Observable<any> {
    return this.http.get<any[]>(`${baseUrl}/artist/${id}`);
  }

  getAllForUser(id: any): Observable<any> {
    let project =  this.http.get<any[]>(`${baseUrl}/user/${id}`);

    project.subscribe(r => {
      console.log('YO: ',r);
      r.map(res => {
        if(res.artists.profile_image != 'default' && res.artists.profile_image != ''){
          let group = res.artists.name.replace(/\s+/g, '-').toLowerCase();
           this.uploadService.getFile(0, res.artists.profile_image, group, 'png').subscribe(r => {
            res['display'] = r[0];
          });
        }else{
          res['display'] = { display: './assets/images/intrologo.png', name: 'default', type: 'png', url: './assets/images/intrologo.png' };
        }

        this.projects$.next(res);
      })

    });

    return project;
  }

  getProjects() {
    return this.projects$.next();
  }

  get(id: any): Observable<any> {
    return this.http.get(`${baseUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    let project = this.http.post(baseUrl, data);

    // project.subscribe(r=>{
    //   console.log(r);
    //   this.projects$.next(r);
    // })
    // this.projects$.next(project);
    // this.getAllForUser(data.user_id);

    return project;
  }

  update(id: any, data: any): Observable<any> {
    return this.http.put(`${baseUrl}/${id}`, data);
  }

  delete(id: any): Observable<any> {
    return this.http.delete(`${baseUrl}/${id}`);
  }

  deleteAll(): Observable<any> {
    return this.http.delete(baseUrl);
  }

  // findByUsername(username: any): Observable<User[]> {
  //   return this.http.get<User[]>(`${baseUrl}?username=${username}`);
  // }

}
