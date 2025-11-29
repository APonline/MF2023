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
    this.artistsService.get(this.groupId).subscribe(res => {
      this.artist = res;
    });
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.imageKey = this.MF.buildImageKey(this.toolName);

    if (!this.updateTable) {
        return;
    }

    // <-- table might not be ready yet on first change
    if (!this.table) {
        this.buildRollodex();  // still keep rollodex in sync
        return;
    }
    
      if(this.act == 'create'){
        Object.keys(this.res).map(res => {
          if(res == 'createdAt' || res == 'updatedAt' || res == 'active') {
            delete this.res[res];
          }
        });

        this.dataSource.push(this.res);
        this.table.renderRows();
      }else if(this.act == 'put'){
        this.dataSource = this.dataSource.filter((value,key)=>{
          if(value.id == this.res.id){
            this.displayedColumns.map(res => {
              value[res] = this.res[res];
            })
          }
          return true;
        });
        this.table.renderRows();
      }else if(this.act == 'delete'){
        this.dataSource = this.dataSource.filter((value,key)=>{
          return value.id != this.res;
        });
      }
      this.applySort();
      this.table?.renderRows();
      this.buildRollodex();

      this.updateTable = false;
    
  }

  //mf-nov7
  async loadData() {
    this.MF.load(this.tool, { scope: 'allForArtist', artistId: this.groupId })
        .subscribe(result => {
            this[this.tool] = result.rows;
            this.toolSet = result.rows;

            this.setSettings(this.toolSet);
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

      // 🔹 apply initial sort
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
            if (!result) {
                return;
            }

            const raw = result.data || {};

            // ---- map dialog events: "Add" | "Update" | "Delete" ----
            const evt = (result.event || '').toString().toLowerCase();
            let op: 'create' | 'update' | 'delete' = 'update';

            if (evt === 'add') {
                op = 'create';
            } else if (evt === 'delete') {
                op = 'delete';
            } else {
                op = 'update';
            }

            // ---- build display name & slug ----
            const displayName = this.getContactDisplayName(raw);
            const nameForSlug =
                displayName ||
                raw.company ||
                raw.title ||
                'contact';

            const nameSlug = nameForSlug
                .toString()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .toLowerCase();

            const handle = this.artist?.profile_url || `@${this.group}`;
            const featurePath = (this.toolName || 'contacts').toLowerCase();

            const baseLink =
                `/projects/new-edit/${this.groupId}/${this.group}/${featurePath}`;

            const deepLink =
                raw.id
                    ? `${baseLink}?contactId=${raw.id}&slug=${handle}-${nameSlug}`
                    : `${baseLink}?slug=${handle}-${nameSlug}`;

            const cooked = this.MF
                .compose(raw)
                .with({
                    profile_url: deepLink,
                    owner_group: this.artist?.id
                })
                .done();

            // ---- LOCAL TABLE / ROLODEX UPDATE (no page refresh) ----
            if (!Array.isArray(this.dataSource)) {
                this.dataSource = [];
            }

            if (op === 'create') {
                // add to array
                this.dataSource = [...this.dataSource, cooked];
            } else if (op === 'update') {
                // replace in array
                this.dataSource = this.dataSource.map((c: any) =>
                    c.id === cooked.id ? { ...c, ...cooked } : c
                );
            } else if (op === 'delete') {
                // remove from array
                this.dataSource = this.dataSource.filter(
                    (c: any) => c.id !== cooked.id
                );
            }

            // keep the legacy table view happy if it's present
            this.table?.renderRows?.();

            // re-sort + rebuild card grid
            this.applySort();
            this.buildRollodex();

              // --- log artist activity (like tasks) ---
            const actor = {
                id: this.currentUser.id,
                username: this.currentUser.username
            };

            const feature = {
                feature: (this.toolName || 'Contact').replace(/s$/i, ''), // "Contacts" -> "Contact"
                extra: null
            };

            const verb: 'create' | 'update' | 'delete' =
                op === 'create'
                    ? 'create'
                    : op === 'delete'
                    ? 'delete'
                    : 'update';

            let verbText = '';
            if (verb === 'create')      verbText = 'created';
            else if (verb === 'update') verbText = 'updated';
            else if (verb === 'delete') verbText = 'deleted';

            const label = `<b>${displayName || nameForSlug}</b>`;

            const activity =
                verb === 'delete' || !cooked.profile_url
                    ? `${verbText} a contact ${label}`
                    : `${verbText} a contact ` +
                      `<a href="${cooked.profile_url}">${label}</a>`;

            this.artistActivityService
                .logChange(activity, {
                    actor,
                    artistId: this.groupId,
                    groupId: this.groupId,
                    feature
                })
                .subscribe();

            // still tell the parent so it can persist / log / whatever
            this.activeItem.emit({ action: op, data: cooked });
        });
  }


  private buildRollodex(): void {
      const term = (this.rollodexFilterTerm || '').trim().toLowerCase();

      // always build from the current table rows
      let list = [...(this.dataSource || [])];

      if (term) {
          list = list.filter((c: any) => {
              const name = `${c.first_name || ''} ${c.last_name || ''} ${c.company || ''} ${c.title || ''}`
                  .toLowerCase();
              const relation = (c.relation || '').toLowerCase();
              const city = (c.city || '').toLowerCase();

              return name.includes(term) || relation.includes(term) || city.includes(term);
          });
      }

      const safe = (v: any) => (v || '').toString().toLowerCase();

      list.sort((a: any, b: any) => {
          switch (this.rollodexSortMode) {
              case 'relation': {
                  const ar = safe(a.relation);
                  const br = safe(b.relation);
                  if (ar !== br) {
                      return ar.localeCompare(br);
                  }
                  return safe(a.first_name).localeCompare(safe(b.first_name));
              }

              case 'city': {
                  const ac = safe(a.city);
                  const bc = safe(b.city);
                  if (ac !== bc) {
                      return ac.localeCompare(bc);
                  }
                  return safe(a.first_name).localeCompare(safe(b.first_name));
              }

              case 'name':
              default: {
                  const an = `${safe(a.first_name)} ${safe(a.last_name)}`.trim() || safe(a.company) || safe(a.title);
                  const bn = `${safe(b.first_name)} ${safe(b.last_name)}`.trim() || safe(b.company) || safe(b.title);
                  return an.localeCompare(bn);
              }
          }
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
          this.buildRollodex();
      }
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

  // 🔹 sort contacts based on sortKey
  applySort(): void {
      if (!this.dataSource || !Array.isArray(this.dataSource)) {
          return;
      }

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

          return aVal.localeCompare(bVal);
      });

      this.table?.renderRows();

      this.buildRollodex();
  }


}
