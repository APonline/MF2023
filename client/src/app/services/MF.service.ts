import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import moment from 'moment';

// MF infra
import { ViewModeService, ViewMode } from 'src/app/services/view-mode.service';
import { ArtistActivityService } from 'src/app/services/artist_activity.service';

// Feature services
import { ArtistsService } from 'src/app/services/artists.service';
import { ArtistMembersService } from 'src/app/services/artist_members.service';
import { AlbumsService } from 'src/app/services/albums.service';
import { SongsService } from 'src/app/services/songs.service';
import { LyricsService } from 'src/app/services/lyrics.service';
import { TasksService } from 'src/app/services/tasks.service';
import { DocumentsService } from 'src/app/services/documents.service';
import { ArtistsLinksService } from 'src/app/services/artist_links.service';
import { SocialsService } from 'src/app/services/socials.service';
import { CommentsService } from 'src/app/services/comments.service';
import { ContactsService } from 'src/app/services/contacts.service';
import { GalleriesService } from 'src/app/services/galleries.service';
import { LibraryService } from 'src/app/services/library.service';
import { PlannerService } from 'src/app/services/planner.service';

// MF Components
import { MediaplayerComponent } from '../components/mediaplayer/mediaplayer.component';

/* ----------------------------- Types & interfaces ----------------------------- */

export interface MFLoadOpts {
    scope: 'one' | 'all' | 'allForArtist';
    id?: number | string;                 // when scope='one'
    artistId?: number | string;           // when scope='allForArtist'
    modelIdForTemplate?: number;          // default 1 (your canonical “model row”)
}

export interface MFLoadResult {
    rows: any[];                          // list view rows (after transformRows)
    first?: any;                          // convenience first row
    modelSet?: any;                       // row with id===modelIdForTemplate
}

export interface MFFormBuildOptions {
    exclude?: string[];                   // keys to drop from table/form
    includeAction?: boolean;              // include 'action' column
    pinnedOrder?: string[];               // put these columns first, if present
    modelKeys?: string[];                 // fallback when dataset is empty
    mutateRows?: boolean;                 // delete excluded keys IN-PLACE on rows
    validators?: Record<string, any[]>;   // optional validators map
}

export interface MFFormBuildResult {
    displayedColumns: string[];
    formGroup: FormGroup;
    newRecord: Record<string, any>;
    rows: any[];                          // possibly mutated in-place
}

export type TableAct = 'create' | 'put' | 'delete';

export interface MutateOpts<T = any> {
    idKey?: string;                       // defaults to 'id'
    stripKeys?: string[];                 // defaults to ['createdAt','updatedAt','active']
    updateKeys?: string[];                // for PUT: restrict fields to update
    beforeApply?: (payload: T) => T;      // sync pre-transform
    enrichCreate$?: (payload: T) => Observable<T>; // async enrichment for CREATE
    afterApply?: (ctx: { action: TableAct; row: T; rows: T[] }) => void; // side-effects
}

/* --------------------------------- Service ---------------------------------- */

@Injectable({ providedIn: 'root' })
export class MFService {
    /* ===== View-mode piping (so templates can bind MF.viewMode$) ===== */
    public viewMode$ = this.viewModeSvc.mode$;

    /* map of feature tool -> service */
    private svcByTool: Record<string, any>;

    constructor(
        private http: HttpClient,
        public dialog: MatDialog,
        private viewModeSvc: ViewModeService,
        private artistActivityService: ArtistActivityService,
        private artistsService: ArtistsService,
        private artistMembersService: ArtistMembersService,
        private albumsService: AlbumsService,
        private songsService: SongsService,
        private lyricsService: LyricsService,
        private tasksService: TasksService,
        private documentsService: DocumentsService,
        private artistLinksService: ArtistsLinksService,
        private socialsService: SocialsService,
        private commentsService: CommentsService,
        private contactsService: ContactsService,
        private galleriesService: GalleriesService,
        private libraryService: LibraryService,
        private plannerService: PlannerService
    ) {
        this.svcByTool = {
            artist: this.artistsService,
            artist_members: this.artistMembersService,
            albums: this.albumsService,
            songs: this.songsService,
            lyrics: this.lyricsService,
            tasks: this.tasksService,
            documents: this.documentsService,
            artist_links: this.artistLinksService,
            socials: this.socialsService,
            comments: this.commentsService,
            contacts: this.contactsService,
            galleries: this.galleriesService,
            planner: this.plannerService,
            library: this.libraryService,
        };
    }

