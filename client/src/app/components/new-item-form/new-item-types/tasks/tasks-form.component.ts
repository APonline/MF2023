import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../../../services/authentication.service';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NewItemUpdateComponent } from '../../../new-item-update/new-item-update.component';


/* services - make dynamic somehow later */
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
    completed_by?: string | Date | null;     // due date
    date_completed?: string | Date | null;   // actual completion

    profile_url?: string;
    // add any other fields from your API if needed
}

interface Column {
    key: string;        // 'todo' | 'in_progress' | 'done'
    title: string;      // 'To Do' | 'In Progress' | 'Done'
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
  dataSource=null;
  newRecord=null;

  columns: Column[] = [];
  columnIds: string[] = [];
  isBoardLoading = false;
  boardError: string | null = null;

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
  model = tasks;

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

  ngOnInit() {
    this.imageKey = this.MF.buildImageKey(this.toolName);
    this.artistsService.get(this.groupId).subscribe(res => {
      this.artist = res;
    });
    this.loadData();
    this.loadBoard();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.imageKey = this.MF.buildImageKey(this.toolName);
  }



  async loadData() {
    this.MF.load(this.tool, { scope: 'allForArtist', artistId: this.groupId })
      .subscribe(result => {
          this[this.tool] = result.rows;
          this.toolSet = result.rows;

          this.setSettings(this.toolSet);
      });
  }

  setSettings(formData: any[]) {
    const { displayedColumns, formGroup, newRecord, rows } =
      this.MF.buildFromData(formData?.length ? formData : this.toolSet, {
        exclude: ["active", "createdAt", "updatedAt"],
        includeAction: true,
        pinnedOrder: ["id", "task"],
        modelKeys: this.model.keys(),
        mutateRows: true
      });

    this.displayedColumns = displayedColumns;
    this.adminForm = formGroup;
    this.newRecord = newRecord;
    this.dataSource = new MatTableDataSource(this.toolSet);
    this.dataSource = this.dataSource.data;
  }

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

  openDialog(action: string, row: any) {
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

            const cooked = this.MF
                .compose(result.data)
                .with({
                    profile_url: `${this.artist?.profile_url}-${(result.data?.task ?? '')
                        .toString()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/\s+/g, '')
                        .toLowerCase()}`,
                    owner_group: this.artist?.id,
                })
                .done();

            console.log('TASK DIALOG RESULT', result.event, cooked);

            // Decide which HTTP call to use
            let persist$;
            if (result.event === 'create') {
                persist$ = this.tasksService.create(cooked);
            } else if (result.event === 'put') {
                persist$ = this.tasksService.update(cooked.id, cooked);
            } else { // 'delete'
                persist$ = this.tasksService.delete(cooked.id).pipe(
                    map(() => cooked) // so downstream always has a "row"
                );
            }
            this.updateTable = true;

            persist$.subscribe({
                next: serverRow => {
                    // After server says OK, update local table rows
                    const afterApply = ({ action, row }: { action: 'create' | 'put' | 'delete'; row: any }) => {
                        const actor = { id: this.currentUser.id, username: this.currentUser.username };
                        const feature = {
                            feature: this.toolName.replace(/s$/i, ''), // "tasks" -> "task"
                            extra: null
                        };

                        const verb: 'create' | 'update' | 'delete' =
                            action === 'put' ? 'update' : action;

                        console.log('WTF – afterApply fired', action, row);

                        this.artistActivityService
                            .logMemberChange(
                                verb,
                                {
                                    type: `task titled ${row.task} in ${row.status} set as ${row.priority}`,
                                    item: row.task,
                                    link: row.profile_url
                                },
                                {
                                    actor,
                                    artistId: this.groupId,
                                    groupId: this.groupId,
                                    feature
                                }
                            )
                            .subscribe();
                    };

                    // apply local table change + log
                    this.MF.applyTableChange(
                        this.dataSource ?? [],
                        result.event,          // 'create' | 'put' | 'delete'
                        serverRow,
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
                                'profile_url'
                            ],
                            afterApply
                        },
                        () => this.table?.renderRows()
                    ).then(next => {
                        this.dataSource = next;
                        this.loadBoard();
                    });

                    // If you still want the parent to know:
                    this.activeItem.emit({ action: result.event, data: serverRow });
                },
                error: err => {
                    console.error('Failed to persist task change', err);
                    // optional: show a toast
                    this.alertService.error('Unable to save task');
                }
            });
        });
  }


  loadBoard(): void {
    this.isBoardLoading = true;
    this.boardError = null;

    this.tasksService.getBoard().subscribe({
        next: (data: Record<string, Task[]>) => {
            const defaultKeys = ['backlog', 'todo', 'in_progress', 'done'];

            const cols: Column[] = defaultKeys.map((key) => ({
                key,
                title: this.mapKeyToTitle(key),
                tasks: (data[key] || []).map((t, index) => ({
                    ...t,
                    column_key: t.column_key || key,
                    sort_index: t.sort_index ?? index
                }))
            }));

            this.columns = cols;
            this.columnIds = this.columns.map(c => c.key);
            this.isBoardLoading = false;
        },
        error: (err) => {
            console.error('Failed to load board', err);
            this.boardError = 'Unable to load board.';
            this.isBoardLoading = false;
        }
    });
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
            // Capitalize first letter by default
            return key.charAt(0).toUpperCase() + key.slice(1);
    }
  }

  onTaskDrop(event: CdkDragDrop<Task[]>, targetColumn: Column): void {
    const prevContainer = event.previousContainer;
    const currContainer = event.container;

    // No data? bail
    if (!prevContainer || !currContainer) {
        return;
    }

    if (prevContainer === currContainer) {
        // Same column: reorder inside the same array
        moveItemInArray(currContainer.data, event.previousIndex, event.currentIndex);

        // Re-index sort_index locally
        currContainer.data.forEach((task, idx) => {
            task.sort_index = idx;
        });

        const movedTask = currContainer.data[event.currentIndex];
        this.persistTaskMove(movedTask, targetColumn.key, movedTask.sort_index ?? event.currentIndex);

    } else {
        // Different column: transfer between lists
        transferArrayItem(
            prevContainer.data,
            currContainer.data,
            event.previousIndex,
            event.currentIndex
        );

        // Re-index sort_index in the target column
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
        // keep status in sync with column if you want
        status: columnKey
    };

    this.tasksService.moveTask(task.id, payload).subscribe({
        next: (updated) => {
            // Optionally merge server response back into local task
            Object.assign(task, updated);
        },
        error: (err) => {
            console.error('Failed to move task', err);
            // Optional: reload board to avoid desync
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
