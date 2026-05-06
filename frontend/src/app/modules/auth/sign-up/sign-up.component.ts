import { NgIf } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector     : 'auth-sign-up',
    templateUrl  : './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
    standalone   : true,
    imports      : [RouterLink, NgIf, FuseAlertComponent, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule],
})
export class AuthSignUpComponent implements OnInit
{
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: '',
    };
    signUpForm: UntypedFormGroup;
    showAlert: boolean = false;

    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
    ) {}

    ngOnInit(): void
    {
        this.signUpForm = this._formBuilder.group({
            first_name: ['', Validators.required],
            last_name : ['', Validators.required],
            username  : ['', Validators.required],
            email     : ['', [Validators.required, Validators.email]],
            password  : ['', Validators.required],
            password2 : ['', Validators.required],
            agreements: ['', Validators.requiredTrue],
        });
    }

    signUp(): void
    {
        if ( this.signUpForm.invalid ) { return; }

        this.signUpForm.disable();
        this.showAlert = false;

        const { agreements, ...payload } = this.signUpForm.value;

        this._authService.signUp(payload).subscribe(
            () => { this._router.navigateByUrl('/sign-in'); },
            () =>
            {
                this.signUpForm.enable();
                this.signUpNgForm.resetForm();
                this.alert = { type: 'error', message: 'Registration failed. Please try again.' };
                this.showAlert = true;
            },
        );
    }
}