    /* =============================== LAYOUT =============================== */

    // Toggle / set / read the global view mode
    toggleViewMode(): void { this.viewModeSvc.toggle(); }
    setViewMode(mode: ViewMode): void { this.viewModeSvc.set(mode); }
    getViewModeValue(): ViewMode { return this.viewModeSvc.value; }

    // Build background image key:
    // Capitalize first word; force subsequent words to lowercase.
    // "Artist Members" -> "Artist_members"
    buildImageKey(name: string | null | undefined): string {
        if (!name) return '';
        const parts = name.trim().split(/\s+/);
        if (!parts.length) return '';
        const first = parts[0];
        const capFirst = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
        const rest = parts.slice(1).map(w => w.toLowerCase());
        return [capFirst, ...rest].join('_');
    }

    // Media player open helper
    openMediaPlayer(data: any) {
        const dialogRef = this.dialog.open(MediaplayerComponent, {
            panelClass: 'dialog-box',
            // width: '85%',
            // height: '80vh',
            data: { ...data, tool: 'media' }
        });
        dialogRef.afterClosed().subscribe(() => {});
    }

    // Build a common dialog payload context
    buildDialogCtx(params: {
        action: string;
        toolName: string;
        artist?: any;
        currentUser?: any;
        seed?: any;
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

    /* ============================= FORMATTERS ============================= */

    capitalizeWords(arr: string[]): string[] {
        return arr.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    }

    dateAdjust(date: any) { return moment(date).format('YYYY-MM-DD'); }

    getDate(): string {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = (`0${d.getMonth() + 1}`).slice(-2);
        const dd = (`0${d.getDate()}`).slice(-2);
        return `${yyyy}-${mm}-${dd}`;
    }

    /* ========================== DIALOG UTILITIES ========================== */

    /** Open an update dialog and return `afterClosed()` as typed observable. */
    openUpdateDialog<TData, TResult>(
        component: ComponentType<any>,
        data: TData,
        config: MatDialogConfig = {}
    ): Observable<TResult | undefined> {
        const dialogRef = this.dialog.open(component, {
            panelClass: 'dialog-box',
            // width: '85%',
            height: '80vh',
            data,
            ...config
        });
        return dialogRef.afterClosed() as Observable<TResult | undefined>;
    }

    /** JSON clone that’s good enough for plain data DTOs. */
    clone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj ?? {}));
    }

    /** Small fluent composer: `MF.compose(base).with(x).with(y).done()` */
    compose<T extends object>(base: T) {
        let out = this.clone(base);
        return {
            with<U extends object>(extra: U) { out = Object.assign(out, extra); return this; },
            done(): T & typeof out { return out as any; }
        };
    }

    /* ========================== DATA ACCESS LAYER ========================= */

    private hasMethod(obj: any, name: string): boolean {
        return !!obj && typeof obj[name] === 'function';
    }

    getService(tool: string): any {
        const svc = this.svcByTool[(tool || '').toLowerCase()];
        if (!svc) throw new Error(`MF.getService: unknown tool "${tool}"`);
        return svc;
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

            case 'allForArtist':
                if (this.hasMethod(svc, 'getAllForArtist')) {
                    src$ = svc.getAllForArtist(opts.artistId);
                } else if (this.hasMethod(svc, 'getAll')) {
                    src$ = svc.getAll().pipe(
                        map((rows: any[]) => rows.filter(r => String(r.artist_id) === String(opts.artistId)))
                    );
                } else {
                    return of({ rows: [], first: undefined, modelSet: undefined });
                }
                break;

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
                return { rows: transformed, first: transformed[0], modelSet };
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

    /** Per-tool normalization for list rows */
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

    /* ======================== TABLE/FORM SCAFFOLDING ======================= */

    buildEmptyFromModel(model: any, exclude: string[] = ['createdAt', 'updatedAt', 'active']): Record<string, any> {
        const out: Record<string, any> = {};
        if (!model) return out;
        Object.keys(model).forEach(k => { if (!exclude.includes(k)) out[k] = ''; });
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

    buildFromData(data: any[], opts: MFFormBuildOptions = {}): MFFormBuildResult {
        const {
            exclude = ['active', 'createdAt', 'updatedAt'],
            includeAction = true,
            pinnedOrder = [],
            modelKeys = [],
            mutateRows = true,
            validators = {}
        } = opts;

        const excludeSet = new Set(exclude);
        const rows = Array.isArray(data) ? data : [];
        const sample = rows[0] || null;

        const candidateKeys = this.getAllKeys(rows, excludeSet);
        const baseKeys = candidateKeys.length ? candidateKeys : modelKeys.filter(k => !excludeSet.has(k));

        const orderedKeys = this.orderKeys(baseKeys, pinnedOrder, sample, excludeSet);

        const displayedColumns: string[] = [];
        if (includeAction) displayedColumns.push('action');
        displayedColumns.push(...orderedKeys);

        const formControls: Record<string, FormControl> = {};
        const newRecord: Record<string, any> = {};
        for (const k of orderedKeys) {
            formControls[k] = new FormControl('', validators[k] || []);
            newRecord[k] = '';
        }
        const formGroup = new FormGroup(formControls);

        const outputRows = mutateRows ? rows : rows.map(r => ({ ...r }));
        for (const r of outputRows) {
            if (!r || typeof r !== 'object') continue;
            for (const key of excludeSet) delete r[key];
        }

        return { displayedColumns, formGroup, newRecord, rows: outputRows };
    }

    private getAllKeys(rows: any[], exclude: Set<string>): string[] {
        const seen = new Set<string>();
        for (const r of rows) {
            if (!r || typeof r !== 'object') continue;
            for (const k of Object.keys(r)) if (!exclude.has(k)) seen.add(k);
        }
        return Array.from(seen);
    }

    private orderKeys(allKeys: string[], pinned: string[], sample: any, exclude: Set<string>): string[] {
        const ordered: string[] = [];

        // 1) pinned first
        for (const k of pinned) {
            if (allKeys.includes(k) && !exclude.has(k) && !ordered.includes(k)) ordered.push(k);
        }
        // 2) sample key order
        if (sample && typeof sample === 'object') {
            for (const k of Object.keys(sample)) {
                if (!exclude.has(k) && allKeys.includes(k) && !ordered.includes(k)) ordered.push(k);
            }
        }
        // 3) remaining keys
        for (const k of allKeys) if (!ordered.includes(k) && !exclude.has(k)) ordered.push(k);

        return ordered;
    }

    /* ============================ ROW MUTATIONS ============================ */

    /** Strip fields from an object */
    private strip<T extends Record<string, any>>(obj: T, keys: string[] = []): T {
        if (!obj) return obj;
        const out: any = { ...obj };
        for (const k of keys) delete out[k];
        return out as T;
    }

    /** Pure, synchronous mutate (create/put/delete). */
    mutateRows<T = any>(rows: T[], action: TableAct, payload: T | any, opts: MutateOpts<T> = {}): T[] {
        const idKey = opts.idKey ?? 'id';
        const stripKeys = opts.stripKeys ?? ['createdAt', 'updatedAt', 'active'];

        const apply = (p: T): T[] => {
            const cleaned = this.strip(opts.beforeApply ? opts.beforeApply(p) : p, stripKeys);
            const id = (cleaned as any)?.[idKey];

            if (action === 'create') return [...rows, cleaned as T];

            if (action === 'put') {
                const keys = opts.updateKeys ?? Object.keys(cleaned as any);
                return rows.map((r: any) => {
                    if (r?.[idKey] !== id) return r;
                    const next = { ...r };
                    for (const k of keys) next[k] = (cleaned as any)[k];
                    return next as T;
                });
            }

            if (action === 'delete') {
                const deleteId = (typeof payload === 'object') ? (payload as any)[idKey] : payload;
                return rows.filter((r: any) => r?.[idKey] !== deleteId);
            }

            return rows;
        };

        if (!opts.enrichCreate$ || action !== 'create') {
            const next = apply(payload);
            opts.afterApply?.({ action, row: payload, rows: next });
            return next;
        }

        // guard: tell caller to use async variant
        throw new Error('mutateRows called with enrichCreate$ — use mutateRowsAsync instead');
    }

    /** Async mutate variant (supports `enrichCreate$`). */
    async mutateRowsAsync<T = any>(rows: T[], action: TableAct, payload: T | any, opts: MutateOpts<T> = {}): Promise<T[]> {
        if (action === 'create' && opts.enrichCreate$) {
            const enriched = await firstValueFrom(opts.enrichCreate$(payload));
            const next = this.mutateRows(rows, action, enriched, { ...opts, enrichCreate$: undefined });
            opts.afterApply?.({ action, row: enriched, rows: next });
            return next;
        }
        const next = this.mutateRows(rows, action, payload, opts);
        return next;
    }

    /** 🍯 Sugar: apply table change + optionally call renderRows(), return next rows. */
    applyTableChange<T = any>(
        rows: T[],
        action: TableAct,
        payload: any,
        opts: MutateOpts<T>,
        renderRows?: () => void
    ): Promise<T[]> {
        return this.mutateRowsAsync(rows, action, payload, opts).then(next => {
            renderRows?.();
            return next;
        });
    }

    /**
     * Build a deep-link profile URL for items that live on a feature page.
     *
     * Examples:
     *  /projects/new-edit/12/abysmalwhore/tasks?taskId=2&slug=@abysmalwhore-test-10link
     *  /projects/new-edit/94/dronewolf/socials?linkId=5&slug=@dronewolf-soundcloud
     *  /projects/new-edit/94/dronewolf/socials?socialId=7&slug=@dronewolf-instagram
     */
    buildProfileSlug(
        artist: any,
        groupSlug: string,
        row: any,
        opts: {
            featurePath: string;          // "tasks" | "socials"
            idParam?: string;             // "taskId" | "linkId" | "socialId"
            labelKeys?: string[];         // e.g. ["title", "username", "url"]
        }
    ): string {
        const featurePath = opts.featurePath;
        const idParam = opts.idParam;
        const labelKeys = (opts.labelKeys && opts.labelKeys.length)
            ? opts.labelKeys
            : ['title', 'username', 'url'];

        const handle = artist?.profile_url || `@${groupSlug}`;

        // pick the first non-empty label
        let rawLabel = '';
        for (const key of labelKeys) {
            if (row && row[key]) {
                rawLabel = String(row[key]);
                break;
            }
        }

        const base = rawLabel
            .toString()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();

        const slugBase = base ? `${handle}-${base}` : handle;

        const id = row?.id;

        // 🔑 THIS is what adds ?linkId= / ?socialId=
        if (idParam && id) {
            return `/projects/new-edit/${artist?.id}/${groupSlug}/${featurePath}` +
                `?${idParam}=${id}&slug=${slugBase}`;
        }

        // fallback: slug-only if we somehow don't have the id yet
        return `/projects/new-edit/${artist?.id}/${groupSlug}/${featurePath}?slug=${slugBase}`;
    }


    ////// SIMPLE REUSED CALLS

    getArtistMembers(aristId) {
      return this.artistMembersService.getAllForArtist(aristId);
    }
}
