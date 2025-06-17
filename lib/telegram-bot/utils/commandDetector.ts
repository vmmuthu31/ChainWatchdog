import { CommandType } from "../types";

export function detectCommand(command: string): CommandType {
  // Normalize commands by removing '/' and '@botUsername' if present
  const normalizedCommand = command.toLowerCase();

  switch (normalizedCommand) {
    case "start":
      return CommandType.START;

    case "help":
      return CommandType.HELP;

    case "scan":
    case "scanwallet":
    case "wallet":
      return CommandType.SCAN_WALLET;

    case "check":
    case "contract":
    case "checkcontract":
      return CommandType.CHECK_CONTRACT;

    case "honeypot":
    case "hp":
      return CommandType.HONEYPOT;

    default:
      return CommandType.UNKNOWN;
  }
}
