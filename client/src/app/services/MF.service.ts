import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import moment from 'moment';

//serivces
//MF
import { ViewModeService, ViewMode } from 'src/app/services/view-mode.service';

//Features
import { ArtistsService } from 'src/app/services/artists.service';
import { ArtistMembersService } from 'src/app/services/artist_members.service';
import { AlbumsService } from 'src/app/services/albums.service';
import { SongsService } from 'src/app/services/songs.service';
import { LyricsService } from 'src/app/services/lyrics.service';
import { DocumentsService } from 'src/app/services/documents.service';
import { ArtistsLinksService } from 'src/app/services/artist_links.service';
import { SocialsService } from 'src/app/services/socials.service';
import { CommentsService } from 'src/app/services/comments.service';
import { ContactsService } from 'src/app/services/contacts.service';
import { GalleriesService } from 'src/app/services/galleries.service';
import { ImagesService } from 'src/app/services/images.service';
import { VidoesService } from 'src/app/services/videos.service';

//components
import { MediaplayerComponent } from '../components/mediaplayer/mediaplayer.component';
import { ComponentType } from '@angular/cdk/portal';

export interface MFLoadOpts {
    scope: 'one' | 'all' | 'allForArtist';
    id?: number | string;               // for scope='one'
    artistId?: number | string;         // for scope='allForArtist'
    modelIdForTemplate?: number;        // defaults to 1 (your “model row”)
}

export interface MFLoadResult {
    rows: any[];            // list view data (after transform)
    first?: any;            // first row (detail pages)
    modelSet?: any;         // row with id===modelIdForTemplate
}

export interface MFFormBuildOptions {
    exclude?: string[];                         // keys to drop (e.g., createdAt, updatedAt, active)
    includeAction?: boolean;                    // add 'action' column
    pinnedOrder?: string[];                     // force these first, in this order (if present)
    modelKeys?: string[];                       // fallback keys when dataset is empty
    mutateRows?: boolean;                       // true = delete excluded keys IN-PLACE on rows
    validators?: Record<string, any[]>;         // optional validators map per key
}

export interface MFFormBuildResult {
    displayedColumns: string[];
    formGroup: FormGroup;
    newRecord: Record<string, any>;
    rows: any[];                                // cleaned rows (same reference if mutateRows = true)
}

@Injectable({
  providedIn: 'root'
})
export class MFService {
  public viewMode$ = this.viewModeSvc.mode$;
  private svcByTool: Record<string, any>;

  private hasMethod(obj: any, name: string): boolean {
    return !!obj && typeof obj[name] === 'function';
  }

  /** Open a dialog and return its afterClosed() as an observable (typed). */
  openUpdateDialog<TData, TResult>(
    component: ComponentType<any>,
    data: TData,
    config: MatDialogConfig = {}
  ): Observable<TResult | undefined> {
    const dialogRef = this.dialog.open(component, {
      panelClass: 'dialog-box',
      width: '85%',
      height: '80vh',
      data,
      ...config
    });
    return dialogRef.afterClosed() as Observable<TResult | undefined>;
  }

