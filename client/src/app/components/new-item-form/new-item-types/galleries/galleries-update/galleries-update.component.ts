import {
    Component,
    Input,
    OnInit,
    Inject,
    Optional,
    ChangeDetectorRef,
    AfterContentChecked
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import moment from 'moment';
import { GalleriesService } from 'src/app/services/galleries.service';

@Component({
    selector: 'app-galleriesUpdate',
    templateUrl: './galleries-update.component.html',
    styleUrls: ['./galleries-update.component.scss']
})
export class GalleriesUpdateComponent implements OnInit, AfterContentChecked {
    currentUser: any;
    @Input() record: any;

    adminForm = this.formBuilder.group({});
    newRecord: any = null;

    displayedColumns: string[] = [];

    action: string;
    tool: string;
    local_data: any[];
    currentGroup: any = null;

    uploaderNeeds: string[] = ['image', 'video', 'document', 'song'];
    uploaderInstalled = false;
    modUser = false;

    selectedTags: any = '';

    // curated gallery “genres” = gallery types
    galleryGenreOptions: { value: string; label: string; }[] = [
        { value: 'live',         label: 'Live Photos'      },
        { value: 'promo',        label: 'Promo Photos'     },
        { value: 'bts',          label: 'Behind the Scenes'},
        { value: 'studio',       label: 'Studio Session'   },
        { value: 'rehearsal',    label: 'Rehearsal'        },
        { value: 'tour',         label: 'Tour Diary'       },
        { value: 'merch',        label: 'Merch Shoot'      },
        { value: 'artwork',      label: 'Album Artwork'    },
        { value: 'coverConcept', label: 'Cover Concepts'   },
        { value: 'presskit',     label: 'Press Kit'        }
    ];

    // multi-select state – store as array in UI
    selectedGenres: string[] = [];

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService,
        public dialogRef: MatDialogRef<GalleriesUpdateComponent>,
        private cdr: ChangeDetectorRef,
        private galleriesService: GalleriesService,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.currentUser = this.authenticationService.currentUserValue;

        this.action = data.action;

        if (data.tool && data.tool.toLowerCase() === 'galleries') {
            data.tool = data.tool.slice(0, -3) + 'y';
        } else if (data.tool) {
            data.tool =
                data.tool.substring(data.tool.length - 1) === 's'
                    ? data.tool.slice(0, -1)
                    : data.tool;
        }

        this.tool = `${data.tool}`;

        delete data.tool;

        data.owner_user = this.currentUser.id;
        data.active = 1;

        console.log('Galleries dialog data: ', data);

        this.displayedColumns = Object.keys(data);
        this.local_data = [{ ...data }];

        if (this.tool === 'artist') {
            this.currentGroup = { name: this.local_data[0].name, id: this.local_data[0].id };
        } else {
            this.currentGroup = { name: 'Polarity', id: 2 };
        }

        this.modUser = !!data.id;

        // hydrate genres from existing data (string or array)
        this.selectedGenres = this.normalizeGenres(this.local_data[0].genre);

        this.requiresUploader();
    }

    ngOnInit(): void {}

    ngAfterContentChecked(): void {
        // guard against ExpressionChangedAfterItHasBeenChecked
        this.cdr.detectChanges();
    }

    /** Normalize existing genre value into a string[] */
    private normalizeGenres(val: any): string[] {
        if (!val) {
            return [];
        }

        if (Array.isArray(val)) {
            return val as string[];
        }

        if (typeof val === 'string') {
            return val
                .split(',')
                .map(x => x.trim())
                .filter(x => !!x);
        }

        return [];
    }

    /** Label helper for template – avoids arrow func in template */
    getGenreLabel(value: string): string {
        const found = this.galleryGenreOptions.find(g => g.value === value);
        return found ? found.label : value;
    }

    /** When user changes gallery types */
    onGenresChange(values: string[]): void {
        this.selectedGenres = values || [];
        // persist as comma-separated string for now (backwards compatible)
        this.local_data[0].genre = this.selectedGenres.join(',');
    }

    requiresUploader(): boolean {
        if (this.uploaderNeeds.indexOf(this.tool) !== -1) {
            this.uploaderInstalled = true;
            return true;
        }
        return false;
    }

    getDate(): string {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm: any = today.getMonth() + 1;
        let dd: any = today.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        return `${yyyy}-${mm}-${dd}`;
    }

    dateAdjust(date: any): string {
        return moment(date).format('YYYY-MM-DD');
    }

    updateUploadValue(e: { field: string; val: any }): void {
        this.local_data[0][e.field] = e.val;
    }

    getTag(e: any): void {
        this.local_data[0].tags = e;
        this.selectedTags = this.local_data[0].tags;
    }

    doAction(): void {
        // ensure genres are synced just in case
        this.local_data[0].genre = this.selectedGenres.join(',');
        this.dialogRef.close({ event: this.action, data: this.local_data[0] });
    }

    closeDialog(): void {
        this.dialogRef.close({ event: 'Cancel' });
    }

    archiveContact(): void {
        this.local_data[0].active = 0;

        this.dialogRef.close({
            event: 'Archive',
            data: this.local_data[0]
        });
    }
}
