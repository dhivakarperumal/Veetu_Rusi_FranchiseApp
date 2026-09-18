import { AlertButton, AlertOptions } from "react-native";

type AlertRequest = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
};

type AlertListener = (request: AlertRequest | null) => void;

let listener: AlertListener | null = null;

export const registerAlertListener = (nextListener: AlertListener) => {
  listener = nextListener;
  return () => {
    if (listener === nextListener) listener = null;
  };
};

export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => {
    listener?.({ title, message, buttons, options });
  },
};

export type { AlertRequest };
