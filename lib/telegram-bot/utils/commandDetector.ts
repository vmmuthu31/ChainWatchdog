import { CommandType } from "../types";

export function detectCommand(command: string): CommandType {
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

    case "networks":
    case "chains":
    case "available":
      return CommandType.NETWORKS;

    case "hi":
    case "hello":
    case "hey":
      return CommandType.GREETING;

    default:
      return CommandType.UNKNOWN;
  }
}
