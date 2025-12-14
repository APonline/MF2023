import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { NewItemUpdateComponent } from '../../../new-item-update/new-item-update.component';


/* services - make dynamic somehow later */
import { ArtistsService } from 'src/app/services/artists.service';
import { DocumentsService } from 'src/app/services/documents.service';

import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { MatTableDataSource } from '@angular/material/table';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { MFService } from 'src/app/services/MF.service';
import { documents } from 'src/app/models/documents.model';
import { DocumentsUpdateComponent } from './documents-update/documents-update.component';

@Component({
  selector: 'app-documentsForm',
  templateUrl: './documents-form.component.html',
  styleUrls: ['./documents-form.component.scss']
 })
export class DocumentsFormComponent implements OnInit, OnChanges {
  @Output() activeItem = new EventEmitter<any>();

  currentUser: any;
  imageKey = '';
  @Input() action: string;
  @Input() editUser: number;

  displayedColumns: string[] = [];
  dataSource=null;
  newRecord=null;

  @ViewChild(MatTable,{static:true}) table: MatTable<any>;

  @Input() updateTable: boolean;
  @Input() res: any;
  @Input() act: any;

  dataReady = false;
  @Input() tool: string;
  @Input() toolName: string;
  modeSubmit = "Submit";
  delUser = false;
  projectTypeClicked = false;

  thisUser: '';
  toolSet: any = [];
  modelSet: any;
  @Input() group: string;
  @Input() groupId: string;

  adminForm = this.formBuilder.group({});

  startDate = new Date(2022, 0, 1);

  root = environment.root;
  artist: any;
  model = documents;

