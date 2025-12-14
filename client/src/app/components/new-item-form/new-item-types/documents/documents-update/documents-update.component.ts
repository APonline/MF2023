import {
    Component,
    Input,
    OnInit,
    Inject,
    Optional,
    ChangeDetectorRef
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
    FormBuilder,
    FormGroup,
    Validators
} from '@angular/forms';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FileUploadService } from 'src/app/services/file-upload.service';

@Component({
    selector: 'app-documentsUpdate',
    templateUrl: './documents-update.component.html',
    styleUrls: ['./documents-update.component.scss']
})
export class DocumentsUpdateComponent implements OnInit {
    currentUser: any;

    @Input() record: any;

    action: string;
    tool: string;
    local_data: any;
    currentGroup: any = null;

    // stepper
    isLinear = true;
    submitted = false;
    modUser = false;

    // ✅ Document genre buckets (match DocumentsForm list)
    public readonly GENRES: Array<{ value: string; label: string; color?: string; icon?: string }> = [
        { value: 'receipts', label: 'Receipts & Expenses', color: 'g-red', icon: 'receipt_long' },
        { value: 'invoices', label: 'Invoices & Quotes', color: 'g-orange', icon: 'request_quote' },
        { value: 'tax', label: 'Tax Documents', color: 'g-purple', icon: 'account_balance' },
        { value: 'banking', label: 'Banking / Statements', color: 'g-green', icon: 'credit_card' },
        { value: 'budgets', label: 'Budgets / Financial Plans', color: 'g-blue', icon: 'savings' },

        { value: 'contracts', label: 'Contracts & Agreements', color: 'g-purple', icon: 'gavel' },
        { value: 'permits', label: 'Permits & Licenses', color: 'g-orange', icon: 'verified' },
        { value: 'insurance', label: 'Insurance', color: 'g-blue', icon: 'shield' },
        { value: 'copyright', label: 'Copyright / Publishing', color: 'g-purple', icon: 'copyright' },

        { value: 'tabs', label: 'Tabs / Sheet Music', color: 'g-red', icon: 'music_note' },
        { value: 'lyrics', label: 'Lyrics / Chord Sheets', color: 'g-red', icon: 'notes' },
        { value: 'setlists', label: 'Setlists', color: 'g-orange', icon: 'format_list_bulleted' },
        { value: 'epk', label: 'Press / EPK', color: 'g-blue', icon: 'campaign' },
        { value: 'tour', label: 'Tour / Travel Docs', color: 'g-green', icon: 'travel_explore' },
        { value: 'rider', label: 'Tech Rider / Stage Plot', color: 'g-purple', icon: 'graphic_eq' },

        { value: 'notes', label: 'Meeting Notes', color: 'g-blue', icon: 'sticky_note_2' },
        { value: 'projects', label: 'Project Docs', color: 'g-blue', icon: 'assignment' },
        { value: 'marketing', label: 'Marketing Plans', color: 'g-orange', icon: 'ads_click' },
        { value: 'merch', label: 'Merch / Orders', color: 'g-green', icon: 'local_mall' },
        { value: 'manuals', label: 'Gear Manuals / Warranties', color: 'g-green', icon: 'build' },

        { value: 'reference', label: 'Reference', color: 'g-blue', icon: 'book' },
        { value: 'other', label: 'Other', color: 'g-gray', icon: 'folder' }
    ];

    // ✅ forms aligned to Documents dialog
    firstFormGroup: FormGroup = this.formBuilder.group({
        title: ['', Validators.required],
        description: [''],
        genre: ['other']
    });

    secondFormGroup: FormGroup = this.formBuilder.group({
        location_url: ['']
    });

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private uploadService: FileUploadService,
        private authenticationService: AuthenticationService,
        public dialogRef: MatDialogRef<DocumentsUpdateComponent>,
        private cdr: ChangeDetectorRef,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.currentUser = this.authenticationService.currentUserValue;

        this.action = data?.action || 'Update';

