import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { ToastrService } from 'ngx-toastr';
import { BdTourService } from 'bandeira-ui';

import { AuthService } from '../auth/auth.service';
import { apiPaths } from '../http/api-paths';
import type { User } from '../models/user.model';
import { OnboardingService } from './onboarding.service';

const user = (status: User['onboarding_status'], id = 7): User => ({
  id,
  name: 'Pessoa Teste',
  email: 'teste@example.test',
  data_nascimento: null,
  genero: null,
  peso: null,
  altura: null,
  avatar: null,
  nivel_atividade: null,
  objetivo: null,
  is_admin: false,
  onboarding_status: status,
  onboarding_finished_at: null,
});

describe('OnboardingService', () => {
  let service: OnboardingService;
  let http: HttpTestingController;
  let tourTarget: HTMLElement;
  const currentUser = signal<User | null>(null);
  const auth = {
    currentUser: currentUser.asReadonly(),
    setCurrentUser: jasmine.createSpy('setCurrentUser'),
  };
  const tourActive = signal(false);
  const tourOutcome = signal<{ completed: boolean; step: number } | null>(null);
  const tour = {
    active: tourActive.asReadonly(),
    outcome: tourOutcome.asReadonly(),
    start: jasmine.createSpy('start').and.callFake(() => tourActive.set(true)),
  };
  const router = { navigateByUrl: jasmine.createSpy('navigateByUrl').and.resolveTo(true) };

  beforeEach(() => {
    currentUser.set(null);
    auth.setCurrentUser.calls.reset();
    tourActive.set(false);
    tourOutcome.set(null);
    tour.start.calls.reset();
    router.navigateByUrl.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        OnboardingService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: BdTourService, useValue: tour },
        { provide: Router, useValue: router },
        { provide: ToastrService, useValue: { error: jasmine.createSpy('error') } },
        { provide: TranslocoService, useValue: { translate: () => 'Erro' } },
      ],
    });
    service = TestBed.inject(OnboardingService);
    http = TestBed.inject(HttpTestingController);
    tourTarget = document.createElement('div');
    tourTarget.dataset['tour'] = 'onboarding-dashboard';
    document.body.append(tourTarget);
  });

  afterEach(() => {
    tourTarget.remove();
    http.verify();
  });

  it('inicia automaticamente apenas para usuário com onboarding pendente', fakeAsync(() => {
    service.evaluateUser(user('completed'));
    tick();
    expect(tour.start).not.toHaveBeenCalled();

    service.evaluateUser(user('pending', 8));
    tick();
    expect(tour.start).toHaveBeenCalled();
  }));

  it('permite reabrir manualmente sem alterar o status persistido', fakeAsync(() => {
    service.restart();
    tick();
    tourActive.set(false);
    tourOutcome.set({ completed: false, step: 0 });
    tick();

    http.expectNone(apiPaths.userOnboarding());
  }));

  it('persiste o pulo e atualiza a sessão em memória', fakeAsync(() => {
    service.evaluateUser(user('pending'));
    tick();
    tourActive.set(false);
    tourOutcome.set({ completed: false, step: 0 });
    tick();

    const request = http.expectOne(apiPaths.userOnboarding());
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ status: 'skipped' });
    request.flush({ data: user('skipped'), success: true });

    expect(auth.setCurrentUser).toHaveBeenCalledWith(user('skipped'));
  }));
});
