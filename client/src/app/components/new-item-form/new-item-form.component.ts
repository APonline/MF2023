import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { AlertService } from 'src/app/services/alert.service';
import { environment } from 'src/environments/environment';
import moment from 'moment';
import { NewItemUpdateComponent } from '../new-item-update/new-item-update.component'

import { MatTable } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'src/app/services/dialog.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-newItemForm',
  templateUrl: './new-item-form.component.html',
  styleUrls: ['./new-item-form.component.scss']
 })
export class NewItemFormComponent implements OnInit {
  public currentUser: Observable<any>;
  @Input() action: string;
  @Input() editUser: number;

  displayedColumns: string[] = [];
  dataSource=null;
  newRecord=null;

  @ViewChild(MatTable,{static:true}) table: MatTable<any>;

  dataReady = false;
  tool = "";
  toolName = "";
  modeSubmit = "Submit";
  delUser = false;
  projectTypeClicked = false;

  companies: any = [];
  subCompanies: any = [];
  personnelCategories: any = [];
  disciplines: any = [];
  disciplineCategories: any = [];
  specialRoles: any = [];
  permissions: any = [];
  statuses: any = [];
  materialTypes: any = [];
  materials: any = [];
  myMaterials: any;
  thisUser: '';
  toolSet: any = [];

  adminForm = this.formBuilder.group({});

  newEditForm = this.formBuilder.group({
    fname: new FormControl('', Validators.required),
    lname: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    mobile_phone: '',
    office_phone: '',
    company: new FormControl('', Validators.required),
    sub_company: '',
    personnel_category: new FormControl('', Validators.required),
    discipline: new FormControl('', Validators.required),
    discipline_category: new FormControl('', Validators.required),
    special_role: new FormControl('', Validators.required),
    permissions: new FormControl('', Validators.required),
    start_date: new FormControl('', Validators.required),
    end_date: new FormControl('', Validators.required),
    srs_package: false,
    atc1_package: false,
    atc2_package: false,
    eg_package: false,
    as_package: false,
    status: '',
    notes: '',
    timestamp: '',
  });

  startDate = new Date(2022, 0, 1);

  root = environment.root;

    constructor(
        public dialog: MatDialog,
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private user: UserService,
        private router: Router,
        private DialogService: DialogService,
        private alertService: AlertService,
        private authenticationService: AuthenticationService
    ) {
      //this.currentUser = this.authenticationService.currentUserValue;

    }

    ngOnInit() {

      if(this.root != "") {
        this.tool = window.location.href.split('/')[7]; //uat site
      }else{
        this.tool = window.location.href.split('/')[5]; // local or domain root
      }

      this.toolName = this.tool.replace(/_/g," ");


      this.loadData();
    }

    async loadData() {
      // await this.companyService.getAll().subscribe(res => {
      //   this.companies = res;
      //   if (this.tool=="companies") {
      //     this.toolSet = this.companies;
      //     this.setSettings(this.toolSet);
      //   }
      // });
      // await this.subCompanyService.getAll().subscribe(res => {
      //   this.subCompanies = res;
      //   if (this.tool=="sub_companies") {
      //     this.toolSet = this.subCompanies;
      //     this.setSettings(this.toolSet);
      //   }
      // });
      // await this.personnelService.getAll().subscribe(res => {
      //   this.personnelCategories = res;
      //   if (this.tool=="personnel_categories") {
      //     this.toolSet = this.personnelCategories;
      //     this.setSettings(this.toolSet);
      //   }
      // });
      // await this.discplineService.getAll().subscribe(res => {
      //   this.disciplines = res;
      //   if (this.tool=="disciplines") {
      //     this.toolSet = this.disciplines;
      //     this.setSettings(this.toolSet);
      //   }
      // });
      // await this.discplineCatService.getAll().subscribe(res => {
      //   this.disciplineCategories = res;
      //   if (this.tool=="discipline_categories") {
      //     this.toolSet = this.disciplineCategories;
      //     this.setSettings(this.toolSet);
      //   }
      // });
      // await this.specialRoleService.getAll().subscribe(res => {
      //   this.specialRoles = res;
      //   if (this.tool=="special_roles") {
      //     this.toolSet = this.specialRoles;
      //     this.setSettings(this.toolSet);
      //   }
      // });
      // await this.permissionsService.getAll().subscribe(res => {
      //   this.permissions = res;
      //   if (this.tool=="permissions") {
      //     this.toolSet = this.permissions;
      //     this.setSettings(this.toolSet);
      //   }
      // });
      // await this.statusService.getAll().subscribe(res => {
      //   this.statuses = res;
      //   if (this.tool=="statuses") {
      //     this.toolSet = this.statuses;
      //     this.setSettings(this.toolSet);
      //   }
      // });
      // await this.onboardingMaterialTypeService.getAll().subscribe(res => {
      //   this.materialTypes = res;
      //   if (this.tool=="onboarding_material_type") {
      //     this.toolSet = this.materialTypes;
      //     this.setSettings(this.toolSet);
      //   }
      // });
      // await this.onboardingMaterialService.getAll().subscribe(res => {
      //   this.materials = res;
      //   if (this.tool=="onboarding_materials") {
      //     this.toolSet = this.materials;
      //     this.setSettings(this.toolSet);
      //   }
      // });

    }

