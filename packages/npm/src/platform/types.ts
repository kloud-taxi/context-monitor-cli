export type MonitoredContext = {
  appName: string;
  windowTitle: string;
  url: string;
};

export interface PlatformContextProvider {
  getCurrentContext(): Promise<MonitoredContext>;
}
