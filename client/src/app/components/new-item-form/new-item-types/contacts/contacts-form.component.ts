import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import moment from 'moment';

/* services - make dynamic somehow later */
import { ArtistsService } from 'src/app/services/artists.service';
import { ContactsService } from 'src/app/services/contacts.service';


import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { MatTableDataSource } from '@angular/material/table';
import { FileUploadService } from 'src/app/services/file-upload.service';
import { ContactUpdateComponent } from './contact-update/contact-update.component';
import { MFService } from 'src/app/services/MF.service';
import { contacts } from 'src/app/models/contacts.model';
import { ArtistActivityService } from 'src/app/services/artist_activity.service';

@Component({
  selector: 'app-contactsForm',
  templateUrl: './contacts-form.component.html',
  styleUrls: ['./contacts-form.component.scss']
 })
export class ContactsFormComponent implements OnInit, OnChanges {
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
  model = contacts;

  rollodexContacts: any[] = [];
  rollodexFilterTerm: string = '';
  rollodexSortMode: 'name' | 'relation' | 'city' = 'name';
  sortKey: 'name' | 'relation' | 'city' = 'relation';
  sortDirection: 'asc' | 'desc' = 'asc';

  private deepLinkContactId: number | null = null;
  private deepLinkHandled = false;

  constructor(
      public dialog: MatDialog,
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private user: UserService,
      private router: Router,
      private DialogService: DialogService,
      private alertService: AlertService,
      private artistsService: ArtistsService,
      private contactsService: ContactsService,
      private authenticationService: AuthenticationService,
      private uploadService: FileUploadService,
      private artistActivityService: ArtistActivityService,
      public MF: MFService
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
  }

  //mf-nov7
  ngOnInit() {
    this.imageKey = this.MF.buildImageKey(this.toolName);

    this.route.queryParamMap.subscribe(params => {
        const id = params.get('contactId');
        this.deepLinkContactId = id ? +id : null;
    });

    this.artistsService.get(this.groupId).subscribe(res => {
      this.artist = res;
    });
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.imageKey = this.MF.buildImageKey(this.toolName);

    if (changes['groupId'] && !changes['groupId'].firstChange) {
        this.artistsService.get(this.groupId).subscribe(res => {
            this.artist = res;
            this.loadData();          
        });
    }
    
  }