  public readonly GENRES: Array<{ value: string; label: string; color: string; icon: string }> = [
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

  public selectedGenre: string | null = null;
  public searchText: string = '';
  public bucketedDocs: Array<{ genre: string; label: string; color: string; icon: string; items: any[] }> = [];


  constructor(
      public dialog: MatDialog,
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private user: UserService,
      private router: Router,
      private DialogService: DialogService,
      private alertService: AlertService,
      private artistsService: ArtistsService,
      private documentsService: DocumentsService,
      private authenticationService: AuthenticationService,
      private uploadService: FileUploadService,
      public MF: MFService
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

  //mf-nov7
  ngOnInit() {
    this.imageKey = this.MF.buildImageKey(this.toolName);
    this.artistsService.get(this.groupId).subscribe(res => {
      this.artist = res;
    });
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.imageKey = this.MF.buildImageKey(this.toolName);
    if (!this.updateTable) return;

    this.MF.mutateRowsAsync(this.dataSource ?? [], this.act, this.res, {
        // generic table behavior
        updateKeys: this.displayedColumns, // PUT: only update visible columns
    }).then(next => {
        this.dataSource = next;
        this.table.renderRows();
    });
  }

  private getGenreCfg(value: string | null | undefined) {
    const v = (value || '').toString().trim().toLowerCase();
    return this.GENRES.find(g => g.value === v) || this.GENRES.find(g => g.value === 'other')!;
  }

  // Call this after loadData() sets toolSet
  private buildBuckets(): void {
      const rows = Array.isArray(this.toolSet) ? [...this.toolSet] : [];

      // Filter (optional)
      const q = this.searchText.trim().toLowerCase();
      const filtered = rows.filter(r => {
          if (this.selectedGenre && (r.genre || '').toString().toLowerCase() !== this.selectedGenre) {
              return false;
          }
          if (!q) return true;

          const hay = `${r.title || ''} ${r.description || ''} ${r.location_url || ''}`.toLowerCase();
          return hay.includes(q);
      });

      // Group
      const map = new Map<string, any[]>();
      for (const row of filtered) {
          const cfg = this.getGenreCfg(row.genre);
          const key = cfg.value;
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(row);
      }

      // Build sorted buckets in the order of GENRES
      this.bucketedDocs = this.GENRES
          .map(g => ({
              genre: g.value,
              label: g.label,
              color: g.color,
              icon: g.icon,
              items: (map.get(g.value) || []).sort((a, b) => (a.title || '').localeCompare(b.title || ''))
          }))
          .filter(b => b.items.length); // hide empty buckets (you can change this later)
  }

  //mf-nov7
  async loadData() {
    this.MF.load(this.tool, { scope: 'allForArtist', artistId: this.groupId })
        .subscribe(result => {
            this[this.tool] = result.rows;
            this.toolSet = result.rows || [];

            this.setSettings(this.toolSet);
            this.buildBuckets();
        });
  }

  public onFiltersChanged(): void {
    this.buildBuckets();
  }

  // Open doc in a new tab (basic version)
  public onOpenDoc(doc: any): void {
      const loc = (doc?.location_url || '').toString().trim();
      if (!loc) return;

      // If your backend stores relative paths, you can upgrade this later to use FileUploadService like Library does.
      window.open(loc, '_blank');
  }

  //mf-nov7
  setSettings(formData: any[]) {
    const { displayedColumns, formGroup, newRecord, rows } =
      this.MF.buildFromData(formData?.length ? formData : this.toolSet, {
        exclude: ["active", "createdAt", "updatedAt"],
        includeAction: true,
        pinnedOrder: ["id", "title"],
        modelKeys: this.model.keys(),
        mutateRows: true
      });

    this.displayedColumns = displayedColumns;
    this.adminForm = formGroup;
    this.newRecord = newRecord;
    this.dataSource = new MatTableDataSource(this.toolSet);
    this.dataSource = this.dataSource.data;
  }

  //mf-nov7
  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  //mf-nov7
  openDialog(action: string, row: any): void {
    const data = this.MF.buildDialogCtx({
        action,
        toolName: this.toolName,
        artist: this.artist,
        currentUser: this.currentUser,
        seed: row
    });

    this.MF
        .openUpdateDialog<typeof data, { event: string; data: any }>(
            DocumentsUpdateComponent,
            data
        )
        .subscribe(result => {
            if (!result || !result.data) {
                return;
            }

            const ev = (result.event || '').toString().toLowerCase();

            const isCreate = ev === 'add' || ev === 'create';
            const isUpdate = ev === 'update' || ev === 'put';
            const isDelete = ev === 'delete' || ev === 'archive';

            const base = result.data || {};

            // Build a clean payload for API
            const title = (base.title || '').toString().trim();
            const locationUrl = (base.location_url || '').toString().trim();

            const payload: any = this.MF
                .compose(base)
                .with({
                    owner_user: this.currentUser?.id,
                    owner_group: this.artist?.id,
                    owner_gallery: 0,
                    active: 1,
                    views: base.views ?? 0,
                    profile_url:
                        `${this.artist?.profile_url || ''}-` +
                        `${title}`
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/-+/g, '-')
                })
                .done();

            // Basic guard (prevents empty rows)
            if (!title) {
                this.alertService.error('Title is required.', true);
                return;
            }

            if ((isCreate || isUpdate) && !locationUrl) {
                this.alertService.error('Please upload a document file.', true);
                return;
            }

            // DELETE (soft archive recommended)
            if (isDelete) {
                if (!payload.id) {
                    return;
                }

                this.documentsService.update(payload.id, { active: 0 }).subscribe({
                    next: () => {
                        this.toolSet = (this.toolSet || []).filter((d: any) => d.id !== payload.id);
                        this.dataSource = (this.dataSource || []).filter((d: any) => d.id !== payload.id);
                        this.table?.renderRows?.();
                        this.buildBuckets();
                        this.alertService.success('Document archived.', true);
                    },
                    error: err => {
                        console.error('Archive document failed', err);
                        this.alertService.error('Failed to archive document.', true);
                    }
                });

                return;
            }

            // CREATE
            if (isCreate) {
                const createPayload = { ...payload };
                delete createPayload.id;

                this.documentsService.create(createPayload).subscribe({
                    next: created => {
                        // normalize created id across API response shapes
                        const id =
                            created?.id ??
                            created?.data?.id ??
                            created?.data?.[0]?.id ??
                            (Array.isArray(created) ? created[0]?.id : undefined);

                        const finalRow = { ...payload, ...(created?.data || created), id };

                        this.toolSet = [...(this.toolSet || []), finalRow];
                        this.dataSource = [...(this.dataSource || []), finalRow];

                        this.table?.renderRows?.();
                        this.buildBuckets();

                        this.alertService.success('Document created.', true);
                    },
                    error: err => {
                        console.error('Create document failed', err, createPayload);
                        this.alertService.error('Failed to create document.', true);
                    }
                });

                return;
            }

            // UPDATE
            if (isUpdate) {
                if (!payload.id) {
                    this.alertService.error('Missing document id for update.', true);
                    return;
                }

                this.documentsService.update(payload.id, payload).subscribe({
                    next: updated => {
                        const finalRow = { ...payload, ...(updated?.data || updated) };

                        const patch = (arr: any[]) =>
                            (arr || []).map((d: any) => (d.id === finalRow.id ? { ...d, ...finalRow } : d));

                        this.toolSet = patch(this.toolSet);
                        this.dataSource = patch(this.dataSource);

                        this.table?.renderRows?.();
                        this.buildBuckets();

                        this.alertService.success('Document updated.', true);
                    },
                    error: err => {
                        console.error('Update document failed', err, payload);
                        this.alertService.error('Failed to update document.', true);
                    }
                });

                return;
            }

            // Fallback (if event names are weird)
            this.activeItem.emit({ action: result.event, data: payload });
        });
  }

}
