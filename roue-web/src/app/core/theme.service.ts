import { Injectable } from '@angular/core';

type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storageKey = 'roue_theme_mode';
  // Prefer new key; fall back to legacy 'theme' if present; default to 'auto'
  private mode: ThemeMode = (() => {
    try {
      const m = localStorage.getItem(this.storageKey) as ThemeMode | null;
      if (m === 'dark' || m === 'light' || m === 'auto') return m;
      const legacy = localStorage.getItem('theme');
      if (legacy === 'dark' || legacy === 'light') return legacy as ThemeMode;
    } catch {}
    return 'auto';
  })();
  private sunrise: Date | null = null;
  private sunset: Date | null = null;
  private timer: any = null;

  init() {
    this.applyCurrent();
    if (this.mode === 'auto') this.scheduleAuto();
  }

  setMode(mode: ThemeMode) {
    this.mode = mode;
    localStorage.setItem(this.storageKey, mode);
    this.applyCurrent();
    this.clearTimer();
    if (mode === 'auto') this.scheduleAuto();
  }

  // Expose current mode for UI
  getMode(): ThemeMode {
    return this.mode;
  }

  // Compute which theme should be active based on mode (without applying it)
  currentTheme(): 'light' | 'dark' {
    if (this.mode === 'dark') return 'dark';
    if (this.mode === 'light') return 'light';
    return this.isNightNow() ? 'dark' : 'light';
  }

  private applyCurrent() {
    this.setHtmlTheme(this.currentTheme());
  }

  private setHtmlTheme(theme: 'light'|'dark') {
    const el = document.documentElement; // Bootstrap looks for [data-bs-theme]
    el.setAttribute('data-bs-theme', theme);
  }

  private scheduleAuto() {
    this.clearTimer();
    this.computeSunTimes().then(() => {
      const now = new Date();
      const next = this.nextBoundaryAfter(now);
      const ms = next ? (next.getTime() - now.getTime()) : 30 * 60 * 1000; // fallback 30m
      this.timer = setTimeout(() => {
        this.applyCurrent();
        // reschedule for the following boundary
        this.scheduleAuto();
      }, Math.max(1000, ms));
    });
  }

  private clearTimer() { if (this.timer) { clearTimeout(this.timer); this.timer = null; } }

  private isNightNow(): boolean {
    const now = new Date();
    const s = this.sunrise, e = this.sunset;
    if (!s || !e) return this.simpleNight(now);
    return now < s || now >= e;
  }

  private nextBoundaryAfter(now: Date): Date | null {
    const s = this.sunrise, e = this.sunset;
    if (!s || !e) return null;
    if (now < s) return s;
    if (now < e) return e;
    // compute tomorrow
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    this.computeSunTimesForDate(tomorrow).catch(() => {});
    // after recompute, pick sunrise of tomorrow
    return this.sunrise;
  }

  private async computeSunTimes(): Promise<void> {
    const now = new Date();
    try {
      const coords = await this.getCoords();
      const { sunrise, sunset } = this.sunTimes(now, coords.latitude, coords.longitude);
      this.sunrise = sunrise; this.sunset = sunset;
    } catch {
      // fallback: 06:00–19:00 local
      this.sunrise = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
      this.sunset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0);
    }
  }

  private async computeSunTimesForDate(date: Date): Promise<void> {
    try {
      const coords = await this.getCoords();
      const { sunrise, sunset } = this.sunTimes(date, coords.latitude, coords.longitude);
      this.sunrise = sunrise; this.sunset = sunset;
    } catch {}
  }

  private getCoords(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) { reject('no-geo'); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve(pos.coords),
        () => reject('denied'),
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 86400000 }
      );
    });
  }

  private simpleNight(now: Date): boolean {
    const h = now.getHours();
    return (h < 6 || h >= 19);
  }

  // NOAA sunrise/sunset algorithm (approximate). Returns local times.
  private sunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date } {
    const zenith = 90.833; // official
    const N = this.dayOfYear(date);
    const lngHour = lng / 15;
    const toLocal = (UT: number) => {
      const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
      d.setUTCHours(Math.floor(UT));
      d.setUTCMinutes(Math.floor((UT % 1) * 60));
      return d;
    };

    const calc = (isSunrise: boolean) => {
      const t = N + ((isSunrise ? 6 : 18) - lngHour) / 24;
      let M = (0.9856 * t) - 3.289;
      let L = M + (1.916 * Math.sin(this.deg2rad(M))) + (0.020 * Math.sin(this.deg2rad(2 * M))) + 282.634;
      L = (L + 360) % 360;
      let RA = this.rad2deg(Math.atan(0.91764 * Math.tan(this.deg2rad(L))));
      RA = (RA + 360) % 360;
      const Lquadrant = Math.floor(L / 90) * 90;
      const RAquadrant = Math.floor(RA / 90) * 90;
      RA = RA + (Lquadrant - RAquadrant);
      RA /= 15;
      const sinDec = 0.39782 * Math.sin(this.deg2rad(L));
      const cosDec = Math.cos(Math.asin(sinDec));
      const cosH = (Math.cos(this.deg2rad(zenith)) - (sinDec * Math.sin(this.deg2rad(lat)))) / (cosDec * Math.cos(this.deg2rad(lat)));
      if (cosH > 1 || cosH < -1) {
        // polar day/night fallback
        return isSunrise ? 6 : 18;
      }
      let H = isSunrise ? 360 - this.rad2deg(Math.acos(cosH)) : this.rad2deg(Math.acos(cosH));
      H /= 15;
      const T = H + RA - (0.06571 * t) - 6.622;
      let UT = (T - lngHour) % 24;
      if (UT < 0) UT += 24;
      return UT;
    };

    const sunriseUT = calc(true);
    const sunsetUT = calc(false);
    return { sunrise: toLocal(sunriseUT), sunset: toLocal(sunsetUT) };
  }

  private dayOfYear(d: Date): number {
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = (d.getTime() - start.getTime()) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
  private deg2rad(d: number) { return (d * Math.PI) / 180; }
  private rad2deg(r: number) { return (r * 180) / Math.PI; }
}
