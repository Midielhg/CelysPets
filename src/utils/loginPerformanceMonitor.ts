// Performance monitoring utility for login operations
export class LoginPerformanceMonitor {
  private static startTime: number | null = null;
  private static metrics: { [key: string]: number } = {};

  static startLogin() {
    this.startTime = Date.now();
    this.metrics = {};
    console.log('🏁 Login performance monitoring started');
  }

  static recordStep(stepName: string) {
    if (!this.startTime) return;
    
    const elapsed = Date.now() - this.startTime;
    this.metrics[stepName] = elapsed;
    console.log(`⏱️ ${stepName}: ${elapsed}ms`);
  }

  static endLogin() {
    if (!this.startTime) return;
    
    const totalTime = Date.now() - this.startTime;
    console.log('🎯 Login Performance Summary:');
    console.log(`📊 Total Time: ${totalTime}ms`);
    
    Object.entries(this.metrics).forEach(([step, time]) => {
      console.log(`   ${step}: ${time}ms`);
    });

    // Performance alerts
    if (totalTime > 5000) {
      console.warn('🐌 SLOW LOGIN: Total time exceeded 5 seconds');
    } else if (totalTime < 1000) {
      console.log('⚡ FAST LOGIN: Under 1 second!');
    }

    this.startTime = null;
    this.metrics = {};
  }

  static isSlowStep(stepName: string): boolean {
    const time = this.metrics[stepName];
    if (!time) return false;

    const slowThresholds: { [key: string]: number } = {
      'Auth Complete': 2000,
      'Profile Fetched': 1000,
      'Profile Created': 500,
      'Login Complete': 3000
    };

    return time > (slowThresholds[stepName] || 1000);
  }
}