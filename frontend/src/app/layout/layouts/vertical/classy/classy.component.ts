import {NgIf} from '@angular/common';
import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {FuseFullscreenComponent} from '@fuse/components/fullscreen';
import {FuseLoadingBarComponent} from '@fuse/components/loading-bar';
import {FuseNavigationService, FuseVerticalNavigationComponent} from '@fuse/components/navigation';
import {FuseMediaWatcherService} from '@fuse/services/media-watcher';
import {NavigationService} from 'app/core/navigation/navigation.service';
import {Navigation} from 'app/core/navigation/navigation.types';
import {UserService} from 'app/core/user/user.service';
import {User} from 'app/core/user/user.types';
import {LanguagesComponent} from 'app/layout/common/languages/languages.component';
import {MessagesComponent} from 'app/layout/common/messages/messages.component';
import {NotificationsComponent} from 'app/layout/common/notifications/notifications.component';
import {QuickChatComponent} from 'app/layout/common/quick-chat/quick-chat.component';
import {SearchComponent} from 'app/layout/common/search/search.component';
import {ShortcutsComponent} from 'app/layout/common/shortcuts/shortcuts.component';
import {UserComponent} from 'app/layout/common/user/user.component';
import {Subject, takeUntil} from 'rxjs';

@Component({
  selector: 'classy-layout',
  templateUrl: './classy.component.html',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [FuseLoadingBarComponent, FuseVerticalNavigationComponent, NotificationsComponent, UserComponent, NgIf, MatIconModule, MatButtonModule, LanguagesComponent, FuseFullscreenComponent, SearchComponent, ShortcutsComponent, MessagesComponent, RouterOutlet, QuickChatComponent]
})
export class ClassyLayoutComponent implements OnInit, OnDestroy {
  isScreenSmall: boolean;
  navigation: Navigation;
  user: User;
  private _rawNavigation: Navigation;
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  /**
   * Constructor
   */
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _navigationService: NavigationService,
    private _userService: UserService,
    private _fuseMediaWatcherService: FuseMediaWatcherService,
    private _fuseNavigationService: FuseNavigationService,
    private _httpClient: HttpClient,
  ) {
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Getter for current year
   */
  get currentYear(): number {
    return new Date().getFullYear();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Subscribe to navigation data
    this._navigationService.navigation$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((nav: Navigation) => { this._rawNavigation = nav; this._applyNavigation(); });

    this._userService.user$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((user: User) => { this.user = user; this._applyNavigation(); });

    // Subscribe to media changes
    this._fuseMediaWatcherService.onMediaChange$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(({matchingAliases}) => {
        // Check if the screen is small
        this.isScreenSmall = !matchingAliases.includes('md');
      });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Toggle navigation
   *
   * @param name
   */
  private _applyNavigation(): void
  {
    if (!this._rawNavigation) { return; }
    const isSuperAdmin = this.user?.role === 'superadmin';
    const superadminOnly = new Set(['businesses', 'users']);
    this.navigation = {
      ...this._rawNavigation,
      default: this._rawNavigation.default.filter(
        item => isSuperAdmin || !superadminOnly.has(item.id)
      ),
    };
  }

  uploadAvatar(event: Event): void
  {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) { return; }
    const fd = new FormData();
    fd.append('avatar', file);
    this._httpClient.patch<any>('/api/v1/auth/profile/', fd).subscribe({
      next: (res) =>
      {
        this._userService.user = { ...this.user, avatar: res.avatar };
      },
    });
  }

  toggleNavigation(name: string): void {
    // Get the navigation
    const navigation = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);

    if (navigation) {
      // Toggle the opened status
      navigation.toggle();
    }
  }
}
