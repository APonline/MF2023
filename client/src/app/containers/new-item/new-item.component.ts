import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';


@Component({
  selector: 'app-newItem',
  templateUrl: 'new-item.component.html',
  styleUrls: ['./new-item.component.scss']
 })
export class NewitemComponent implements OnInit {

    tools = [
      {name:'Companies', value:'companies'},
      {name:'Sub Companies', value:'sub_companies'},
      {name:'Discipline Categories', value:'discipline_categories'},
      {name:'Disciplines', value:'disciplines'},
      {name:'Onboarding Material Type', value:'onboarding_material_type'},
      // {name:'Onboarding Materials', value:'onboarding_materials'},
      {name:'Permissions', value:'permissions'},
      {name:'Special Roles', value:'special_roles'},
      {name:'Statuses', value:'statuses'},
    ]

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
    ) {
    }

    ngOnInit() {

    }
}
