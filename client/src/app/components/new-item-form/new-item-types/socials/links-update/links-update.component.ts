import {
    Component,
    Input,
    OnInit,
    Inject,
    Optional,
    ChangeDetectorRef
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { AlertService } from 'src/app/services/alert.service';
import citiesData from 'cities.json';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface CityEntry {
    name: string;
    country: string;
    subcountry?: string;
}

@Component({
    selector: 'app-linksUpdate',
    templateUrl: './links-update.component.html',
    styleUrls: ['./links-update.component.scss']
})
export class LinksUpdateComponent implements OnInit {
    currentUser: any;
    @Input() record: any;

    adminForm: FormGroup = this.formBuilder.group({});
    newRecord: any = null;

    displayedColumns: string[] = [];

    action: string;
    tool: string;
    local_data: any[] = [];
    currentGroup: { name: string; id: any } | null = null;

    uploaderNeeds = ['image', 'video', 'document', 'song'];
    uploaderInstalled = false;
    modUser = false;

    selectedRelations = '';

    cityOptions: string[] = [];
    filteredCities: string[] = [];

    phoneError = '';
    emailError = '';

    private readonly phonePattern = /^[0-9+()\-\s]{7,20}$/;
    private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService,
        public dialogRef: MatDialogRef<LinksUpdateComponent>,
        private cdr: ChangeDetectorRef,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.currentUser = this.authenticationService.currentUserValue || {};

        // Always work on a safe clone
        const incoming: any = { ...(data || {}) };
        console.log('[LinksUpdateComponent] dialog data:', incoming);

        // Action
        this.action = incoming.action || 'Add';

        // Tool normalization
        const rawTool = String(incoming.tool || 'artist-links');
        const normalizedTool = rawTool.endsWith('s')
            ? rawTool.slice(0, -1)
            : rawTool;
        this.tool = normalizedTool;
        delete incoming.tool;

        // Enforce owner + active flags
        if (!incoming.owner_user) {
            incoming.owner_user = this.currentUser.id;
        }
        if (typeof incoming.active === 'undefined') {
            incoming.active = 1;
        }

        // Local row backing the form
        this.local_data = [{ ...incoming }];

        // Columns list (if needed for generic handling)
        this.displayedColumns = Object.keys(this.local_data[0] || {});

        // Group context
        if (incoming.group && incoming.owner_id != null) {
            this.currentGroup = {
                name: incoming.group,
                id: incoming.owner_id
            };
        } else {
            this.currentGroup = null;
        }

        // Are we editing an existing record?
        this.modUser = !!incoming.id && incoming.id !== '';

        this.requiresUploader();

        // Cities dataset
        const entries: CityEntry[] = (citiesData as any[]).map((c: any) => ({
            name: c.name,
            country: c.country,
            subcountry: c.subcountry
        }));

        const labels = entries.map(c =>
            c.subcountry ? `${c.name}, ${c.subcountry}` : c.name
        );

        this.cityOptions = Array.from(new Set(labels)).sort((a, b) =>
            a.localeCompare(b)
        );

        const initialCity = this.local_data?.[0]?.city || '';
        this.updateFilteredCities(initialCity);
    }

    async ngOnInit(): Promise<void> {}

    /* ======================================================================
       CITY AUTOCOMPLETE
       ====================================================================== */

    onCityInputChange(value: string): void {
        this.local_data[0].city = value;
        this.updateFilteredCities(value);
    }

    onCitySelected(value: string): void {
        this.local_data[0].city = value;
    }

    private updateFilteredCities(term: string): void {
        const q = (term || '').toLowerCase();

        if (!q) {
            this.filteredCities = this.cityOptions.slice(0, 25);
            return;
        }

        this.filteredCities = this.cityOptions
            .filter(label => label.toLowerCase().includes(q))
            .slice(0, 25);
    }

    /* ======================================================================
       ACTIONS
       ====================================================================== */

    doAction(): void {
        const payload = {
            ...this.local_data[0]
        };

        this.dialogRef.close({ event: this.action, data: payload });
    }

    closeDialog(): void {
        this.dialogRef.close({ event: 'Cancel' });
    }

    requiresUploader(): boolean {
        if (this.uploaderNeeds.indexOf(this.tool) !== -1) {
            this.uploaderInstalled = true;
            return true;
        }
        this.uploaderInstalled = false;
        return false;
    }

    ngAfterContentChecked(): void {
        this.cdr.detectChanges();
    }

    updateUploadValue(e: any): void {
        this.local_data[0][e.field] = e.val;
    }

    getRelation(e: any): void {
        this.local_data[0]['relation'] = e;
        this.selectedRelations = this.local_data[0]['relation'];
    }

    archiveContact(): void {
        if (!this.modUser) {
            this.closeDialog();
            return;
        }

        const archived: any = {
            ...this.local_data[0],
            owner_user: this.currentUser.id,
            owner_group: this.data?.owner_id,
            id: this.data?.id,
            active: 0
        };

        this.dialogRef.close({
            event: 'delete',
            data: archived
        });
    }
}