    setSettings(formData){
      let form ={};
      let newForm ={}

      Object.keys(formData[0]).map(res => {
        if(res != 'createdAt' && res != 'updatedAt' && res != 'active') {
          this.displayedColumns.push(res);
          form[res] = new FormControl('');
          newForm[res] = '';
        }
      });


      this.displayedColumns.push('action');

      this.toolSet.map((res,i) => {
        delete res.active;
        delete res.createdAt;
        delete res.updatedAt;
      })

      this.dataSource = new MatTableDataSource(this.toolSet);
      this.newRecord = newForm;
      this.adminForm = new FormGroup(form);
    }

    dateAdjust(date) {
      return moment(date).format("YYYY-MM-DD");
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

    createNew(data) {
      delete data.id;
      delete data.action;

      // if (this.tool=="companies") {
      //   this.companyService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="sub_companies") {
      //   this.subCompanyService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="personnel_categories") {
      //   this.personnelService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="disciplines") {
      //   this.discplineService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="discipline_categories") {
      //   this.discplineCatService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="special_roles") {
      //   this.specialRoleService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="permissions") {
      //   this.permissionsService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="statuses") {
      //   this.statusService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="onboarding_material_type") {
      //   this.onboardingMaterialTypeService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // } else if (this.tool=="onboarding_materials") {
      //   this.onboardingMaterialService.create(data).subscribe(async res => { this.alertService.success('Item has been created!', true); });
      // }

    }

    update(data) {
      let id = data.id;
      delete data.id;
      delete data.action;

      // if (this.tool=="companies") {
      //   this.companyService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="sub_companies") {
      //   this.subCompanyService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="personnel_categories") {
      //   this.personnelService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="disciplines") {
      //   this.discplineService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="discipline_categories") {
      //   this.discplineCatService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="special_roles") {
      //   this.specialRoleService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="permissions") {
      //   this.permissionsService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="statuses") {
      //   this.statusService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="onboarding_material_type") {
      //   this.onboardingMaterialTypeService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // } else if (this.tool=="onboarding_materials") {
      //   this.onboardingMaterialService.update(id,data).subscribe(async res => { this.alertService.success('Item has been updated!', true); });
      // }

    }

    delete(id){
      // if (this.tool=="companies") {
      //   this.companyService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="sub_companies") {
      //   this.subCompanyService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="personnel_categories") {
      //   this.personnelService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="disciplines") {
      //   this.discplineService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="discipline_categories") {
      //   this.discplineCatService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="special_roles") {
      //   this.specialRoleService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="permissions") {
      //   this.permissionsService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="statuses") {
      //   this.statusService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="onboarding_material_type") {
      //   this.onboardingMaterialTypeService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // } else if (this.tool=="onboarding_materials") {
      //   this.onboardingMaterialService.delete(id).subscribe(async res => { this.alertService.success('Item has been deleted!', true); });
      // }

    }





    openDialog(action,obj) {
      obj.action = action;
      const dialogRef = this.dialog.open(NewItemUpdateComponent, {
        width: '95%',
        data:obj
      });

      dialogRef.afterClosed().subscribe(result => {
        if(result.event == 'Add'){
          this.addRowData(result.data);
        }else if(result.event == 'Update'){
          this.updateRowData(result.data);
        }else if(result.event == 'Delete'){
          this.deleteRowData(result.data);
        }
      });
    }

    addRowData(row_obj){
      var d = new Date();
      let newRec = {};

      this.displayedColumns.map(res => {
        newRec[res] = row_obj[res];
      })

      newRec['id'] = 0;
      this.dataSource.push(newRec);
      this.table.renderRows();
      this.createNew(row_obj);
    }
    updateRowData(row_obj){
      this.dataSource = this.dataSource.filter((value,key)=>{
        if(value.id == row_obj.id){
          this.displayedColumns.map(res => {
            value[res] = row_obj[res];
          })
        }
        return true;
      });
      this.update(row_obj);
    }
    deleteRowData(row_obj){
      this.dataSource = this.dataSource.filter((value,key)=>{
        return value.id != row_obj.id;
      });
      this.delete(row_obj.id);
    }

}
