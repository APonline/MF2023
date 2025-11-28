import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { map } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { ArtistsService } from 'src/app/services/artists.service';
import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { MatTableDataSource } from '@angular/material/table';
import { MFService } from 'src/app/services/MF.service';
import { TasksService } from 'src/app/services/tasks.service';
import { tasks } from 'src/app/models/tasks.model';
import { TaskCardComponent } from './task-card/task-card.component';
import { ArtistActivityService } from 'src/app/services/artist_activity.service';

interface Task {
    id: number;
    task: string;
    description?: string;
    status?: string;
    column_key?: string;
    sort_index?: number;

    owner_user?: number;
    owner_group?: number;
    assigned_to?: number;
    assigned_by?: number;
    completed_by?: string | Date | null;
    date_completed?: string | Date | null;

    profile_url?: string;
    priority?: string;
    assignee?: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        profile_url: string;
    };
}

interface Column {
    key: string;
    title: string;
    tasks: Task[];
}

@Component({
    selector: 'app-tasksForm',
    templateUrl: './tasks-form.component.html',
    styleUrls: ['./tasks-form.component.scss']
})
export class TasksFormComponent implements OnInit, OnChanges {
    @Output() activeItem = new EventEmitter<any>();

    currentUser: any;
    imageKey = '';
    @Input() action: string;
    @Input() editUser: number;

    displayedColumns: string[] = [];
    dataSource: any = null;
    newRecord: any = null;

    columns: Column[] = [];
    columnIds: string[] = [];
    isBoardLoading = false;
    boardError: string | null = null;

    // full, unfiltered snapshot used by the global filter
    private allColumns: Column[] = [];
    globalFilterTerm: string = '';

    sortMode: 'manual' | 'title' | 'title-backwards' | 'priority' | 'due' = 'manual';

    @ViewChild(MatTable, { static: true }) table: MatTable<any>;

    @Input() updateTable: boolean;
    @Input() res: any;
    @Input() act: any;

    dataReady = false;
    @Input() tool: string;
    @Input() toolName: string;
    modeSubmit = 'Submit';
    delUser = false;
    projectTypeClicked = false;

    thisUser: '';
    toolSet: any = [];
    modelSet: any;
    @Input() group: string;           // route segment, e.g. "abysmalwhore" (NO @)
    @Input() groupId: string;         // project id

    adminForm: FormGroup = this.formBuilder.group({});

    startDate = new Date(2022, 0, 1);

    root = environment.root;
    artist: any;
    model = tasks;

    private deepLinkTaskId: number | null = null;
    private deepLinkHandled = false;

    constructor(
        public dialog: MatDialog,
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private userService: UserService,
        private router: Router,
        private DialogService: DialogService,
        private alertService: AlertService,
        private tasksService: TasksService,
        private artistsService: ArtistsService,
        private artistActivityService: ArtistActivityService,
        private authenticationService: AuthenticationService,
        public MF: MFService
    ) {
        this.currentUser = this.authenticationService.currentUserValue;
    }

    ngOnInit(): void {
        this.imageKey = this.MF.buildImageKey(this.toolName);

        // grab ?taskId=<id> for deep links
        this.route.queryParamMap.subscribe(params => {
            const id = params.get('taskId');
            this.deepLinkTaskId = id ? +id : null;
        });

        this.artistsService.get(this.groupId).subscribe(res => {
            this.artist = res;
        });

        this.loadData();
        this.loadBoard();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.imageKey = this.MF.buildImageKey(this.toolName);
    }

    async loadData(): Promise<void> {
        this.MF.load(this.tool, { scope: 'allForArtist', artistId: this.groupId })
            .subscribe(result => {
                this[this.tool] = result.rows;
                this.toolSet = result.rows;
                this.setSettings(this.toolSet);
            });
    }

