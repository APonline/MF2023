import { Component, Input, OnInit, Inject, Optional, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';
import citiesData from 'cities.json';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import moment from 'moment';

interface CityOption {
    name: string;
    country: string;
    subcountry?: string;
}

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

    adminForm = this.formBuilder.group({});
    newRecord = null;

    displayedColumns: string[] = [];

    action: string;
    tool: string;
    local_data: any;
    currentGroup = null;

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
        this.currentUser = this.authenticationService.currentUserValue;

        this.action = data.action;

        (data.tool.substring(data.tool.length - 1) == 's'
            ? (data.tool = data.tool.slice(0, -1))
            : (data.tool = data.tool));
        this.tool = `${data.tool}`;

        delete data.tool;

        data.owner_user = this.currentUser.id;
        data.active = 1;

        Object.keys(data).map(res => {
            this.displayedColumns.push(res);
        });
        this.local_data = [{ ...data }];

        this.currentGroup = { name: this.data.group, id: this.data.owner_id };

        if (data.id != '') {
            this.modUser = true;
        } else {
            this.modUser = false;
        }

        this.requiresUploader();

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

    doAction() {
        // For socials, we keep this generic: return whatever fields were edited in local_data[0]
        // MF.compose() and the caller will decorate with profile_url / owner_group.
        const payload = {
            ...this.local_data[0]
        };

        this.dialogRef.close({ event: this.action, data: payload });
    }

    closeDialog() {
        this.dialogRef.close({ event: 'Cancel' });
    }

    async ngOnInit() {}

    requiresUploader() {
        if (this.uploaderNeeds.indexOf(this.tool) !== -1) {
            this.uploaderInstalled = true;
            return true;
        }
    }

    ngAfterContentChecked(): void {
        this.cdr.detectChanges();
    }

    updateUploadValue(e: any) {
        this.local_data[0][e.field] = e.val;
    }

    getRelation(e: any) {
        this.local_data[0]['relation'] = e;
        this.selectedRelations = this.local_data[0]['relation'];
    }

    archiveContact() {
        // treat this as "archive social" – soft delete
        if (!this.modUser) {
            this.closeDialog();
            return;
        }

        const archived: any = {
            ...this.local_data[0],
            owner_user: this.currentUser.id,
            owner_group: this.data.owner_id,
            id: this.data.id,
            active: 0
        };

        this.dialogRef.close({
            event: 'delete',
            data: archived
        });
    }
}
