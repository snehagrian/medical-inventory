import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  signupForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private readonly fb: FormBuilder, private readonly router: Router, private readonly authService: AuthService) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSignup() {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.signupForm.valid) {
      const { username, password } = this.signupForm.value;
      this.authService.register(username, password).subscribe({
        next: () => {
          this.successMessage = 'User created successfully!';
          setTimeout(() => this.router.navigate(['/']), 2000);
        },
        error: (err) => {
          this.errorMessage = err?.error || 'Sign up failed';
        }
      });
    } else {
      this.errorMessage = 'Please fix form errors';
      this.signupForm.markAllAsTouched();
    }
  }

  goToLogin() {
    this.router.navigate(['/']);
  }
}