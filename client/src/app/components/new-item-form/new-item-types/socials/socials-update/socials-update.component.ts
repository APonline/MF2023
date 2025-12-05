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
    selector: 'app-socialsUpdate',
    templateUrl: './socials-update.component.html',
    styleUrls: ['./socials-update.component.scss']
})
export class SocialsUpdateComponent implements OnInit {
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
        public dialogRef: MatDialogRef<SocialsUpdateComponent>,
        private cdr: ChangeDetectorRef,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.currentUser = this.authenticationService.currentUserValue || {};

        // Work on a safe clone of incoming dialog data
        const incoming: any = { ...(data || {}) };
        console.log('[SocialsUpdateComponent] dialog data:', incoming);

        // Action
        this.action = incoming.action || 'Add';

        // Tool normalization
        const rawTool = String(incoming.tool || 'socials');
        const normalizedTool = rawTool.endsWith('s')
            ? rawTool.slice(0, -1)
            : rawTool;
        this.tool = normalizedTool;
        delete incoming.tool;

        // Default ownership + active
        if (!incoming.owner_user) {
            incoming.owner_user = this.currentUser.id;
        }
        if (typeof incoming.active === 'undefined') {
            incoming.active = 1;
        }

        // Backing row for form fields
        this.local_data = [{ ...incoming }];

        // Column list if needed
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

        // Are we editing existing?
        this.modUser = !!incoming.id && incoming.id !== '';

        this.requiresUploader();

        // Cities dataset (for reuse)
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
       CITY AUTOCOMPLETE (same pattern as links dialog)
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
        // Return whatever fields we’ve edited; parent will decorate with slug etc.
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
        // treat this as "archive / disconnect social"
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
