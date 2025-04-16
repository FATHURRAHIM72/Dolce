import { Routes } from '@angular/router';
import { MenuComponent } from './pages/menu/menu.component';
import { CartComponent } from './components/cart/cart.component';
import { StaffDashboardComponent } from './pages/staff-dashboard/staff-dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { TrackOrderComponent } from './pages/track-order/track-order.component';
import { LoginComponent } from './pages/login/login.component';
import { OrderConfirmationComponent } from './pages/order-confirmation/order-confirmation.component';
import { AdminUserManagementComponent } from './components/admin-user-management/admin-user-management.component';
import { AdminItemManagementComponent } from './components/admin-item-management/admin-item-management.component';
import { AdminItemOptionsComponent } from './components/admin-item-options/admin-item-options.component';
import { AdminOrderManagementComponent } from './components/admin-order-management/admin-order-management.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminSalesReportComponent } from './components/admin-sales-report/admin-sales-report.component';

export const routes: Routes = [
    { path: '', component: MenuComponent },
        { path: 'cart', component: CartComponent },
        { path: 'order-confirmation', component: OrderConfirmationComponent },
        { path: 'track-order', component: TrackOrderComponent },
        { path: 'login', component: LoginComponent },
        {
            path: 'staff-dashboard',
            component: StaffDashboardComponent,
            canActivate: [AuthGuard],
            data: { roles: ['staff'] }
        },
        {
          path: 'admin-dashboard',
          component: AdminDashboardComponent,
          canActivate: [AuthGuard], // optional
          children: [
            { path: 'users', component: AdminUserManagementComponent },
            { path: 'items', component: AdminItemManagementComponent },
            { path: 'options', component: AdminItemOptionsComponent },
            { path: 'orders', component: AdminOrderManagementComponent },
            { path: 'reports', component: AdminSalesReportComponent },
            { path: '', redirectTo: 'reports', pathMatch: 'full' }
          ]
        }

      
];
