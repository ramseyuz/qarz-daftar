import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';

export const appRoutes: Route[] = [

    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'dashboard' },

    // Auth routes for guests
    {
        path            : '',
        canActivate     : [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component       : LayoutComponent,
        data            : { layout: 'empty' },
        children        : [
            { path: 'confirmation-required', loadChildren: () => import('app/modules/auth/confirmation-required/confirmation-required.routes') },
            { path: 'forgot-password',       loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.routes') },
            { path: 'reset-password',        loadChildren: () => import('app/modules/auth/reset-password/reset-password.routes') },
            { path: 'sign-in',               loadChildren: () => import('app/modules/auth/sign-in/sign-in.routes') },
            { path: 'sign-up',               loadChildren: () => import('app/modules/auth/sign-up/sign-up.routes') },
        ],
    },

    // Auth routes for authenticated users
    {
        path            : '',
        canActivate     : [AuthGuard],
        canActivateChild: [AuthGuard],
        component       : LayoutComponent,
        data            : { layout: 'empty' },
        children        : [
            { path: 'sign-out',       loadChildren: () => import('app/modules/auth/sign-out/sign-out.routes') },
            { path: 'unlock-session', loadChildren: () => import('app/modules/auth/unlock-session/unlock-session.routes') },
        ],
    },

    // Admin routes
    {
        path            : '',
        canActivate     : [AuthGuard],
        canActivateChild: [AuthGuard],
        component       : LayoutComponent,
        resolve         : { initialData: initialDataResolver },
        children        : [
            { path: 'dashboard',           loadChildren: () => import('app/modules/admin/dashboard/dashboard.routes') },
            { path: 'businesses',          loadChildren: () => import('app/modules/admin/businesses/businesses.routes') },
            { path: 'customers',           loadChildren: () => import('app/modules/admin/customers/customers.routes') },
            { path: 'debts',               loadChildren: () => import('app/modules/admin/debts/debts.routes') },
            { path: 'payments',            loadChildren: () => import('app/modules/admin/payments/payments.routes') },
            { path: 'users',               loadChildren: () => import('app/modules/admin/users/users.routes') },
            { path: 'subscription-plans',  loadChildren: () => import('app/modules/admin/subscription-plans/subscription-plans.routes') },
            { path: 'subscriptions',       loadChildren: () => import('app/modules/admin/subscriptions/subscriptions.routes') },
        ],
    },
];
