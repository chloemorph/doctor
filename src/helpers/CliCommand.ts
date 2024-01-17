import { CommandArguments } from "@models";

export class CliCommand {
  private static cmdName: string = "localm365";
  private static retry: boolean = false;
  private static disableTracking: boolean = false;
  private static cleanQuickLaunch: boolean = false;
  private static cleanTopNavigation: boolean = false;
  public static options: CommandArguments | null = null;

  public static init(options: CommandArguments) {
    CliCommand.cmdName = options.commandName || `localm365`;
    CliCommand.retry = options.retryWhenFailed || false;
    CliCommand.disableTracking = options.disableTracking || false;
    CliCommand.cleanQuickLaunch = options.cleanQuickLaunch || false;
    CliCommand.cleanTopNavigation = options.cleanTopNavigation || false;
    CliCommand.options = Object.assign({}, options);
  }

  public static getName() {
    return CliCommand.cmdName;
  }

  public static getRetry() {
    return CliCommand.retry;
  }

  public static getDisableTracking() {
    return CliCommand.disableTracking;
  }

  public static getCleanNavigation() {
    return {
      cleanQuickLaunch: CliCommand.cleanQuickLaunch,
      cleanTopNavigation: CliCommand.cleanTopNavigation,
    };
  }
}