        // Normalize tool like other dialogs, but documents are always "document"
        let t = (data?.tool || 'document').toString();
        if (t.substring(t.length - 1) === 's') {
            t = t.slice(0, -1);
        }
        this.tool = t.toLowerCase();

        // seed / local data
        const seed = { ...(data || {}) };

        // enforce ownership + active
        seed.owner_user = this.currentUser?.id;
        seed.active = 1;

        // local_data is your dialog convention
        this.local_data = [{ ...seed }];

        // group context for uploader
        this.currentGroup = {
            name: this.local_data[0].groupName,
            id: this.local_data[0].groupId
        };

        // Are we editing?
        this.modUser = !!(seed.id && seed.id !== '');

        // Ensure defaults (esp new record)
        if (!this.local_data[0].genre) {
            this.local_data[0].genre = 'other';
        }

        // Patch forms from seed (keeps stepper happy)
        this.firstFormGroup.patchValue({
            title: this.local_data[0].title || '',
            description: this.local_data[0].description || '',
            genre: (this.local_data[0].genre || 'other').toString().toLowerCase()
        });

        this.secondFormGroup.patchValue({
            location_url: this.local_data[0].location_url || ''
        });
    }

    get f() {
        return this.firstFormGroup.controls;
    }

    ngOnInit(): void {}

    ngAfterContentChecked(): void {
        // keeps mat-stepper/preview stable when upload callback updates fields
        this.cdr.detectChanges();
    }

    /**
     * Confirm & close dialog
     */
    doAction(): void {
        // sync local_data from forms (single source of truth)
        const title = (this.firstFormGroup.value.title || '').toString().trim();
        const description = (this.firstFormGroup.value.description || '').toString().trim();
        const genre = (this.firstFormGroup.value.genre || 'other').toString().toLowerCase();
        const location_url = (this.local_data[0].location_url || this.secondFormGroup.value.location_url || '').toString().trim();

        // extension
        const extension = this.getExtensionFromLocation(location_url);

        // Build payload for parent
        const newEdits: any = {
            id: this.local_data[0].id,
            owner_user: this.currentUser?.id,
            owner_group: this.local_data[0].owner_group || this.data?.groupId || this.currentGroup?.id,
            owner_gallery: 0, // docs don't use galleries
            title,
            description,
            genre,
            tags: '', // docs not using tags
            extension,
            views: this.local_data[0].views ?? 0,
            profile_url: this.local_data[0].profile_url || '',
            location_url,
            active: 1
        };

        this.dialogRef.close({ event: this.action, data: newEdits });
    }

    closeDialog(): void {
        this.dialogRef.close({ event: 'Cancel' });
    }

    /**
     * Uploader callback.
     * Your <app-upload-single> emits { field, val } — keep that convention.
     */
    updateUploadValue(e: any): void {
        if (!e || !e.field) {
            return;
        }

        this.local_data[0][e.field] = e.val;

        if (e.field === 'location_url') {
            // keep form control in sync (optional but clean)
            this.secondFormGroup.patchValue({ location_url: e.val });

            // You *can* hydrate a signed URL here later if needed.
            // For now we just keep raw location_url and let openDoc() try it.
        }
    }

    /**
     * Used by summary view
     */
    public getGenreLabel(value: string): string {
        const v = (value || '').toString().toLowerCase();
        const match = (this.GENRES || []).find(g => g.value === v);
        return match ? match.label : '';
    }

    /**
     * Used by summary view "Open document"
     * If location_url is not directly reachable, we can swap to uploadService.getFile later.
     */
    public openDoc(url: string): void {
        const u = (url || '').toString().trim();
        if (!u) return;

        window.open(u, '_blank');
    }

    private getExtensionFromLocation(location: string): string {
        const loc = (location || '').toString().trim();
        if (!loc) return '';

        const parts = loc.split('.');
        if (!parts.length) return '';

        const ext = (parts[parts.length - 1] || '').toLowerCase();
        return ext;
    }
}
