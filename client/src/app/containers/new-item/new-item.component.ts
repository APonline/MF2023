import {
    Component,
    ElementRef,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { ArtistsService } from 'src/app/services/artists.service';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { environment } from 'src/environments/environment';
import { FastAverageColor } from 'fast-average-color';
import { ArtistActivityService } from 'src/app/services/artist_activity.service';

import {
    Observable,
    Subject,
    switchMap,
    startWith,
    shareReplay,
    catchError,
    of
} from 'rxjs';

@Component({
    selector: 'app-newItem',
    templateUrl: 'new-item.component.html',
    styleUrls: ['./new-item.component.scss']
})
export class NewitemComponent implements OnInit {

    @ViewChild('newEdit') public container: ElementRef;
    @ViewChildren('card') card!: QueryList<any>;

    group: string | null = null;
    groupId: string | null = null;

    artistInfo: any[] = [];
    artistInfoKeys: string[] = [];

    env = 'test';
    loaded = false;
    fac = new FastAverageColor();

    recentItems: any[] = [];
    recentItems$!: Observable<any[]>;
    private refresh$ = new Subject<void>();

    // full tool list (for "All" view)
    tools = [
        { name: 'Artist',            value: 'artist' },
        { name: 'Artist Members',    value: 'artist_members' },
        { name: 'Albums',            value: 'albums' },
        { name: 'Songs',             value: 'songs' },
        { name: 'Lyrics',            value: 'lyrics' },
        { name: 'Tasks',             value: 'tasks' },
        { name: 'Schedule',          value: 'schedule' },
        { name: 'Documents',         value: 'documents' },
        { name: 'Socials',           value: 'socials' },
        { name: 'Campaigns',         value: 'campaigns' },
        { name: 'Comments',          value: 'comments' },
        { name: 'Merch Categories',  value: 'merch_categories' },
        { name: 'Merch',             value: 'merch' },
        { name: 'Contacts',          value: 'contacts' },
        { name: 'Galleries',         value: 'galleries' },
        { name: 'Images',            value: 'images' },
        { name: 'Videos',            value: 'videos' }
    ];

    // tab group definitions
    groups = [
        {
            label: 'Office',
            key: 'office',
            tools: [
                { name: 'Artist',         value: 'artist' },
                { name: 'Artist Members', value: 'artist_members' },
                { name: 'Contacts',       value: 'contacts' },
            ]
        },
        {
            label: 'Studio',
            key: 'studio',
            tools: [
                { name: 'Albums', value: 'albums' },
                { name: 'Songs',  value: 'songs' },
                { name: 'Lyrics', value: 'lyrics' }
            ]
        },
        {
            label: 'Work',
            key: 'work',
            tools: [
                { name: 'Schedule',  value: 'schedule' },
                { name: 'Tasks',     value: 'tasks' },
                { name: 'Documents', value: 'documents' },
                { name: 'Comments',  value: 'comments' }
            ]
        },
        {
            label: 'Public',
            key: 'public',
            tools: [
                { name: 'Socials',   value: 'socials' },
                { name: 'Merch',     value: 'merch' },
                { name: 'Campaigns', value: 'campaigns' }
            ]
        },
        {
            label: 'Media',
            key: 'media',
            tools: [
                { name: 'Galleries', value: 'galleries' },
                { name: 'Images',    value: 'images' },
                { name: 'Videos',    value: 'videos' }
            ]
        }
    ];

    // currently selected group tab – 'all' means wall of everything
    activeGroupKey: string = 'all';

    bkColor = '';

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private artistsService: ArtistsService,
        private uploadService: FileUploadService,
        private artistActivityService: ArtistActivityService
    ) { }

    async ngOnInit() {
        this.env = environment.apiUrl;
        this.groupId = window.location.href.split('/')[4];
        this.group = window.location.href.split('/')[5]
            .replace(/_/g, ' ')
            .replace(/@/g, '');

        // recent activity stream
        this.recentItems$ = this.refresh$.pipe(
            startWith(void 0),
            switchMap(() => this.artistActivityService.getAll(this.groupId!)),
            catchError(_ => of([])),
            shareReplay({ bufferSize: 1, refCount: true })
        );

        this.loadArtistInfo();
    }

    private loadArtistInfo(): void {
        if (!this.groupId) {
            return;
        }

        this.artistsService.get(this.groupId).subscribe(res => {
            const obj: any = {};

            Object.keys(res).forEach(r => {
                if (
                    r !== 'createdAt' &&
                    r !== 'updatedAt' &&
                    r !== 'active' &&
                    r !== 'id' &&
                    r !== 'owner_user' &&
                    r !== 'profile_image' &&
                    r !== 'profile_banner_image' &&
                    r !== 'artist_image_1' &&
                    r !== 'artist_image_2' &&
                    r !== 'artist_image_3'
                ) {
                    obj[r] = (res as any)[r];
                    this.artistInfoKeys.push(r);
                }
            });

            // profile image
            if (res.profile_image !== 'default' && res.profile_image !== '') {
                const type = res.profile_image.split('.');
                const format = type[type.length - 1];
                this.uploadService
                    .getFile(0, res.profile_image, 'artists/' + res.id, format)
                    .subscribe(r => {
                        obj['profile_image'] = r[0].display;
                    });
            } else {
                obj['profile_image'] = './assets/images/intrologo.png';
            }
            this.artistInfoKeys.push('profile_image');

            // profile banner
            if (res.profile_banner_image !== 'default' && res.profile_banner_image !== '') {
                const type = res.profile_banner_image.split('.');
                const format = type[type.length - 1];
                this.uploadService
                    .getFile(0, res.profile_banner_image, 'artists/' + res.id, format)
                    .subscribe(r => {
                        obj['profile_banner_image'] = r[0].display;

                        const fadeBy = 0;
                        this.fac
                            .getColorAsync(r[0].display)
                            .then(color => {
                                // const co = 'rgaa(' + (fadeBy - color.value[0]) + ',' + (fadeBy - color.value[1]) + ',' + (fadeBy - color.value[2]) + ', 1)';
                                this.container.nativeElement.style.backgroundColor = color.rgba;
                                this.container.nativeElement.style.backgroundBlendMode = 'luminosity';
                            })
                            .catch(e => {
                                console.log(e);
                            });
                    });
            } else {
                obj['profile_banner_image'] = './assets/images/intrologo.png';
            }
            this.artistInfoKeys.push('profile_banner_image');

            // profile images
            for (let i = 1; i < 4; i++) {
                const key = 'artist_image_' + i;
                if (res[key] !== 'default' && res[key] !== '') {
                    const type = res[key].split('.');
                    const format = type[type.length - 1];
                    this.uploadService
                        .getFile(0, res[key], 'artists/' + res.id, format)
                        .subscribe(r => {
                            obj[key] = r[0].display;
                        });
                } else {
                    obj[key] = './assets/images/intrologo.png';
                }
                this.artistInfoKeys.push(key);
            }

            this.artistInfo.push(obj);

            setTimeout(() => {
                this.loaded = true;
            }, 0);
        });
    }

    reloadActivities() {
        this.refresh$.next();
    }

    cardShine(e: MouseEvent) {
        for (const card of this.card) {
            const rect = card.nativeElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.nativeElement.style.setProperty('--mouse-x', `${x}px`);
            card.nativeElement.style.setProperty('--mouse-y', `${y}px`);
        }
    }

    // ----- tab logic --------------------------------------------------------

    setActiveGroup(key: string) {
        this.activeGroupKey = key;
    }

    get filteredTools() {
        if (this.activeGroupKey === 'all') {
            return this.tools;
        }

        const group = this.groups.find(g => g.key === this.activeGroupKey);
        if (!group) {
            return this.tools;
        }

        const values = new Set(group.tools.map(t => t.value));
        return this.tools.filter(t => values.has(t.value));
    }
}