    setSettings(formData: any[]): void {
        const { displayedColumns, formGroup, newRecord } =
            this.MF.buildFromData(formData?.length ? formData : this.toolSet, {
                exclude: ['active', 'createdAt', 'updatedAt'],
                includeAction: true,
                pinnedOrder: ['id', 'task'],
                modelKeys: this.model.keys(),
                mutateRows: true
            });

        this.displayedColumns = displayedColumns;
        this.adminForm = formGroup;
        this.newRecord = newRecord;
        this.dataSource = new MatTableDataSource(this.toolSet);
        this.dataSource = this.dataSource.data;
    }

    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            if (control instanceof FormControl) {
                control.markAsTouched({ onlySelf: true });
            } else if (control instanceof FormGroup) {
                this.validateAllFormFields(control);
            }
        });
    }

    openDialog(action: string, row: any): void {
        const data = this.MF.buildDialogCtx({
            action,
            toolName: this.toolName,
            artist: this.artist,
            currentUser: this.currentUser,
            seed: row
        });

        this.MF
            .openUpdateDialog<typeof data, { event: 'create' | 'put' | 'delete'; data: any }>(
                TaskCardComponent,
                data
            )
            .subscribe(result => {
                if (!result) {
                    return;
                }

                const featurePath = this.toolName.toLowerCase(); // "tasks"

                // payload from dialog – no profile_url yet
                const basePayload = this.MF
                    .compose(result.data)
                    .with({
                        owner_group: this.artist?.id,
                        // make sure assigned_by is always set
                        assigned_by: result.data.assigned_by ?? this.currentUser.id
                    })
                    .done();

                let persist$;

                if (result.event === 'create') {
                    // Let server give us ID, then normalise
                    persist$ = this.tasksService.create(basePayload).pipe(
                        map((created: any) => {
                            let serverRow = created;
                            if (serverRow && serverRow.data) { serverRow = serverRow.data; }
                            if (serverRow && serverRow.row) { serverRow = serverRow.row; }
                            if (serverRow && Array.isArray(serverRow.rows)) {
                                serverRow = serverRow.rows[0];
                            }
                            return {
                                ...(basePayload || {}),
                                ...(serverRow || {})
                            };
                        })
                    );
                } else if (result.event === 'put') {
                    // update existing row, keep id
                    persist$ = this.tasksService.update(row.id, basePayload).pipe(
                        map(() => ({
                            ...(row || {}),
                            ...(basePayload || {})
                        }))
                    );
                } else {
                    // "delete" from dialog == archive (active: 0)
                    const archivedPayload = {
                        ...(row || {}),
                        active: 0
                    };
                    persist$ = this.tasksService.update(row.id, { active: 0 }).pipe(
                        map(() => archivedPayload)
                    );
                }

                this.updateTable = true;

                persist$.subscribe({
                    next: (effectiveRow: any) => {
                        // ensure we have ID, then build deep link if not archiving
                        if (result.event !== 'delete' && effectiveRow.id) {
                            const handle = this.artist?.profile_url || `@${this.group}`;   // e.g. "@abysmalwhore"
                            const taskSlug = (effectiveRow.task || '')
                                .toString()
                                .replace(/[^\w\s-]/g, '')
                                .replace(/\s+/g, '-')
                                .toLowerCase();

                            const slug = `${handle}-${taskSlug}`;  // "@abysmalwhore-tasky"

                            // route segment uses this.group (no @)
                            const deepLink =
                                `/projects/new-edit/${this.groupId}/${this.group}/${featurePath}` +
                                `?taskId=${effectiveRow.id}&slug=${slug}`;

                            effectiveRow.profile_url = deepLink;

                            // update just profile_url on server
                            this.tasksService.update(effectiveRow.id, { profile_url: deepLink }).subscribe();
                        }

                        // activity logger – uses row AFTER table update
                        const afterApply = ({ action, row }: { action: 'create' | 'put' | 'delete'; row: any }) => {
                            const actor = {
                                id: this.currentUser.id,
                                username: this.currentUser.username
                            };
                            const feature = {
                                feature: this.toolName.replace(/s$/i, ''), // "tasks" -> "task"
                                extra: null
                            };

                            const verb: 'create' | 'update' | 'delete' =
                                action === 'put' ? 'update' : action;

                            let verbText = '';
                            if (verb === 'create')      verbText = 'created';
                            else if (verb === 'update') verbText = 'updated';
                            else if (verb === 'delete') verbText = 'archived';

                            let color = '';
                            if (row.priority === 'none')          color = '#616161';
                            else if (row.priority === 'very_low') color = '#81c784';
                            else if (row.priority === 'low')      color = '#4caf50';
                            else if (row.priority === 'medium')   color = '#ffb300';
                            else if (row.priority === 'high')     color = '#ff7043';
                            else if (row.priority === 'very_high') color = '#f44336';
                            else if (row.priority === 'critical')  color = '#b71c1c';

                            let label = `<b style="color:${color}">${row.task}</b>`;
                            let activity: string;

                            if (verb === 'delete' || !row.profile_url) {
                                // archived / deleted – no link
                                activity = `${verbText} a task ${label}`;
                            } else {
                                // normal create/update – keep deep link
                                activity =
                                    `${verbText} a task ` +
                                    `<a href="${row.profile_url}">` +
                                    `${label}` +
                                    `</a>`;
                            }

                            this.artistActivityService
                                .logChange(
                                    activity,
                                    {
                                        actor,
                                        artistId: this.groupId,
                                        groupId: this.groupId,
                                        feature
                                    }
                                )
                                .subscribe();
                        };

                        // push into table + reload board
                        this.MF.applyTableChange(
                            this.dataSource ?? [],
                            result.event,
                            effectiveRow,
                            {
                                stripKeys: ['createdAt', 'updatedAt', 'active'],
                                updateKeys: [
                                    'task',
                                    'description',
                                    'assigned_to',
                                    'assigned_by',
                                    'status',
                                    'priority',
                                    'completed_by',
                                    'date_completed',
                                    'profile_url',
                                    'active'
                                ],
                                afterApply
                            },
                            () => this.table?.renderRows()
                        ).then(next => {
                            this.dataSource = next;
                            this.loadBoard();
                        });

                        this.activeItem.emit({ action: result.event, data: effectiveRow });
                    },
                    error: err => {
                        console.error('Failed to persist task change', err);
                        this.alertService.error('Unable to save task');
                    }
                });
            });
    }

    /**
     * Load board columns from API and then apply any active global filter.
     */
    loadBoard(): void {
        this.isBoardLoading = true;
        this.boardError = null;

        this.tasksService.getBoard().subscribe({
            next: (data: Record<string, Task[]>) => {
                const defaultKeys = ['backlog', 'todo', 'in_progress', 'done'];

                const cols: Column[] = defaultKeys.map(key => ({
                    key,
                    title: this.mapKeyToTitle(key),
                    tasks: (data[key] || []).map((t, index) => ({
                        ...t,
                        column_key: t.column_key || key,
                        sort_index: t.sort_index ?? index
                    }))
                }));

                this.allColumns = cols;

                // this will filter + sort + set this.columns / columnIds
                this.applyGlobalFilter();

                this.isBoardLoading = false;

                // deep-link handling – search full snapshot, not filtered columns
                if (this.deepLinkTaskId && !this.deepLinkHandled) {
                    const allTasks: Task[] = this.allColumns.reduce(
                        (acc: Task[], c: Column) => acc.concat(c.tasks || []),
                        []
                    );
                    const match = allTasks.find(t => t.id === this.deepLinkTaskId);

                    if (match) {
                        this.deepLinkHandled = true;
                        setTimeout(() => this.openDialog('Update', match), 0);
                    }
                }
            },
            error: err => {
                console.error('Failed to load board', err);
                this.boardError = 'Unable to load board.';
                this.isBoardLoading = false;
            }
        });
    }

    /**
     * Global text filter across all columns (task + description).
     */
    applyGlobalFilter(): void {
        const term = (this.globalFilterTerm || '').trim().toLowerCase();

        const filterTask = (t: Task): boolean => {
            if (!term) { return true; }
            const title = (t.task || '').toLowerCase();
            const desc  = (t.description || '').toLowerCase();
            return title.includes(term) || desc.includes(term);
        };

        // build filtered columns from snapshot
        this.columns = this.allColumns.map(col => ({
            ...col,
            tasks: (col.tasks || []).filter(filterTask)
        }));

        // apply sort inside each column
        this.applySortToColumns();

        this.columnIds = this.columns.map(c => c.key);
    }

    private applySortToColumns(): void {
        const priorityRank: Record<string, number> = {
            'critical':   1,
            'very_high':  2,
            'high':       3,
            'medium':     4,
            'low':        5,
            'very_low':   6,
            'none':       7
        };

        for (const col of this.columns) {
            if (!col.tasks) { continue; }

            col.tasks.sort((a, b) => {
                const ta = (a.task || '').toLowerCase();
                const tb = (b.task || '').toLowerCase();

                switch (this.sortMode) {
                    case 'title':
                        return ta.localeCompare(tb);

                    case 'title-backwards':
                        return tb.localeCompare(ta);

                    case 'priority': {
                        const pa = priorityRank[(a.priority || 'none').toLowerCase()] ?? 999;
                        const pb = priorityRank[(b.priority || 'none').toLowerCase()] ?? 999;
                        if (pa !== pb) return pa - pb;
                        return ta.localeCompare(tb);
                    }

                    case 'due': {
                        const da = a.completed_by ? new Date(a.completed_by as any).getTime() : Number.MAX_SAFE_INTEGER;
                        const db = b.completed_by ? new Date(b.completed_by as any).getTime() : Number.MAX_SAFE_INTEGER;
                        if (da !== db) return da - db;
                        return ta.localeCompare(tb);
                    }

                    case 'manual':
                    default: {
                        const ia = a.sort_index ?? 0;
                        const ib = b.sort_index ?? 0;
                        return ia - ib;
                    }
                }
            });
        }
    }



    private mapKeyToTitle(key: string): string {
        switch (key) {
            case 'todo':
                return 'To Do';
            case 'in_progress':
            case 'in-progress':
                return 'In Progress';
            case 'done':
                return 'Done';
            case 'backlog':
                return 'Backlog';
            default:
                return key.charAt(0).toUpperCase() + key.slice(1);
        }
    }

    onTaskDrop(event: CdkDragDrop<Task[]>, targetColumn: Column): void {
        const prevContainer = event.previousContainer;
        const currContainer = event.container;

        if (!prevContainer || !currContainer) {
            return;
        }

        if (prevContainer === currContainer) {
            moveItemInArray(currContainer.data, event.previousIndex, event.currentIndex);

            currContainer.data.forEach((task, idx) => {
                task.sort_index = idx;
            });

            const movedTask = currContainer.data[event.currentIndex];
            this.persistTaskMove(movedTask, targetColumn.key, movedTask.sort_index ?? event.currentIndex);
        } else {
            transferArrayItem(
                prevContainer.data,
                currContainer.data,
                event.previousIndex,
                event.currentIndex
            );

            currContainer.data.forEach((task, idx) => {
                task.sort_index = idx;
                task.column_key = targetColumn.key;
            });

            const movedTask = currContainer.data[event.currentIndex];
            this.persistTaskMove(movedTask, targetColumn.key, movedTask.sort_index ?? event.currentIndex);
        }
    }

    private persistTaskMove(task: Task, columnKey: string, sortIndex: number): void {
        if (!task || !task.id) {
            return;
        }

        const payload = {
            column_key: columnKey,
            sort_index: sortIndex,
            status: columnKey
        };

        this.tasksService.moveTask(task.id, payload).subscribe({
            next: updated => {
                Object.assign(task, updated);
            },
            error: err => {
                console.error('Failed to move task', err);
                this.loadBoard();
            }
        });
    }

    addTaskInColumn(column: Column): void {
        const payload = {
            ...this.newRecord,
            column_key: column.key
        };

        this.openDialog('Add', payload);
    }
}
