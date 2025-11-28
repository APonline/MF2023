import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MFService } from 'src/app/services/MF.service';

interface TaskDialogSeed {
    id?: number;
    task?: string;
    description?: string;
    status?: string;
    column_key?: string;
    completed_by?: string | Date | null;
    date_completed?: string | Date | null;
    owner_group?: number;
    owner_user?: number;
    assigned_to?: number;
    assigned_by?: number;
    active?: number;
    profile_url?: string;
    [key: string]: any;
}

@Component({
    selector: 'app-task-card',
    templateUrl: './task-card.component.html',
    styleUrls: ['./task-card.component.scss']
})
export class TaskCardComponent implements OnInit {
    form: FormGroup;
    action: 'Add' | 'Update' | 'Delete';
    titleText = 'Task';

    statuses = [
        { value: 'backlog',     label: 'Backlog' },
        { value: 'todo',        label: 'To Do' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'done',        label: 'Done' }
    ];
    priority = [
        { value: 'none',     label: 'None' },
        { value: 'very_low',        label: 'Very Low' },
        { value: 'low',        label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high',        label: 'High' },
        { value: 'very_high',        label: 'Very High' },
        { value: 'critical',        label: 'Critical' }
    ];

    setPriority(value: string): void {
        this.form.get('priority')?.setValue(value);
    }

    get priorityValue(): string {
        return this.form?.get('priority')?.value ?? 'none';
    }

    members = <any>[];

    constructor(
        private fb: FormBuilder,
        public MF: MFService,
        private dialogRef: MatDialogRef<TaskCardComponent, { event: string; data: any }>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
    }

    ngOnInit(): void {
        this.action = this.data.action;              // 'Add' | 'Update' | 'Delete'
        const seed: TaskDialogSeed = (this.data.seed ?? this.data) || {};

        this.titleText = this.action === 'Add' ? 'Create Task' : 'Edit Task';

        const defaultStatus = seed.status || seed.column_key || 'todo';

        const defaultPriorities = seed.priority || '';

        this.form = this.fb.group({
            id: [seed.id],
            task: [seed.task || '', Validators.required],
            description: [seed.description || ''],

            status: [defaultStatus, Validators.required],
            priority: [defaultPriorities],
            assigned_to: [seed.assigned_to ?? null, Validators.required],
            column_key: [defaultStatus],

            completed_by: [seed.completed_by || null],  
            date_completed: [seed.date_completed || null],

            owner_group: [seed.owner_group ?? this.data.artist_id ?? null],
            owner_user: [seed.owner_user ?? this.data.current_user_id ?? null],
            assigned_by: [seed.assigned_by ?? this.data.current_user_id ?? null],

            active: [seed.active != null ? seed.active : 1],
            profile_url: [seed.profile_url || '']
        });

        this.MF.getArtistMembers(this.data.artist_id).subscribe({
            next: (result: any[]) => {
                this.members = result || [];
            },
            error: (err) => {
                console.error('Failed to load members', err);
                this.members = [];
            }
        });
    }

    close(): void {
        this.dialogRef.close();
    }

    onArchive(): void {
        if (!this.form.value.id) {
            this.dialogRef.close();
            return;
        }

        this.dialogRef.close({
            event: 'delete',  
            data: this.form.value
        });
    }

    save(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            console.log('TASK FORM INVALID', this.form.value);
            return;
        }

        const value = { ...this.form.value };

        // keep status + column_key synced
        value.column_key = value.status;

        const event: 'create' | 'put' =
            this.action === 'Add' ? 'create' : 'put';

        console.log('TASK SAVE OUT', event, value);

        this.dialogRef.close({
            event,
            data: value
        });
    }

}