  //mf-nov7
  async loadData() {
    this.MF.load(this.tool, { scope: 'allForArtist', artistId: this.groupId })
        .subscribe(result => {
            this[this.tool] = result.rows;
            this.toolSet = result.rows;

            this.setSettings(this.toolSet);

            if (this.deepLinkContactId && !this.deepLinkHandled && Array.isArray(this.toolSet)) {
                const match = this.toolSet.find((c: any) => c.id === this.deepLinkContactId);

                if (match) {
                    this.deepLinkHandled = true;

                    // open the contact card popup
                    setTimeout(() => this.openDialog('Update', match), 0);
                }
            }
        });
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

      this.applySort();

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
  openDialog(action: string, row: any) {
    const seed = this.MF
        .compose(row || {})
        .with({ owner_id: this.artist?.id, group: this.artist?.name })
        .done();

    const data = this.MF.buildDialogCtx({
        action,
        toolName: this.toolName,
        artist: this.artist,
        currentUser: this.currentUser,
        seed
    });

    this.MF
        .openUpdateDialog<typeof data, { event: string; data: any }>(
            ContactUpdateComponent,
            data
        )
        .subscribe(result => {
            if (!result) return;

            const raw   = result.data || {};
            const evt   = (result.event || action || '').toString().toLowerCase();
            const rowId = row?.id ?? null;
            const rawId = raw?.id ?? null;
            const hasId = !!(rawId ?? rowId);

            let op: 'create' | 'update' | 'delete';
            if (evt === 'delete')      op = 'delete';
            else if (!hasId)           op = 'create';
            else                       op = 'update';

            const targetId = (rawId ?? rowId) || null;

            // ---- common helper to build slug + deepLink ----
            const buildDeepLink = (id: number | null, src: any): string | null => {
                if (!id) return null;

                const displayName = this.getContactDisplayName(src);
                const nameForSlug =
                    displayName || src.company || src.title || 'contact';

                const nameSlug = nameForSlug
                    .toString()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .toLowerCase();

                const handle      = this.artist?.profile_url || `@${this.group}`;
                const featurePath = (this.toolName || 'contacts').toLowerCase();
                const baseLink    =
                    `/projects/new-edit/${this.groupId}/${this.group}/${featurePath}`;

                return `${baseLink}?contactId=${id}&slug=${handle}-${nameSlug}`;
            };

            // ---- base payload WITHOUT profile_url (we might add it below) ----
            const baseCore = this.MF
                .compose(raw)
                .with({
                    id: targetId || undefined,
                    owner_group: this.artist?.id,
                    owner_user: raw.owner_user ?? this.currentUser.id,
                    active: op === 'delete' ? 0 : 1
                })
                .done();

            let persist$;

            if (op === 'create') {
                // CREATE: first call with no profile_url, then patch it after we know id
                persist$ = this.contactsService.create(baseCore);
            } else if (op === 'update') {
                if (!targetId) {
                    this.alertService.error('Unable to update Contact (no id).');
                    return;
                }

                // For UPDATE we already know the id, so we can build deepLink now
                const deepLink = buildDeepLink(targetId, baseCore);

                if (deepLink) {
                    (baseCore as any).profile_url = deepLink;   // make sure effectiveRow sees it
                }

                const basePayload = {
                    ...baseCore,
                    profile_url: deepLink || undefined
                };

                persist$ = this.contactsService.update(targetId, basePayload);
            } else {
                // DELETE (soft) – mirror tasks: just mark active = 0
                if (!targetId) {
                    this.alertService.error('Unable to delete Contact (no id).');
                    return;
                }
                persist$ = this.contactsService.update(targetId, { active: 0 });
            }

            persist$.subscribe({
                next: (serverRes: any) => {
                    // normalise response
                    let serverRow = serverRes;
                    if (serverRow && serverRow.data) serverRow = serverRow.data;
                    if (serverRow && serverRow.row)  serverRow = serverRow.row;
                    if (serverRow && Array.isArray(serverRow.rows)) {
                        serverRow = serverRow.rows[0];
                    }

                    let effectiveRow: any = {
                        ...(baseCore || {}),
                        ...(serverRow || {})
                    };

                    if (!effectiveRow.id && targetId) {
                        effectiveRow.id = targetId;
                    }

                    // If this was a CREATE, now we know id, so compute deepLink
                    if (op === 'create' && effectiveRow.id) {
                        const deepLink = buildDeepLink(effectiveRow.id, effectiveRow);
                        if (deepLink) {
                            effectiveRow.profile_url = deepLink;

                            // one *extra* tiny call ONLY for create
                            this.contactsService
                                .update(effectiveRow.id, {
                                    id: effectiveRow.id,
                                    profile_url: deepLink
                                })
                                .subscribe({
                                    error: err =>
                                        console.warn('[contacts] profile_url patch failed', err)
                                });
                        }
                    }

                    // ---- local table / rolodex ----
                    if (!Array.isArray(this.dataSource)) {
                        this.dataSource = [];
                    }

                    if (op === 'create') {
                        this.dataSource = [...this.dataSource, effectiveRow];
                    } else if (op === 'update') {
                        this.dataSource = this.dataSource.map((c: any) =>
                            c.id === effectiveRow.id ? { ...c, ...effectiveRow } : c
                        );
                    } else if (op === 'delete') {
                        this.dataSource = this.dataSource.filter(
                            (c: any) => c.id !== effectiveRow.id
                        );
                    }

                    this.table?.renderRows?.();
                    this.applySort();
                    this.buildRollodex();

                    // ---- activity ----
                    const displayName = this.getContactDisplayName(effectiveRow);
                    const nameForSlug =
                        displayName ||
                        effectiveRow.company ||
                        effectiveRow.title ||
                        'contact';

                    const nameSlug = nameForSlug
                        .toString()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .toLowerCase();

                    const actor = {
                        id: this.currentUser.id,
                        username: this.currentUser.username
                    };

                    const feature = {
                        feature: (this.toolName || 'Contact').replace(/s$/i, ''),
                        extra: null
                    };

                    const verb: 'create' | 'update' | 'delete' = op;
                    let verbText = '';
                    if (verb === 'create')      verbText = 'created';
                    else if (verb === 'update') verbText = 'updated';
                    else if (verb === 'delete') verbText = 'deleted';

                    const label = `<b>${displayName || nameSlug}</b>`;

                    const activity =
                        verb === 'delete' || !effectiveRow.profile_url
                            ? `${verbText} a contact ${label}`
                            : `${verbText} a contact ` +
                              `<a href="${effectiveRow.profile_url}" style="color:#fff">${label}</a>`;

                    this.artistActivityService
                        .logChange(activity, {
                            actor,
                            artistId: this.groupId,
                            groupId: this.groupId,
                            feature
                        })
                        .subscribe();

                    this.activeItem.emit({ action: op, data: effectiveRow });
                },
                error: err => {
                    console.error('Failed to persist contact change', err);
                    this.alertService.error('Unable to save contact');
                }
            });
        });
  }


  private buildRollodex(): void {
    const term = (this.rollodexFilterTerm || '').trim().toLowerCase();
    let list = [...(this.dataSource || [])];

    if (term) {
        list = list.filter((c: any) => {
            const name = `${c.first_name || ''} ${c.last_name || ''} ${c.company || ''} ${c.title || ''}`.toLowerCase();
            const relation = (c.relation || '').toLowerCase();
            const city = (c.city || '').toLowerCase();
            return name.includes(term) || relation.includes(term) || city.includes(term);
        });
    }

    const safe = (v: any) => (v || '').toString().toLowerCase();

    list.sort((a: any, b: any) => {
        let result = 0;

        switch (this.rollodexSortMode) {
            case 'relation': {
                const ar = safe(a.relation);
                const br = safe(b.relation);
                result = ar.localeCompare(br);
                if (result === 0) {
                    result = safe(a.first_name).localeCompare(safe(b.first_name));
                }
                break;
            }

            case 'city': {
                const ac = safe(a.city);
                const bc = safe(b.city);
                result = ac.localeCompare(bc);
                if (result === 0) {
                    result = safe(a.first_name).localeCompare(safe(b.first_name));
                }
                break;
            }

            case 'name':
            default: {
                const an = `${safe(a.first_name)} ${safe(a.last_name)}`.trim()
                    || safe(a.company) || safe(a.title);
                const bn = `${safe(b.first_name)} ${safe(b.last_name)}`.trim()
                    || safe(b.company) || safe(b.title);
                result = an.localeCompare(bn);
                break;
            }
        }

        return this.sortDirection === 'asc' ? result : -result;
    });

    this.rollodexContacts = list;
  }


  onRollodexFilterChange(term: string): void {
      this.rollodexFilterTerm = term;
      this.buildRollodex();
  }

  onRollodexSortChange(mode: string): void {
    if (mode === 'name' || mode === 'relation' || mode === 'city') {
        this.rollodexSortMode = mode;
        this.sortKey = mode;          // keep table + rolodex in sync
        this.applySort();             // table
        this.buildRollodex();         // cards
    }
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applySort();
    this.buildRollodex();
  }


  getContactDisplayName(contact: any): string {
      const first = contact.first_name || '';
      const last = contact.last_name || '';
      const nick = contact.company || '';

      if (first || last) {
          return `${first} ${last}`.trim();
      }

      return nick || contact.title || 'Untitled Contact';
  }

  getContactInitials(contact: any): string {
      const name = this.getContactDisplayName(contact);
      const parts = name.split(' ').filter(Boolean);

      if (!parts.length) {
          return '?';
      }

      if (parts.length === 1) {
          return parts[0].charAt(0).toUpperCase();
      }

      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  applySort(): void {
    if (!this.dataSource || !Array.isArray(this.dataSource)) return;

    const key = this.sortKey;

    this.dataSource.sort((a: any, b: any) => {
        let aVal = '';
        let bVal = '';

        if (key === 'name') {
            aVal = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
            bVal = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
        } else {
            aVal = (a[key] || '').toString().toLowerCase();
            bVal = (b[key] || '').toString().toLowerCase();
        }

        const cmp = aVal.localeCompare(bVal);
        return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    this.table?.renderRows();
    this.buildRollodex();
  }



}
