import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { tap } from 'rxjs/operators';

const baseUrl = environment.apiUrl + `artist-activitys`;

export type MemberActivityAction = 'create' | 'update' | 'delete';

@Injectable({
  providedIn: 'root'
})
export class ArtistActivityService {

  constructor(private http: HttpClient) { }

  private refresh$ = new Subject<void>();
  refreshChanges$ = this.refresh$.asObservable();   // the feed will listen to this

  kickRefresh() { this.refresh$.next(); }  

  logMemberChange(
      action: MemberActivityAction,
      topic: { type: string, item: string, link: string },
      ctx: {
          actor: { id: number; username: string };
          artistId: number | string;
          groupId?: number | string;
          activityUrl?: string;
          feature: {feature: string, extra: string};
      }
  ): Observable<any> {
      const verb =
          action === 'create' ? `created a new ${topic.type}` :
          action === 'update' ? `updated ${ctx.actor.username}` :
          `deleted ${ctx.actor.username}`;

      const activityHtml =
          `<b>${ctx.actor.username}</b> ${verb} <a href="${topic.link}"><b>${topic.item}</b></a>`;

      const payload = {
          owner_user: ctx.actor.id,
          owner_group: ctx.groupId ?? ctx.artistId,
          user_id: ctx.actor.id,
          artist_id: ctx.artistId,
          activity: activityHtml,
          activity_url: ctx.activityUrl ?? '',
          active: 1
      };

      console.log('activity',payload)

      return this.http.post(baseUrl, payload).pipe(
          tap(() => this.kickRefresh())
      );
  }
  

  getAll(id: any): Observable<any> {
    return this.http.get<any[]>(`${baseUrl}/artist/${id}`);
  }

  get(id: any): Observable<any> {
    return this.http.get<any[]>(`${baseUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(baseUrl, data);
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
