import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import {
  WorkerDataService,
  Employee,
} from '../../services/worker-data.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
  standalone: false,
})
export class MainPage implements OnInit, OnDestroy {
  employee: Employee | null = null;
  unreadNotifications = 0;
  private notificationChannel: any = null;

  constructor(
    private router: Router,
    private supabase: SupabaseService,
    private workerData: WorkerDataService,
  ) {}

  async ngOnInit() {
    this.employee = await this.workerData.ensureEmployee();
    if (this.employee) {
      await this.refreshUnreadNotifications();
      this.setupNotificationChannel();
    }
  }

  ngOnDestroy(): void {
    this.notificationChannel &&
      this.workerData.unsubscribeChannel(this.notificationChannel);
  }

  private async refreshUnreadNotifications() {
    if (!this.employee?.id) {
      this.unreadNotifications = 0;
      return;
    }

    try {
      this.unreadNotifications =
        await this.workerData.getUnreadNotificationsCount(this.employee.id);
    } catch (e) {
      this.unreadNotifications = 0;
    }
  }

  private setupNotificationChannel() {
    if (!this.employee?.id) return;

    this.notificationChannel &&
      this.workerData.unsubscribeChannel(this.notificationChannel);
    this.notificationChannel = this.workerData.subscribeToTable(
      'notifications',
      () => {
        void this.refreshUnreadNotifications();
      },
    );
  }
}