  /** Deep-ish clone for plain data objects (good enough for your use here). */
  clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj ?? {}));
  }

  /**
   * Patch target with keys from src. If `omit` provided, skip those keys.
   * Returns the same target (mutates).
   */
  patchFrom<T extends object>(
    target: T,
    src: Partial<T> | undefined,
    omit: (keyof T)[] = []
  ): T {
    if (!target || !src) return target;
    for (const k of Object.keys(src) as (keyof T)[]) {
      if (omit.includes(k)) continue;
      (target as any)[k] = (src as any)[k];
    }
    return target;
  }

  /**
   * Small helper to compose objects fluently.
   *   MF.compose(base).with({a:1}).with({b:2}).done()
   */
  compose<T extends object>(base: T) {
    let out = this.clone(base);
    return {
      with<U extends object>(extra: U) { out = Object.assign(out, extra); return this; },
      done(): T & typeof out { return out as any; }
    };
  }

  constructor(
    private http: HttpClient,
    public dialog: MatDialog,
    private viewModeSvc: ViewModeService,
    private artistsService: ArtistsService,
    private artistMembersService: ArtistMembersService,
    private albumsService: AlbumsService,
    private songsService: SongsService,
    private lyricsService: LyricsService,
    private documentsService: DocumentsService,
    private artistLinksService: ArtistsLinksService,
    private socialsService: SocialsService,
    private commentsService: CommentsService,
    private contactsService: ContactsService,
    private galleriesService: GalleriesService,
    private imagesService: ImagesService,
    private videosService: VidoesService,
  ) { 
    this.svcByTool = {
      artist: this.artistsService,
      artist_members: this.artistMembersService,
      albums: this.albumsService,
      songs: this.songsService,
      lyrics: this.lyricsService,
      documents: this.documentsService,
      artist_links: this.artistLinksService,
      socials: this.socialsService,
      comments: this.commentsService,
      contacts: this.contactsService,
      galleries: this.galleriesService,
      images: this.imagesService,
      videos: this.videosService,
    };
  }

  /* LAYOUT HELPERS */
  //view style
  toggleViewMode(): void {
    this.viewModeSvc.toggle();
  }
  setViewMode(mode: ViewMode): void {
    this.viewModeSvc.set(mode);
  }
  getViewModeValue(): ViewMode {
    return this.viewModeSvc.value;
  }

  //Section Background
  buildImageKey(name: string | null | undefined): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (!parts.length) return '';

    const capFirst = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const rest = parts.slice(1).map(w => w.toLowerCase());

    return [capFirst, ...rest].join('_'); // "Artist_members"
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

  buildDialogCtx(params: {
    action: string;
    toolName: string;
    artist?: any;      // your current artist object
    currentUser?: any; // current user
    seed?: any;        // base object to start from
  }) {
    const { action, toolName, artist, currentUser, seed } = params;
    return this.compose(seed ?? {})
      .with({ action, tool: toolName })
      .with(artist ? {
        owner_user: artist.owner_user,
        artist_id: artist.id,
        groupId: artist.id,
        groupName: artist.name,
        profile_url: artist.profile_url,
        group: artist.name,
      } : {})
        .with(currentUser ? { current_user_id: currentUser.id } : {})
        .done();
  }
  /* LAYOUT HELPERS */

  /* FORMAT HELPERS */
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
  /* FORMAT HELPERS */

  /* SERVICE & DATA HELPERS */
  getService(tool: string): any {
    const key = (tool || '').toLowerCase();
    const svc = this.svcByTool[key];
    if (!svc) {
        throw new Error(`MF.getService: unknown tool "${tool}"`);
    }
    return svc;
  }

  buildEmptyFromModel(model: any, exclude: string[] = ['createdAt', 'updatedAt', 'active']): Record<string, any> {
    const out: Record<string, any> = {};
    if (!model) return out;
    Object.keys(model).forEach(k => {
        if (!exclude.includes(k)) out[k] = '';
    });
    return out;
  }

  buildTableScaffold(rows: any[], fields: string[]) {
    const displayedColumns = ['action', ...fields];
    const formObj: any = {};
    const newRecord: any = {};
    for (const f of fields) {
        formObj[f] = new FormControl('');
        newRecord[f] = '';
    }
    return {
        displayedColumns,
        adminForm: new FormGroup(formObj),
        newRecord,
        dataSource: new MatTableDataSource(rows).data
    };
  }

  load(tool: string, opts: MFLoadOpts): Observable<MFLoadResult> {
    const svc = this.getService(tool);
    const modelId = opts.modelIdForTemplate ?? 1;

    let src$: Observable<any | any[]>;

    switch (opts.scope) {
        case 'one':
            if (!opts.id) throw new Error('MF.load: id is required for scope="one"');
            src$ = svc.get(opts.id);
            return src$.pipe(map((row: any) => ({
                rows: [row],
                first: row,
                modelSet: row?.id === modelId ? row : undefined,
            })));

        case 'allForArtist': {
            // Prefer service.getAllForArtist; else fallback to getAll + filter
            if (this.hasMethod(svc, 'getAllForArtist')) {
                src$ = svc.getAllForArtist(opts.artistId);
            } else if (this.hasMethod(svc, 'getAll')) {
                src$ = svc.getAll().pipe(
                    map((rows: any[]) =>
                        rows.filter(r => String(r.artist_id) === String(opts.artistId)))
                );
            } else {
                return of({ rows: [], first: undefined, modelSet: undefined });
            }
            break;
        }

        default: // 'all'
            if (!this.hasMethod(svc, 'getAll')) {
                return of({ rows: [], first: undefined, modelSet: undefined });
            }
            src$ = svc.getAll();
            break;
    }

    return src$.pipe(
        map((rows: any[]) => {
            const transformed = this.transformRows(tool, rows || []);
            const modelSet = transformed.find(r => r?.id === modelId);
            return {
                rows: transformed,
                first: transformed[0],
                modelSet,
            };
        })
    );
  }

  fetchAll(tool: string): Observable<any[]> {
    return this.getService(tool).getAll();
  }
  fetchAllForArtist(tool: string, artistId: string | number): Observable<any[]> {
    return this.getService(tool).getAllForArtist(artistId);
  }
  fetchOne(tool: string, id: string | number): Observable<any> {
    return this.getService(tool).get(id);
  }

  transformRows(tool: string, rows: any[]): any[] {
    switch ((tool || '').toLowerCase()) {
      case 'artist_members':
        return rows.map(r => ({
            id: r.id,
            user_id: r.user_id,
            profile_image: r.members?.profile_image,
            username: r.members?.username,
            name: `${r.members?.first_name ?? ''} ${r.members?.last_name ?? ''}`.trim(),
            role: r.role,
            email: r.members?.email,
            phone: r.members?.phone,
            date_joined: r.date_joined,
            profile_url: r.members?.profile_url,
        }));
      default:
        return rows;
    }
  }

  //SetSetings
  buildFromData(data: any[], opts: MFFormBuildOptions = {}): MFFormBuildResult {
    const {
        exclude = ["active", "createdAt", "updatedAt"],
        includeAction = true,
        pinnedOrder = [],
        modelKeys = [],
        mutateRows = true,
        validators = {}
    } = opts;

    const excludeSet = new Set(exclude);

    // 1) Choose a dataset to infer keys from
    const rows = Array.isArray(data) ? data : [];
    const sample = rows[0] || null;

    // 2) Get candidate keys (prefer union from rows; else fall back to modelKeys)
    const candidateKeys = this.getAllKeys(rows, excludeSet);
    const baseKeys = candidateKeys.length ? candidateKeys : modelKeys.filter(k => !excludeSet.has(k));

    // 3) Order: pinned -> keep sample order -> remaining
    const orderedKeys = this.orderKeys(baseKeys, pinnedOrder, sample, excludeSet);

    // 4) Columns (with optional 'action')
    const displayedColumns: string[] = [];
    if (includeAction && !displayedColumns.includes("action")) {
        displayedColumns.push("action");
    }
    displayedColumns.push(...orderedKeys);

    // 5) Form + new record
    const formControls: Record<string, FormControl> = {};
    const newRecord: Record<string, any> = {};
    for (const k of orderedKeys) {
        const v = validators[k] || []; // array of validators if provided
        formControls[k] = new FormControl("", v);
        newRecord[k] = "";
    }
    const formGroup = new FormGroup(formControls);

    // 6) Clean rows (remove excluded)
    const outputRows = mutateRows ? rows : rows.map(r => ({ ...r }));
    for (const r of outputRows) {
        if (!r || typeof r !== "object") continue;
        for (const key of excludeSet) delete r[key];
    }

    return {
        displayedColumns,
        formGroup,
        newRecord,
        rows: outputRows
    };
  }

  private getAllKeys(rows: any[], exclude: Set<string>): string[] {
    const seen = new Set<string>();
    for (const r of rows) {
        if (!r || typeof r !== "object") continue;
        for (const k of Object.keys(r)) {
            if (!exclude.has(k)) seen.add(k);
        }
    }
    return Array.from(seen);
  }

  private orderKeys(allKeys: string[], pinned: string[], sample: any, exclude: Set<string>): string[] {
    const ordered: string[] = [];

    // pinned first (if present)
    for (const k of pinned) {
        if (allKeys.includes(k) && !ordered.includes(k) && !exclude.has(k)) {
            ordered.push(k);
        }
    }

    // then sample key order (if any)
    if (sample && typeof sample === "object") {
        for (const k of Object.keys(sample)) {
            if (!exclude.has(k) && allKeys.includes(k) && !ordered.includes(k)) {
                ordered.push(k);
            }
        }
    }

    // then any remaining
    for (const k of allKeys) {
        if (!ordered.includes(k) && !exclude.has(k)) {
            ordered.push(k);
        }
    }

    return ordered;
  }
  /* SERVICE & DATA HELPERS */

}
